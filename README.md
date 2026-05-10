# 3D Politics Manifesto Remixer

> Reimagine governance through the voice of history's greatest political minds — powered by Claude.

## What it does

The **3D Politics Manifesto Remixer** takes Antoine Vergne's [3D Politics](https://www.linkedin.com/in/antoinevergne/) manifesto — a governance framework built on three pillars: **Decision-Making**, **Decentralization**, and **Distribution** — and rewrites it in the authentic voice of a chosen thinker.

Select one of six preset authors, or type any name into the custom card. Hit **Remix**. Watch the rewritten manifesto stream in real time.

## Preset voices

| Author | Era | Style |
|--------|-----|-------|
| **Satoshi Nakamoto** | 2008 | Cryptographic precision, peer-to-peer metaphors, Bitcoin whitepaper tone |
| **Montesquieu** | 1748 | Enlightenment reason, separation of powers, classical allusions |
| **Theodor Adorno** | 1944–66 | Frankfurt School dialectics, negative critique, dense philosophical prose |
| **Victor Hugo** | 1862 | Romantic lyricism, moral passion, sweeping social justice |
| **Hannah Arendt** | 1958 | Public realm theory, plurality, political action, analytical rigor |
| **Jean-Jacques Rousseau** | 1762 | General will, popular sovereignty, urgent democratic prose |
| **✍ Your choice** | any era | Type any thinker — the prompt adapts dynamically |

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- An [Anthropic API key](https://console.anthropic.com/)

### Run locally

```bash
git clone https://github.com/AntoineVergne/3d-politics-remixer.git
cd 3d-politics-remixer
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173), paste your Anthropic API key in the header, pick a voice, and remix.

### Build for production

```bash
npm run build
npm run preview
```

## How it works

1. The core 3D Politics manifesto (Executive Summary + four pillars + Virtuous Cycle) is embedded in the app.
2. Each author card carries a detailed system prompt crafted to capture that thinker's authentic voice, sentence structures, and key concepts.
3. On **Remix**, the app calls `claude-opus-4-7` via the [Anthropic SDK](https://github.com/anthropic-ai/anthropic-sdk-typescript) directly from the browser (`dangerouslyAllowBrowser: true`).
4. The response streams token by token into the output panel.

> **Note on the API key**: your key is stored only in memory (React state) and never sent anywhere except directly to `api.anthropic.com`. It is not logged or persisted.

## Tech stack

- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Vite 6](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [@anthropic-ai/sdk](https://github.com/anthropic-ai/anthropic-sdk-typescript)
- [Lucide React](https://lucide.dev/)

## About 3D Politics

3D Politics is a governance framework developed by **Antoine Vergne** from 20 years of professional practice in deliberative democracy and civic innovation. It proposes three interconnected pillars:

- **Decision-Making** — modular, scalable democratic processes (citizens' assemblies, Decision Lego, AI-assisted deliberation)
- **Decentralization** — distributed agency across society (DeSci, Web3 governance, energy citizens)
- **Distribution** — equitable ownership of value (SAWA currency, UBI Triad, Exit to Community)

Together they form a virtuous cycle toward a governance system that is technologically advanced, democratically scaled, and economically fair.

---

Built with [Claude](https://claude.ai) · Deployed on [GitHub Pages](https://antoinevergne.github.io/3d-politics-remixer/)
