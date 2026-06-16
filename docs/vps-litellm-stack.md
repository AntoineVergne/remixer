# VPS Stack: AI Gateway + LiteLLM

This is the recommended VPS stack for `3dpolitics.xyz` when WordPress stays the frontend.

## Stack

```text
WordPress page
  -> /ai/v1/* on 3dpolitics.xyz
  -> reverse proxy to VPS ai-gateway
  -> LiteLLM Proxy
  -> provider APIs
```

Services in this repo:

- `ai-gateway`: thin application service that understands WordPress identity and use cases
- `litellm`: provider gateway and spend-management layer
- `postgres`: LiteLLM persistence for keys, budgets, logs, and admin UI state

## Why this split

LiteLLM is the right provider abstraction layer, but it should not be your only public backend.

The app service still needs to own:

- JWT verification for WordPress-issued access tokens
- use-case registry
- input validation by page/use case
- prompt templates
- role/tier checks
- frontend-safe response shaping

LiteLLM should own:

- provider connectivity
- unified LLM API surface
- model aliases
- spend tracking
- virtual keys and internal auth
- provider routing and future failover

## Files

- Compose stack: [infra/docker-compose.yml](/home/antoine-vergne/3d-politics-remixer/infra/docker-compose.yml)
- LiteLLM config: [infra/litellm/config.yaml](/home/antoine-vergne/3d-politics-remixer/infra/litellm/config.yaml)
- LiteLLM env example: [infra/env/litellm.env.example](/home/antoine-vergne/3d-politics-remixer/infra/env/litellm.env.example)
- App service env example: [infra/env/ai-gateway.env.example](/home/antoine-vergne/3d-politics-remixer/infra/env/ai-gateway.env.example)
- App service: [services/ai-gateway/server.mjs](/home/antoine-vergne/3d-politics-remixer/services/ai-gateway/server.mjs)

## App service endpoints

- `GET /ai/v1/health`
- `GET /ai/v1/use-cases/:id/public`
- `POST /ai/v1/execute`

## Current use cases

- `manifesto_remix`
- `homepage_chat`

Both are registered in [services/ai-gateway/use-cases.mjs](/home/antoine-vergne/3d-politics-remixer/services/ai-gateway/use-cases.mjs).

## WordPress integration

WordPress should issue a short-lived signed token, then frontend code should call:

```text
POST /ai/v1/execute
Authorization: Bearer <token>
```

The contract is documented in [docs/wordpress-vps-contract.md](/home/antoine-vergne/3d-politics-remixer/docs/wordpress-vps-contract.md).

## Bring-up

1. Copy:
   - `infra/env/litellm.env.example` -> `infra/env/litellm.env`
   - `infra/env/ai-gateway.env.example` -> `infra/env/ai-gateway.env`
2. Set your provider keys and shared WordPress JWT secret.
3. Start the stack:

```bash
docker compose -f infra/docker-compose.yml up -d --build
```

The service-level `env_file` entries load `infra/env/litellm.env` and `infra/env/ai-gateway.env` into the relevant containers.

## Reverse proxy example

On the WordPress-facing web server:

```nginx
location /ai/v1/ {
    proxy_pass http://YOUR_VPS_IP:3000/ai/v1/;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Real-IP $remote_addr;
}
```

This keeps the browser on the main domain while pushing heavy backend work to the VPS.
