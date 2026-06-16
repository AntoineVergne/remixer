# WordPress to VPS AI Contract

This is the target architecture for `3dpolitics.xyz`:

- WordPress remains the frontend and publishing system
- the VPS runs the reusable AI backend
- the remixer becomes one use case inside that backend

The goal is to avoid building one backend per page or per feature.

## Recommended topology

Use the main domain and reverse-proxy a path to the VPS backend.

```text
Browser
  |
  v
https://3dpolitics.xyz/page-with-ai
  |
  | page HTML, scripts, WordPress auth, content
  v
WordPress server / reverse proxy
  |
  | /ai/v1/* -> VPS
  v
AI backend on VPS
  |
  | provider routing, rate limits, quotas, logging
  v
Anthropic / OpenAI / Kimi
```

Recommended public path:

- `https://3dpolitics.xyz/ai/v1/...`

This keeps the frontend same-origin and avoids cross-origin browser complexity.

## Responsibility split

### WordPress

- page rendering
- Gutenberg blocks, shortcodes, or theme integrations
- content and page context
- user identity from WordPress auth
- issuing short-lived backend access tokens
- optional server-side feature flags per page or role

### VPS AI backend

- LLM provider selection
- model selection
- prompt templates
- max token policy
- rate limits
- daily and monthly quotas
- abuse checks
- moderation hooks
- usage logging
- cost estimation
- provider failover later if needed

## Integration model

The browser should not talk to providers directly.

The WordPress frontend should:

1. render the page widget
2. fetch a short-lived AI access token from WordPress
3. call the VPS-backed `/ai/v1/execute` endpoint

The token should represent the WordPress user or anonymous session.

## WordPress bootstrap endpoint

Recommended WordPress REST endpoint:

- `GET /wp-json/3dpolitics-ai/v1/bootstrap?use_case=manifesto_remix`

Example response:

```json
{
  "ai_base_url": "/ai/v1",
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_at": "2026-05-11T18:30:00Z",
  "viewer": {
    "is_logged_in": true,
    "user_id": "wp:42",
    "role": "subscriber"
  },
  "use_case": {
    "id": "manifesto_remix",
    "display_name": "Manifesto Remixer",
    "requires_login": false,
    "max_input_chars": 200,
    "remaining_today": 4
  }
}
```

This endpoint should:

- validate the page request
- inspect the current WordPress user
- decide whether the user may use that use case
- issue a short-lived signed token

## Access token claims

Use a short-lived signed token between WordPress and the AI backend.

Recommended claims:

```json
{
  "iss": "3dpolitics.xyz",
  "aud": "3dpolitics-ai",
  "sub": "wp:42",
  "sid": "anon-or-user-session-id",
  "role": "subscriber",
  "use_cases": ["manifesto_remix", "homepage_chat"],
  "tier": "anonymous",
  "page_id": 123,
  "iat": 1778513400,
  "exp": 1778514300
}
```

Recommended token lifetime:

- 10 to 15 minutes

Recommended signing approach:

- HS256 with a shared secret between WordPress and the VPS for v1
- RS256 with WordPress private key and VPS public key if you want cleaner separation later

## AI backend public endpoints

### `POST /ai/v1/execute`

This is the main generic execution endpoint.

Request:

```json
{
  "use_case": "manifesto_remix",
  "input": {
    "style_id": "arendt",
    "custom_author": ""
  },
  "context": {
    "page_id": 123,
    "page_slug": "manifesto-remixer"
  }
}
```

Headers:

```text
Authorization: Bearer <access_token>
Content-Type: application/json
X-Request-Id: optional-client-request-id
```

Response:

```json
{
  "request_id": "req_01jv...",
  "use_case": "manifesto_remix",
  "output": {
    "text": "Generated text here"
  },
  "usage": {
    "provider": "anthropic",
    "model": "claude-3-5-sonnet",
    "input_tokens": 1240,
    "output_tokens": 680,
    "estimated_cost_usd": 0.0124
  },
  "limits": {
    "remaining_today": 4
  }
}
```

