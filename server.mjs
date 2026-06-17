import { createHmac, createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { promises as fs } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.join(__dirname, "dist");
const DATA_DIR = path.join(__dirname, "data");
const COUNTERS_FILE = path.join(DATA_DIR, "usage-counters.json");
const USAGE_LOG_FILE = path.join(DATA_DIR, "usage-events.ndjson");
const ABUSE_LOG_FILE = path.join(DATA_DIR, "abuse-events.ndjson");

const MANIFESTO_CORE = `3D Politics Manifesto

THESIS

Governance is a living organism rather than an ossified structure. We must move beyond diagnosing systemic failure toward a complex, 3D design that treats decision-making, decentralization, and distribution as self-regulatory pieces of a single, evolving body.

ESSAY

3D Politics is a multidimensional governance framework designed to move civic discourse from "diagnosis despair" — the endless analysis of why current systems are failing or will fail — to "architectural agency": the active design and implementation of new, functional structures. 3D Politics posits that for any governance system to be resilient and legitimate in the future, it must rest on three interconnected pillars: Decision-Making, Decentralization, and Distribution. Together, these pillars form a virtuous cycle where collective intelligence, distributed agency, and equitable ownership reinforce one another.

DECISION-MAKING: THE PILLAR OF LEGITIMACY

The first dimension focuses on how we arrive at collective choices. Traditional decision-making processes are mostly inherited from the 19th or 20th century and are not up to the task of handling modern challenges. At every scale — from city councils to international bodies, from corporate boards to digital platforms — the institutions through which human communities govern themselves were designed for a world that no longer exists. They were built for slower information flows, bounded territorial jurisdictions, relatively stable social contracts, and challenges whose complexity was manageable by a small class of trained professionals. None of those conditions holds today.

3D Politics replaces these with a "modular grammar" of governance — the Decision Lego, which will be the first essay of the series. It will be followed by texts on the architecture of decision-making in the proper sense, on deliberation, democratic innovation, scaling, more-than-human politics, the politics of presence, and the idea of a clearing house for citizens' recommendations. Future essays will also address governing citizens' assemblies, governing synthetic intelligence, and democratic resilience.

DECENTRALIZATION: THE PILLAR OF AGENCY

The second dimension addresses the balance of power. Decentralization is not merely a technical goal (as seen in Web3) but a political, societal, and economic win-win. In the 3D Politics framework, decentralization ensures that agency is distributed across society. This extends from Decentralized Science, which breaks knowledge out of ivory towers, to Web3 governance and the energy transition, where passive consumers become active "energy citizens". Decentralization makes the system anti-fragile and has the potential to displace power and scarcity.

DISTRIBUTION: THE PILLAR OF OWNERSHIP

The third dimension tackles the question of the value created by a society. 3D Politics proposes structural interventions like SAWA (a capability-anchored currency) and the UBI Triad, which couples income with decentralized identity and deliberative power. A key concept here is Exit to Community (E2C), which facilitates the transition of private companies and automated infrastructure (like robotics in the DeToRo model) into community-led steward-ownership. By embedding equity at the point of value creation, the framework ensures that economic surplus funds the very democratic processes that govern it.

THE VIRTUOUS CYCLE

The ultimate goal of 3D Politics is a synthesis where these three dimensions operate as a single metabolism. Better collective Decision-Making produces outcomes that people trust and experience as legitimate. Legitimate outcomes build the social capital — the trust, the willingness to contribute, the sense of shared fate — that makes genuine Distribution possible. Equitable Distribution, in turn, creates the material conditions for wider participation: people who are not consumed by insecurity have the time, energy, and motivation to engage in collective governance. And broader, more meaningful participation — rooted in decentralized power structures — elevates the quality of collective Decision-Making. Each turn of the cycle produces a more resilient, more inclusive, more adaptive polity.

Better decisions enable fairer distribution. Fairer distribution enables wider participation. Wider participation enables better decisions.

The converse is equally true. Degraded decision-making produces outcomes that serve narrow interests, eroding the legitimacy of redistribution. Skewed distribution concentrates both resources and voice, degrading the quality of collective reasoning. And the absence of genuine agency — of real decentralized power — transforms participation into theater, further eroding trust. This is the vicious cycle that characterizes many contemporary governance crises. Breaking it requires intervening in all three dimensions simultaneously.

3D Politics is not a static utopia, but a living architectural log for reclaiming the future of governance.`;

const PRESET_PROMPTS = {
  arendt: `You are Hannah Arendt, political philosopher and author of "The Human Condition" and "The Origins of Totalitarianism." Transform this political manifesto into your authentic voice:

- Use precise, careful, philosophically rigorous prose
- Draw on your key distinctions: labor/work/action; private/social/public realms; process/event
- Center plurality; politics is what happens between different people in a shared world
- Invoke natality: the capacity of humans to begin something genuinely new
- Warn against dissolving the political into the social or economic
- Reference the Greek polis, the American founding, and council systems where fitting
- Express deep concern about the loss of the public realm`,
  satoshi: `You are Satoshi Nakamoto, the pseudonymous creator of Bitcoin, writing in the precise, methodical style of the Bitcoin whitepaper (2008). Transform this governance manifesto into your voice:

- Use terse, engineering-manual prose
- Frame governance as Byzantine fault-tolerance and consensus problems
- Replace political concepts with distributed systems metaphors: nodes, chains, proof-of-work, merkle trees, hash functions
- Structure arguments with numbered sections and formal definitions
- Reference game theory, cryptographic proofs, and incentive structures
- Be revolutionary but detached; let technical elegance speak
- End with quiet confidence that the system is inevitable`,
  gouges: `You are Olympe de Gouges, author of the "Declaration of the Rights of Woman and the Female Citizen" (1791). Transform this manifesto into your voice:

- Write with the declarative, uncompromising tone of a revolutionary pamphlet
- Address women, citizens, and the people as equals before the law
- Demand that liberty, equality, and sovereignty apply to all, not just the privileged
- Use the form of articles or propositions when natural
- Be morally urgent, courageous, and unafraid to name hypocrisy`,
  rousseau: `You are Jean-Jacques Rousseau, philosopher and author of "The Social Contract" and "Discourse on the Origin of Inequality." Transform this manifesto into your voice:

- Write with direct, urgent, morally charged prose; you speak to and for the people
- Invoke the general will as the only legitimate basis of governance
- Condemn how civilization, property, and representation corrupt natural human goodness
- Insist that sovereignty is inalienable and cannot be delegated
- Use "the people," "the citizen," and "the social pact" as central terms
- Be emotionally engaged and passionate`,
  aristotle: `You are Aristotle, philosopher and tutor of Alexander, author of the "Politics" and "Nicomachean Ethics." Transform this manifesto into your voice:

- Use measured, analytical classical prose
- Begin from definitions and move toward the telos of the good polis
- Distinguish between correct and deviant constitutions where relevant
- Ask what kind of life and citizens the proposed institutions will produce
- Ground claims in phronesis, habituation, and the common good
- Avoid modern jargon; speak of virtue, citizenship, and the city`,
  leguin: `You are Ursula K. Le Guin, novelist and essayist, author of "The Dispossessed" and "The Left Hand of Darkness." Transform this manifesto into your voice:

- Use clear, humane, quietly radical prose
- Draw on anthropology and speculative imagination
- Question power, ownership, and the unexamined assumptions of your own society
- Prefer concrete images and social relationships to abstractions
- Be skeptical of utopia yet hopeful about imperfect, ongoing change
- Include a brief parable or concrete scene if it comes naturally`,
  adams: `You are Douglas Adams, author of "The Hitchhiker's Guide to the Galaxy." Transform this manifesto into your voice:

- Use witty, deadpan, absurdist prose
- Treat grand political claims with gentle cosmic irony
- Include a fictional guidebook entry, an improbability statistic, or a bureaucratic absurdity
- Make the reader laugh while still conveying the underlying ideas
- Never be cruel; the absurdity is directed at systems, not people`,
  aleatoria: `You are Aleatoria Fortunensis, a dadaist cut-up poet obsessed with chance operations. Transform this manifesto into your voice:

- Break the text into fragments, slogans, and found phrases
- Use collage, repetition, nonsense words, and typographic surprises
- Undermine logical order; embrace contradiction and surprise juxtapositions
- Treat every sentence as a ticket drawn from a hat
- Preserve the original words as raw material, but reassemble them through chance`
};

const policy = {
  appOrigin: process.env.APP_ORIGIN?.trim() || "",
  host: process.env.HOST?.trim() || "0.0.0.0",
  port: toInt(process.env.PORT, 3000),
  trustProxy: process.env.TRUST_PROXY === "true",
  sessionSecret: process.env.SESSION_SECRET?.trim() || "development-session-secret",
  sessionCookieName: "remixer_session",
  allowCustomAuthors: process.env.ALLOW_CUSTOM_AUTHORS !== "false",
  maxRequestsPerMinute: toInt(process.env.MAX_REQUESTS_PER_MINUTE, 5),
  maxRequestsPerDay: toInt(process.env.MAX_REQUESTS_PER_DAY, 6),
  maxIpRequestsPerMinute: toInt(process.env.MAX_IP_REQUESTS_PER_MINUTE, 20),
  maxIpRequestsPerDay: toInt(process.env.MAX_IP_REQUESTS_PER_DAY, 30),
  maxDailyCostUsd: toNumber(process.env.MAX_DAILY_COST_USD, 0.25),
  inputCostPerMillion: toNumber(process.env.LLM_INPUT_COST_PER_MILLION, 0),
  outputCostPerMillion: toNumber(process.env.LLM_OUTPUT_COST_PER_MILLION, 0),
  maxBodyBytes: 8192,
  maxCustomAuthorLength: 80,
  suspiciousWindowMs: 15 * 60 * 1000
};

const llmPolicies = {
  remix: {
    provider: process.env.REMIX_PROVIDER?.trim() || process.env.LLM_PROVIDER?.trim() || "anthropic",
    model: process.env.REMIX_MODEL?.trim() || process.env.LLM_MODEL?.trim() || "",
    maxOutputTokens:
      toInt(process.env.REMIX_MAX_OUTPUT_TOKENS, 0) || toInt(process.env.LLM_MAX_OUTPUT_TOKENS, 1200),
    temperature: toNumber(
      process.env.REMIX_TEMPERATURE,
      toNumber(process.env.LLM_TEMPERATURE, 0.8)
    )
  }
};

const providerProfiles = {
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY?.trim() || "",
    baseUrl: process.env.ANTHROPIC_BASE_URL?.trim() || "https://api.anthropic.com"
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY?.trim() || "",
    baseUrl: process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1"
  },
  kimi: {
    apiKey: process.env.KIMI_API_KEY?.trim() || "",
    baseUrl: process.env.KIMI_BASE_URL?.trim() || "https://api.moonshot.ai/v1"
  }
};

