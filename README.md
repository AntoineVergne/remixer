# 3D Politics Manifesto Remixer

Public release for `remixer.3dpolitics.xyz`, with a backend-owned LLM gateway.

## Review findings

Before this refactor, the app was not safe for public release:

- The browser called Anthropic directly with `dangerouslyAllowBrowser: true`.
- Visitors were asked to paste an API key client-side.
- The app was hard-wired to a static GitHub Pages deployment, so there was no place to enforce quotas, rate limits, or abuse controls.
- The frontend knew too much about the model path and prompting strategy.

This version moves LLM access behind the backend and makes provider choice a server-side policy.

The next architectural step is documented in [docs/wordpress-vps-contract.md](/home/antoine-vergne/3d-politics-remixer/docs/wordpress-vps-contract.md): WordPress as frontend, VPS as reusable AI backend, and the remixer as one registered use case.

The LiteLLM-based VPS stack and reusable gateway scaffold are documented in [docs/vps-litellm-stack.md](/home/antoine-vergne/3d-politics-remixer/docs/vps-litellm-stack.md).

Full session handoff notes are in [docs/handoff-2026-05-11.md](/home/antoine-vergne/3d-politics-remixer/docs/handoff-2026-05-11.md).

## What changed

- `POST /api/remix` now proxies all LLM traffic through the backend.
- The browser only sends `style_id` and optional `custom_author`.
- The backend chooses the provider, model, prompt, temperature, and max output tokens.
- Anonymous sessions are signed with an `HttpOnly` cookie.
- Per-session and per-IP rate limits and daily quotas are enforced server-side.
- Requests and abuse events are logged under `data/`.
- The server can route to `anthropic`, `openai`, or `kimi` through one internal provider abstraction.
- The app is prepared for `remixer.3dpolitics.xyz` behind Nginx or Docker.

## Provider routing

The backend should own provider choice. Do not let the frontend decide it.

Recommended pattern:

1. Each use case gets a backend policy.
2. Each policy chooses `provider`, `model`, `maxOutputTokens`, and `temperature`.
3. A single internal `callLlmProvider()` function dispatches to provider adapters.
4. Future routes can reuse the same abstraction for other domain features.

Current provider IDs:

- `anthropic`
- `openai`
- `kimi`

`openai` uses the OpenAI Responses API. Based on current OpenAI docs, Responses is the recommended API for new text generation projects. Source: [Responses API](https://platform.openai.com/docs/api-reference/responses/retrieve), [Text generation guide](https://platform.openai.com/docs/guides/text?api-mode=responses%5C)

## Environment

Copy `.env.example` to `.env` and set the values you need.

Minimum required variables:

```bash
APP_ORIGIN=https://remixer.3dpolitics.xyz
SESSION_SECRET=replace-with-a-long-random-secret
LLM_PROVIDER=anthropic
LLM_MODEL=your-model-id
ANTHROPIC_API_KEY=...
```

Example OpenAI setup:

```bash
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.2
OPENAI_API_KEY=...
OPENAI_BASE_URL=https://api.openai.com/v1
```

Example Kimi setup:

```bash
LLM_PROVIDER=kimi
LLM_MODEL=your-kimi-model
KIMI_API_KEY=...
KIMI_BASE_URL=https://api.moonshot.ai/v1
```

For route-specific overrides, use:

```bash
REMIX_PROVIDER=anthropic
REMIX_MODEL=your-remix-model
REMIX_MAX_OUTPUT_TOKENS=1200
REMIX_TEMPERATURE=0.8
```

## Local development

Install dependencies:

```bash
npm install
```

Run the API server:

```bash
npm run api
```

Run the frontend in another terminal:

```bash
npm run dev
```

The Vite dev server proxies `/api/*` to `http://127.0.0.1:3000`.

## Production build

Build the frontend:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

The Node server will:

- serve the built frontend from `dist/`
- expose `GET /api/health`
- expose `POST /api/remix`
- apply security headers on API responses
- append usage and abuse logs under `data/`

## Deployment on `remixer.3dpolitics.xyz`

### Option 1: Nginx + Node

1. Build the app with `npm run build`
2. Start the server with `npm start`
3. Reverse proxy the subdomain to `127.0.0.1:3000`

An example Nginx site file is included at [deploy/nginx/remixer.3dpolitics.xyz.conf.example](/home/antoine-vergne/3d-politics-remixer/deploy/nginx/remixer.3dpolitics.xyz.conf.example).

### Option 2: Docker

Build the image:

```bash
docker build -t 3d-politics-remixer .
```

Run it:

```bash
docker run --env-file .env -p 3000:3000 3d-politics-remixer
```

## Security notes

- Never expose provider keys to the browser.
- Keep prompts and model routing on the server.
- Use a long random `SESSION_SECRET`.
- Run behind HTTPS in production.
- Set provider-side budget caps in the provider dashboard.
- If traffic grows, replace the in-process rate store with Redis and the file logs with a database.

## Next hardening steps

- Move daily quotas and rate limits from local file/in-memory storage to Redis/Postgres.
- Add CAPTCHA or Turnstile for suspicious or anonymous traffic.
- Add authenticated tiers if you want more than a tiny anonymous quota.
- Add a generic `/api/llm/*` gateway layer for future bots and assistants on `3dpolitics.xyz`.
