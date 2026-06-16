import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createServer } from "node:http";
import { createUseCases, rateProfiles } from "./use-cases.mjs";

const config = {
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: toInt(process.env.PORT, 3000),
  trustProxy: process.env.TRUST_PROXY === "true",
  jwtSecret: process.env.WP_AI_JWT_SECRET?.trim() || "",
  jwtAudience: process.env.WP_AI_JWT_AUDIENCE?.trim() || "3dpolitics-ai",
  jwtIssuer: process.env.WP_AI_JWT_ISSUER?.trim() || "3dpolitics.xyz",
  litellmBaseUrl: process.env.LITELLM_API_BASE_URL?.trim() || "http://litellm:4000",
  litellmApiKey: process.env.LITELLM_API_KEY?.trim() || "",
  maxBodyBytes: toInt(process.env.MAX_BODY_BYTES, 16_384),
  requestTimeoutMs: toInt(process.env.LITELLM_TIMEOUT_MS, 45_000)
};

const useCases = createUseCases(process.env);
const rateWindows = new Map();
const dayWindows = new Map();

const server = createServer(async (req, res) => {
  const requestId = `req_${randomUUID()}`;

  try {
    setBaseHeaders(res, requestId);
    const url = new URL(req.url ?? "/", "http://localhost");
    const pathname = url.pathname;

    if (req.method === "GET" && pathname === "/ai/v1/health") {
      return sendJson(res, 200, {
        status: "ok",
        service: "3dpolitics-ai-gateway",
        litellm_base_url: config.litellmBaseUrl,
        litellm_key_configured: Boolean(config.litellmApiKey),
        use_cases: Object.keys(useCases)
      });
    }

    if (req.method === "GET" && pathname.startsWith("/ai/v1/use-cases/") && pathname.endsWith("/public")) {
      const useCaseId = pathname.slice("/ai/v1/use-cases/".length, -"/public".length);
      const useCase = useCases[useCaseId];
      if (!useCase) {
        return sendError(res, 404, "invalid_request", "Unknown use case.", requestId);
      }
      return sendJson(res, 200, useCase.publicConfig);
    }

    if (req.method === "POST" && pathname === "/ai/v1/execute") {
      const auth = req.headers.authorization;
      if (!auth?.startsWith("Bearer ")) {
        return sendError(res, 401, "unauthorized", "Missing access token.", requestId);
      }
      if (!config.jwtSecret) {
        return sendError(res, 503, "service_unavailable", "AI gateway auth is not configured.", requestId);
      }
      if (!config.litellmApiKey) {
        return sendError(res, 503, "service_unavailable", "LiteLLM is not configured yet.", requestId);
      }

      const claims = verifyHs256Jwt(auth.slice("Bearer ".length), config.jwtSecret, {
        issuer: config.jwtIssuer,
        audience: config.jwtAudience
      });

      const body = await readJsonBody(req, config.maxBodyBytes);
      const useCaseId = typeof body?.use_case === "string" ? body.use_case.trim() : "";
      const useCase = useCases[useCaseId];
      if (!useCase) {
        return sendError(res, 404, "invalid_request", "Unknown use case.", requestId);
      }

      if (!claims.use_cases.includes(useCaseId)) {
        return sendError(res, 403, "forbidden", "This use case is not allowed.", requestId);
      }

      if (!useCase.allowedTiers.includes(claims.tier)) {
        return sendError(res, 403, "forbidden", "Your current access tier is not allowed.", requestId);
      }

      if (useCase.requiresLogin && claims.role === "anonymous") {
        return sendError(res, 403, "forbidden", "Login is required for this use case.", requestId);
      }

      const ip = getClientIp(req);
      const validatedInput = useCase.validateInput(body.input ?? {});
      const context = validateContext(body.context);

      enforceRateLimits({
        useCase,
        tier: claims.tier,
        subjectId: claims.sub,
        sessionId: claims.sid,
        ip,
        requestId
      });

      const prompt = useCase.buildPrompt(validatedInput, context, claims);
      const litellmResponse = await callLiteLlm({
        model: useCase.model,
        systemPrompt: prompt.systemPrompt,
        userPrompt: prompt.userPrompt,
        maxOutputTokens: useCase.maxOutputTokens,
        temperature: useCase.temperature,
        metadata: {
          request_id: requestId,
          use_case: useCase.id,
          wordpress_user_id: claims.sub,
          wordpress_role: claims.role,
          wordpress_tier: claims.tier,
          page_id: context.page_id ?? claims.page_id ?? null,
          page_slug: context.page_slug ?? null,
          provider_hint: useCase.provider
        },
        user: claims.sub
      });

      const text = extractAssistantText(litellmResponse).trim();
      const usage = {
        provider: useCase.provider,
        model: litellmResponse.model || useCase.model,
        input_tokens: litellmResponse.usage?.prompt_tokens ?? 0,
        output_tokens: litellmResponse.usage?.completion_tokens ?? 0,
        estimated_cost_usd: 0
      };

      return sendJson(res, 200, {
        request_id: requestId,
        use_case: useCase.id,
        output: useCase.transformOutput(text, validatedInput, context),
        usage,
        limits: {
          remaining_today: remainingToday(useCase, claims.tier, claims.sid)
        }
      });
    }

    return sendError(res, 404, "invalid_request", "Route not found.", requestId);
  } catch (error) {
    if (error?.statusCode) {
      return sendError(
        res,
        error.statusCode,
        error.code || "invalid_request",
        error.publicMessage || error.message,
        requestId
      );
    }
    return sendError(res, 500, "internal_error", "The request could not be processed.", requestId);
  }
});