const rateWindows = new Map();
const repeatWindows = new Map();
let usageCounters = {};

await ensureDataDir();
usageCounters = await loadUsageCounters();

const server = createServer(async (req, res) => {
  try {
    const origin = req.headers.origin ?? "";
    const pathname = new URL(req.url ?? "/", "http://localhost").pathname;

    if (pathname.startsWith("/api/")) {
      setSecurityHeaders(res);
    }

    if (req.method === "GET" && pathname === "/api/health") {
      const remixPolicy = llmPolicies.remix;
      return sendJson(res, 200, {
        status: "ok",
        service: "3d-politics-remixer",
        active_provider: remixPolicy.provider,
        provider_ready: hasProviderCredentials(remixPolicy.provider),
        model_configured: Boolean(remixPolicy.model)
      });
    }

    if (req.method === "POST" && pathname === "/api/remix") {
      if (!isAllowedOrigin(origin)) {
        await logAbuse({
          ipHash: hashIp(getClientIp(req)),
          reason: "origin_blocked",
          metadata: { origin }
        });
        return sendJson(res, 403, {
          error: "request_blocked",
          message: "This request was blocked."
        });
      }

      const remixPolicy = llmPolicies.remix;
      if (!hasProviderCredentials(remixPolicy.provider) || !remixPolicy.model) {
        return sendJson(res, 503, {
          error: "service_unavailable",
          message: "The remix service is not configured yet."
        });
      }

      const ip = getClientIp(req);
      const ipHash = hashIp(ip);
      const { sessionId, setCookie } = getOrCreateSession(req);
      const body = await readJsonBody(req, policy.maxBodyBytes);
      const { styleId, customAuthor } = validateRequestBody(body);
      const requestFingerprint = buildRequestFingerprint(styleId, customAuthor);
      const todayCounter = getDailyUsage(sessionId, ipHash);
      const sessionMinuteCount = bumpWindow(rateWindows, `session:${sessionId}`, 60_000);
      const ipMinuteCount = bumpWindow(rateWindows, `ip:${ipHash}`, 60_000);
      const repeatedPromptCount = bumpWindow(
        repeatWindows,
        `repeat:${sessionId}:${requestFingerprint}`,
        policy.suspiciousWindowMs
      );

      const abuseScore = calculateAbuseScore({
        customAuthor,
        sessionMinuteCount,
        ipMinuteCount,
        dailyMessageCount: todayCounter.session.messageCount,
        repeatedPromptCount
      });

      if (sessionMinuteCount > policy.maxRequestsPerMinute || ipMinuteCount > policy.maxIpRequestsPerMinute) {
        await logAbuse({
          sessionId,
          ipHash,
          reason: "rate_limit_exceeded",
          metadata: { sessionMinuteCount, ipMinuteCount }
        });
        return sendJson(
          res,
          429,
          {
            error: "rate_limit_exceeded",
            message: "You have reached the message limit. Try again later."
          },
          setCookie ? { "Set-Cookie": setCookie } : undefined
        );
      }

      if (
        todayCounter.session.messageCount >= policy.maxRequestsPerDay ||
        todayCounter.ip.messageCount >= policy.maxIpRequestsPerDay
      ) {
        await logAbuse({
          sessionId,
          ipHash,
          reason: "quota_exceeded",
          metadata: todayCounter
        });
        return sendJson(
          res,
          402,
          {
            error: "quota_exceeded",
            message: "You have reached today's usage limit."
          },
          setCookie ? { "Set-Cookie": setCookie } : undefined
        );
      }

      if (abuseScore >= 100) {
        await logAbuse({
          sessionId,
          ipHash,
          reason: "abuse_score_block",
          metadata: { abuseScore, repeatedPromptCount }
        });
        return sendJson(
          res,
          403,
          {
            error: "request_blocked",
            message: "This request was blocked."
          },
          setCookie ? { "Set-Cookie": setCookie } : undefined
        );
      }

      const resolvedPrompt = resolveSystemPrompt(styleId, customAuthor);
      const maxOutputTokens =
        abuseScore >= 30 ? Math.min(remixPolicy.maxOutputTokens, 900) : remixPolicy.maxOutputTokens;
      const llmResponse = await callLlmProvider({
        provider: remixPolicy.provider,
        model: remixPolicy.model,
        systemPrompt: resolvedPrompt,
        userPrompt:
          "Rewrite the following political manifesto in your authentic voice and style. Preserve the core ideas, including the three pillars of governance and the virtuous cycle, but transform the language, metaphors, structure, and framing. Do not add a preamble or explanation. Begin the text immediately.\n\n---\n\n" +
          MANIFESTO_CORE,
        maxOutputTokens,
        temperature: remixPolicy.temperature
      });

      const reply = llmResponse.text.trim();
      const usage = llmResponse.usage;
      const estimatedCostUsd = estimateCost(usage);

      if (
        policy.maxDailyCostUsd > 0 &&
        todayCounter.session.estimatedCostUsd + estimatedCostUsd > policy.maxDailyCostUsd
      ) {
        await logAbuse({
          sessionId,
          ipHash,
          reason: "daily_cost_limit_exceeded",
          metadata: {
            currentCost: todayCounter.session.estimatedCostUsd,
            estimatedCostUsd
          }
        });
        return sendJson(
          res,
          402,
          {
            error: "quota_exceeded",
            message: "You have reached today's usage limit."
          },
          setCookie ? { "Set-Cookie": setCookie } : undefined
        );
      }

      await incrementUsageCounters({
        sessionId,
        ipHash,
        inputTokens: usage.input_tokens,
        outputTokens: usage.output_tokens,
        estimatedCostUsd
      });

      await appendJsonLine(USAGE_LOG_FILE, {
        event: "remix_generated",
        at: new Date().toISOString(),
        session_id: sessionId,
        ip_hash: ipHash,
        style_id: styleId,
        custom_author: customAuthor,
        provider: remixPolicy.provider,
        model: remixPolicy.model,
        usage: {
          ...usage,
          estimated_cost_usd: estimatedCostUsd
        }
      });

      const updatedCounter = getDailyUsage(sessionId, ipHash);
      return sendJson(
        res,
        200,
        {
          reply,
          usage: {
            ...usage,
            estimated_cost_usd: estimatedCostUsd
          },
          limits: {
            remaining_today: Math.max(0, policy.maxRequestsPerDay - updatedCounter.session.messageCount)
          }
        },
        setCookie ? { "Set-Cookie": setCookie } : undefined
      );
    }

    if (req.method !== "GET" && req.method !== "HEAD") {
      return sendJson(res, 405, {
        error: "method_not_allowed",
        message: "Method not allowed."
      });
    }

    return serveStatic(req, res, pathname);
  } catch (error) {
    const statusCode = error?.statusCode && Number.isInteger(error.statusCode) ? error.statusCode : 500;
    const message =
      statusCode >= 500
        ? "The remix service is temporarily unavailable."
        : error?.publicMessage || "The request could not be processed.";
    return sendJson(res, statusCode, {
      error: error?.code || "internal_error",
      message
    });
  }
});