Error example:

```json
{
  "error": "quota_exceeded",
  "message": "You have reached today's usage limit.",
  "request_id": "req_01jv..."
}
```

### `GET /ai/v1/use-cases/:id/public`

Use this only for non-sensitive frontend config.

Example response:

```json
{
  "id": "manifesto_remix",
  "display_name": "Manifesto Remixer",
  "requires_login": false,
  "input_schema": {
    "style_id": "enum",
    "custom_author": "string?"
  }
}
```

Never return:

- provider names if you want flexibility
- model IDs
- internal prompts
- prices
- secret moderation rules

### `GET /ai/v1/health`

Basic health and configuration state.

## Use-case registry on the VPS

Every feature should be registered as a use case.

Example:

```ts
const useCases = {
  manifesto_remix: {
    provider: "anthropic",
    model: "claude-3-5-sonnet",
    maxOutputTokens: 1200,
    auth: "anonymous_limited",
    promptTemplate: "manifesto-remix",
    inputSchema: "manifesto-remix-v1",
    rateLimitProfile: "public-light"
  },
  homepage_chat: {
    provider: "openai",
    model: "gpt-5.2-mini",
    maxOutputTokens: 500,
    auth: "logged_in",
    promptTemplate: "homepage-chat",
    inputSchema: "chat-message-v1",
    rateLimitProfile: "public-tight"
  }
};
```

This is the critical design move. The remixer is not the backend. It is one use case.

## Provider routing model

The backend owns provider activation.

One internal function should dispatch to provider adapters:

```ts
callLlmProvider({
  provider,
  model,
  systemPrompt,
  userPrompt,
  maxOutputTokens,
  temperature
});
```

The frontend must never choose:

- provider
- model
- system prompt
- tool availability
- max output tokens

## Input validation model

The backend should validate by use case.

Example for `manifesto_remix`:

- `style_id`: known preset or `custom`
- `custom_author`: optional short human name only
- reject URLs, prompt injection markers, scripts, long freeform payloads

Example for future chat use cases:

- `message`: required string
- `conversation_id`: optional string
- fixed max length
- fixed history window

## Rate limits and quotas

Use Redis on the VPS when you move past MVP.

Recommended keys:

```text
rl:user:{user_id}:minute
rl:user:{user_id}:day
rl:ip:{ip_hash}:minute
rl:session:{sid}:day
cost:user:{user_id}:day
cost:global:month
```

For v1, the WordPress token should include:

- user or anonymous session identity
- role or tier
- allowed use cases

The VPS should still enforce the actual limits.

## WordPress plugin responsibilities

The plugin should provide:

- a bootstrap REST route
- a small frontend loader
- Gutenberg block or shortcode rendering
- server config for which use case appears on which page

Suggested plugin capabilities:

- `[ai_remixer use_case="manifesto_remix"]`
- Gutenberg block: `3dpolitics/ai-widget`
- admin page for:
  - backend base URL
  - signing secret or public key
  - enabled use cases
  - per-role access toggles

## Nginx path proxy

Example shape on the WordPress-facing server:

```nginx
location /ai/v1/ {
    proxy_pass http://YOUR_VPS_PRIVATE_IP:3000/ai/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
}
```

This lets the WordPress site expose AI routes without a subdomain.

## Suggested build order

1. Build the generic VPS AI backend with use-case registry and provider routing
2. Build the WordPress plugin bootstrap endpoint and token signing
3. Add one remixer widget using `manifesto_remix`
4. Add a second use case to prove the architecture is reusable

## Immediate implication for this repo

Do not keep evolving this project as a standalone public site.

Next refactor target:

- extract generic backend pieces into a reusable AI gateway service
- keep the remixer UI logic as one frontend widget or use-case client
- replace the current standalone page deployment with WordPress integration