server.listen(config.port, config.host, () => {
  console.log(`3dpolitics AI gateway listening on http://${config.host}:${config.port}`);
});

function getClientIp(req) {
  if (config.trustProxy) {
    const forwardedFor = req.headers["x-forwarded-for"];
    if (typeof forwardedFor === "string" && forwardedFor.length > 0) {
      return forwardedFor.split(",")[0].trim();
    }
  }
  return req.socket.remoteAddress || "0.0.0.0";
}

function validateContext(input) {
  const output = {};
  if (Number.isInteger(input?.page_id)) output.page_id = input.page_id;
  if (typeof input?.page_slug === "string") output.page_slug = input.page_slug.trim().slice(0, 120);
  if (typeof input?.locale === "string") output.locale = input.locale.trim().slice(0, 20);
  return output;
}

function enforceRateLimits({ useCase, tier, subjectId, sessionId, ip }) {
  const profile = rateProfiles[useCase.rateLimitProfile]?.[tier];
  if (!profile) {
    return;
  }

  const minuteSubjectCount = bumpWindow(rateWindows, `${useCase.id}:subject:${subjectId}`, 60_000);
  const minuteIpCount = bumpWindow(rateWindows, `${useCase.id}:ip:${ip}`, 60_000);
  const todayCount = bumpWindow(dayWindows, `${new Date().toISOString().slice(0, 10)}:${useCase.id}:session:${sessionId}`, 86_400_000);

  if (minuteSubjectCount > profile.perMinute || minuteIpCount > profile.perIpMinute) {
    throw publicError(429, "rate_limit_exceeded", "Too many requests. Try again later.");
  }

  if (todayCount > profile.perDay) {
    throw publicError(402, "quota_exceeded", "You have reached today's usage limit.");
  }
}

function remainingToday(useCase, tier, subjectId) {
  const profile = rateProfiles[useCase.rateLimitProfile]?.[tier];
  if (!profile) {
    return null;
  }
  const key = `${new Date().toISOString().slice(0, 10)}:${useCase.id}:session:${subjectId}`;
  const current = dayWindows.get(key)?.count ?? 0;
  return Math.max(0, profile.perDay - current);
}

function bumpWindow(map, key, windowMs) {
  const now = Date.now();
  const current = map.get(key);
  if (!current || current.expiresAt <= now) {
    map.set(key, { count: 1, expiresAt: now + windowMs });
    return 1;
  }
  current.count += 1;
  return current.count;
}

async function callLiteLlm({
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature,
  metadata,
  user
}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), config.requestTimeoutMs);

  try {
    const response = await fetch(`${config.litellmBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.litellmApiKey}`
      },
      body: JSON.stringify({
        model,
        temperature,
        max_tokens: maxOutputTokens,
        user,
        metadata,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ]
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const message = data?.error?.message || data?.message || `LiteLLM error ${response.status}`;
      throw publicError(502, "provider_error", message);
    }
    return data;
  } finally {
    clearTimeout(timeout);
  }
}

function extractAssistantText(payload) {
  return payload?.choices?.[0]?.message?.content ?? "";
}

function verifyHs256Jwt(token, secret, { issuer, audience }) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw publicError(401, "unauthorized", "Invalid access token.");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const header = JSON.parse(base64UrlDecode(encodedHeader));
  const payload = JSON.parse(base64UrlDecode(encodedPayload));

  if (header.alg !== "HS256" || header.typ !== "JWT") {
    throw publicError(401, "unauthorized", "Invalid access token.");
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  if (!safeCompare(encodedSignature, expectedSignature)) {
    throw publicError(401, "unauthorized", "Invalid access token.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.iss !== issuer || payload.aud !== audience) {
    throw publicError(401, "unauthorized", "Invalid access token.");
  }
  if (!payload.exp || payload.exp < now) {
    throw publicError(401, "unauthorized", "Access token expired.");
  }
  if (!Array.isArray(payload.use_cases) || typeof payload.sub !== "string" || typeof payload.sid !== "string") {
    throw publicError(401, "unauthorized", "Invalid access token.");
  }

  return payload;
}

function base64UrlDecode(value) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(padded, "base64").toString("utf8");
}

function safeCompare(left, right) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}

async function readJsonBody(req, maxBytes) {
  let total = 0;
  const chunks = [];

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      throw publicError(413, "message_too_large", "Request body too large.");
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw publicError(400, "invalid_request", "Invalid JSON body.");
  }
}

function setBaseHeaders(res, requestId) {
  res.setHeader("X-Request-Id", requestId);
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
}

function sendError(res, statusCode, code, message, requestId) {
  return sendJson(res, statusCode, {
    error: code,
    message,
    request_id: requestId
  });
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body)
  });
  res.end(body);
}

function publicError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = message;
  return error;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}