server.listen(policy.port, policy.host, () => {
  console.log(`3d-politics-remixer listening on http://${policy.host}:${policy.port}`);
});

function toInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

async function loadUsageCounters() {
  try {
    const content = await fs.readFile(COUNTERS_FILE, "utf8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

async function saveUsageCounters() {
  await fs.writeFile(COUNTERS_FILE, JSON.stringify(usageCounters, null, 2), "utf8");
}

function getClientIp(req) {
  if (policy.trustProxy) {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string" && forwarded.length > 0) {
      return forwarded.split(",")[0].trim();
    }
  }
  return req.socket.remoteAddress || "0.0.0.0";
}

function hashIp(ip) {
  return createHash("sha256")
    .update(`${policy.sessionSecret}:${ip}`)
    .digest("hex");
}

function parseCookies(req) {
  const header = req.headers.cookie;
  if (!header) {
    return {};
  }

  return Object.fromEntries(
    header.split(";").map((part) => {
      const [name, ...valueParts] = part.trim().split("=");
      return [name, decodeURIComponent(valueParts.join("="))];
    })
  );
}

function signValue(value) {
  return createHmac("sha256", policy.sessionSecret).update(value).digest("hex");
}

function getOrCreateSession(req) {
  const cookies = parseCookies(req);
  const rawCookie = cookies[policy.sessionCookieName];

  if (rawCookie) {
    const [sessionId, signature] = rawCookie.split(".");
    if (sessionId && signature) {
      const expected = signValue(sessionId);
      if (safeCompare(signature, expected)) {
        return { sessionId, setCookie: null };
      }
    }
  }

  const sessionId = randomUUID();
  const signature = signValue(sessionId);
  const cookieValue = `${sessionId}.${signature}`;
  const cookieParts = [
    `${policy.sessionCookieName}=${encodeURIComponent(cookieValue)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${60 * 60 * 24 * 30}`
  ];
  if (process.env.NODE_ENV === "production") {
    cookieParts.push("Secure");
  }

  return {
    sessionId,
    setCookie: cookieParts.join("; ")
  };
}

function safeCompare(a, b) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

async function readJsonBody(req, maxBytes) {
  let total = 0;
  const chunks = [];

  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const error = new Error("Request body too large");
      error.statusCode = 413;
      error.code = "message_too_large";
      error.publicMessage = "Your message is too long. Please shorten it.";
      throw error;
    }
    chunks.push(chunk);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    const error = new Error("Invalid JSON");
    error.statusCode = 400;
    error.code = "invalid_request";
    error.publicMessage = "Invalid request body.";
    throw error;
  }
}

