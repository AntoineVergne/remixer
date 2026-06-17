# 3D Politics Manifesto Remixer

A small web app that rewrites the [3D Politics manifesto](https://3dpolitics.xyz/manifesto/) in the voice of a chosen thinker.

Live at **https://remixer.3dpolitics.xyz**

## What it does

- Pick one of the preset authors or enter a custom name.
- The browser sends only the selection to the backend.
- The backend handles the LLM provider, model, prompt, and rate limits.
- The rewritten manifesto appears inline, ready to copy.

## Architecture

The app is a React frontend served by a small Node.js backend.

- `src/` — React + Tailwind frontend
- `server.mjs` — API server, rate limits, session handling, LLM provider adapters
- `shared/style-catalog.json` — preset authors exposed to the frontend
- `infra/` — optional Docker + LiteLLM proxy stack for VPS deployments

The backend never exposes provider API keys to the browser.

## Preset authors

- Hannah Arendt
- Satoshi Nakamoto
- Olympe de Gouges
- Jean-Jacques Rousseau
- Aristotle
- Ursula K. Le Guin
- Douglas Adams
- Aleatoria Fortunensis (dada / random-order remix)

## Environment

Copy `.env.example` to `.env` and set at least:

```bash
APP_ORIGIN=https://remixer.3dpolitics.xyz
SESSION_SECRET=replace-with-a-long-random-secret
LLM_PROVIDER=anthropic
LLM_MODEL=your-model-id
ANTHROPIC_API_KEY=...
```

For route-specific overrides:

```bash
REMIX_PROVIDER=anthropic
REMIX_MODEL=your-remix-model
REMIX_MAX_OUTPUT_TOKENS=1200
REMIX_TEMPERATURE=0.8
```

To route through a LiteLLM proxy instead of a provider directly, set `LLM_PROVIDER=openai` and point `OPENAI_BASE_URL` at your LiteLLM instance.

## Development

```bash
npm install
npm run api      # backend on http://127.0.0.1:3000
npm run dev      # frontend on http://127.0.0.1:5173 (proxies /api/*)
```

## Production

```bash
npm run build
npm start
```

The server serves the built frontend from `dist/` and exposes `POST /api/remix`.

## LiteLLM stack (optional)

For a shared VPS setup where WordPress stays the frontend, see [docs/vps-litellm-stack.md](docs/vps-litellm-stack.md).

## Security notes

- Keep provider keys and prompts server-side.
- Use a strong `SESSION_SECRET`.
- Run behind HTTPS.
- Set budget caps in the provider dashboard.

## License

Proprietary — 3D Politics by Antoine Vergne.