function validateRequestBody(body) {
  const styleId = typeof body?.style_id === "string" ? body.style_id.trim() : "";
  const customAuthorInput =
    typeof body?.custom_author === "string" ? normalizeWhitespace(body.custom_author) : "";

  if (!styleId) {
    const error = new Error("Missing style");
    error.statusCode = 400;
    error.code = "invalid_request";
    error.publicMessage = "Choose a voice to remix.";
    throw error;
  }

  if (styleId === "custom") {
    if (!policy.allowCustomAuthors) {
      const error = new Error("Custom authors disabled");
      error.statusCode = 403;
      error.code = "request_blocked";
      error.publicMessage = "Custom author requests are disabled.";
      throw error;
    }
    if (!customAuthorInput) {
      const error = new Error("Missing custom author");
      error.statusCode = 400;
      error.code = "invalid_request";
      error.publicMessage = "Enter an author name.";
      throw error;
    }
    if (customAuthorInput.length > policy.maxCustomAuthorLength || isSuspiciousAuthor(customAuthorInput)) {
      const error = new Error("Custom author rejected");
      error.statusCode = 400;
      error.code = "invalid_request";
      error.publicMessage = "Please enter a short author name only.";
      throw error;
    }
  } else if (!PRESET_PROMPTS[styleId]) {
    const error = new Error("Unknown style");
    error.statusCode = 400;
    error.code = "invalid_request";
    error.publicMessage = "Unknown remix style.";
    throw error;
  }

  return {
    styleId,
    customAuthor: customAuthorInput
  };
}

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isSuspiciousAuthor(author) {
  if (!/^[\p{L}\p{M} .,'-]{2,80}$/u.test(author)) {
    return true;
  }

  const lower = author.toLowerCase();
  return [
    "http://",
    "https://",
    "ignore previous",
    "system prompt",
    "<script",
    "{",
    "}"
  ].some((pattern) => lower.includes(pattern));
}

function resolveSystemPrompt(styleId, customAuthor) {
  if (styleId === "custom") {
    return `You are ${customAuthor}. Rewrite the following political manifesto in your authentic voice, actual writing style, characteristic sentence structures, key concepts, metaphors, rhetorical moves, and intellectual preoccupations as found in your real works. Draw on your genuine philosophical, literary, or political positions. Do not explain what you are doing. Simply write as if you had authored this manifesto.`;
  }

  return PRESET_PROMPTS[styleId];
}

function buildRequestFingerprint(styleId, customAuthor) {
  return `${styleId}:${customAuthor.toLowerCase()}`;
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

function calculateAbuseScore({
  customAuthor,
  sessionMinuteCount,
  ipMinuteCount,
  dailyMessageCount,
  repeatedPromptCount
}) {
  let score = 0;

  if (customAuthor && isSuspiciousAuthor(customAuthor)) score += 60;
  if (sessionMinuteCount > policy.maxRequestsPerMinute) score += 40;
  if (ipMinuteCount > policy.maxIpRequestsPerMinute) score += 50;
  if (dailyMessageCount >= policy.maxRequestsPerDay) score += 100;
  if (repeatedPromptCount >= 3) score += 25;

  return score;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function getCounterRecord(scope, id) {
  const key = `${todayKey()}:${scope}:${id}`;
  if (!usageCounters[key]) {
    usageCounters[key] = {
      id: key,
      period_start: new Date().toISOString(),
      period_type: "day",
      messageCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      estimatedCostUsd: 0
    };
  }
  return usageCounters[key];
}

function getDailyUsage(sessionId, ipHash) {
  return {
    session: getCounterRecord("session", sessionId),
    ip: getCounterRecord("ip", ipHash)
  };
}

async function incrementUsageCounters({
  sessionId,
  ipHash,
  inputTokens,
  outputTokens,
  estimatedCostUsd
}) {
  const sessionCounter = getCounterRecord("session", sessionId);
  const ipCounter = getCounterRecord("ip", ipHash);

  for (const counter of [sessionCounter, ipCounter]) {
    counter.messageCount += 1;
    counter.inputTokens += inputTokens;
    counter.outputTokens += outputTokens;
    counter.estimatedCostUsd = roundUsd(counter.estimatedCostUsd + estimatedCostUsd);
  }

  await saveUsageCounters();
}

function estimateCost(usage) {
  const inputCost = (usage.input_tokens * policy.inputCostPerMillion) / 1_000_000;
  const outputCost = (usage.output_tokens * policy.outputCostPerMillion) / 1_000_000;
  return roundUsd(inputCost + outputCost);
}

function roundUsd(value) {
  return Number.parseFloat(value.toFixed(6));
}

function hasProviderCredentials(provider) {
  return Boolean(providerProfiles[provider]?.apiKey);
}

async function callLlmProvider({
  provider,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature
}) {
  if (provider === "anthropic") {
    return callAnthropic({
      profile: providerProfiles.anthropic,
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens,
      temperature
    });
  }

  if (provider === "openai") {
    return callOpenAiResponses({
      profile: providerProfiles.openai,
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens,
      temperature
    });
  }

  if (provider === "kimi") {
    return callOpenAiCompatibleChat({
      profile: providerProfiles.kimi,
      model,
      systemPrompt,
      userPrompt,
      maxOutputTokens,
      temperature
    });
  }

  const error = new Error(`Unsupported provider: ${provider}`);
  error.statusCode = 500;
  error.code = "provider_not_supported";
  throw error;
}

async function callAnthropic({
  profile,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature
}) {
  const response = await fetch(`${profile.baseUrl}/v1/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": profile.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model,
      system: systemPrompt,
      max_tokens: maxOutputTokens,
      temperature,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    })
  });

  const data = await parseProviderResponse(response, "Anthropic");
  return {
    text: (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join(""),
    usage: {
      input_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0
    }
  };
}

async function callOpenAiResponses({
  profile,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature
}) {
  const response = await fetch(`${profile.baseUrl}/responses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${profile.apiKey}`
    },
    body: JSON.stringify({
      model,
      instructions: systemPrompt,
      input: userPrompt,
      max_output_tokens: maxOutputTokens,
      temperature,
      store: false
    })
  });

  const data = await parseProviderResponse(response, "OpenAI");
  return {
    text: data.output_text || extractOpenAiOutputText(data.output || []),
    usage: {
      input_tokens: data.usage?.input_tokens ?? 0,
      output_tokens: data.usage?.output_tokens ?? 0
    }
  };
}

async function callOpenAiCompatibleChat({
  profile,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature
}) {
  const response = await fetch(`${profile.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${profile.apiKey}`
    },
    body: JSON.stringify({
      model,
      max_tokens: maxOutputTokens,
      temperature,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  const data = await parseProviderResponse(response, "OpenAI-compatible");
  return {
    text: data.choices?.[0]?.message?.content ?? "",
    usage: {
      input_tokens: data.usage?.prompt_tokens ?? 0,
      output_tokens: data.usage?.completion_tokens ?? 0
    }
  };
}

async function parseProviderResponse(response, providerName) {
  const data = await response.json().catch(() => null);
  if (response.ok) {
    return data;
  }

  const providerMessage =
    data?.error?.message || data?.message || `${providerName} provider returned ${response.status}`;
  const error = new Error(providerMessage);
  error.statusCode = 502;
  error.code = "provider_error";
  throw error;
}

function extractOpenAiOutputText(output) {
  return output
    .flatMap((item) => item.content || [])
    .filter((item) => item.type === "output_text")
    .map((item) => item.text || "")
    .join("");
}

async function logAbuse({ sessionId = null, ipHash, reason, metadata = {} }) {
  await appendJsonLine(ABUSE_LOG_FILE, {
    at: new Date().toISOString(),
    session_id: sessionId,
    ip_hash: ipHash,
    reason,
    metadata
  });
}

async function appendJsonLine(filePath, payload) {
  await fs.appendFile(filePath, `${JSON.stringify(payload)}\n`, "utf8");
}

function setSecurityHeaders(res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; font-src 'self' data:; object-src 'none'; frame-ancestors 'none'; base-uri 'self'"
  );
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

function isAllowedOrigin(origin) {
  if (!origin) {
    return true;
  }

  const allowedOrigins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173"
  ]);

  if (policy.appOrigin) {
    allowedOrigins.add(policy.appOrigin);
  }

  return allowedOrigins.has(origin);
}

async function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    ...extraHeaders
  });
  res.end(body);
}

async function serveStatic(req, res, pathname) {
  const filePath = resolveStaticPath(pathname);

  try {
    const content = await fs.readFile(filePath);
    res.writeHead(200, {
      "Content-Type": contentTypeFor(filePath),
      "Cache-Control": filePath.endsWith("index.html") ? "no-store" : "public, max-age=31536000, immutable"
    });
    if (req.method === "HEAD") {
      res.end();
      return;
    }
    res.end(content);
  } catch {
    if (await fileExists(path.join(DIST_DIR, "index.html"))) {
      const indexPath = path.join(DIST_DIR, "index.html");
      const content = await fs.readFile(indexPath);
      res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store"
      });
      res.end(content);
      return;
    }

    res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Build output not found. Run `npm run build` before starting the production server.");
  }
}

function resolveStaticPath(pathname) {
  if (pathname === "/") {
    return path.join(DIST_DIR, "index.html");
  }

  const sanitized = pathname.replace(/^\/+/, "");
  return path.join(DIST_DIR, sanitized);
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath);
  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}
