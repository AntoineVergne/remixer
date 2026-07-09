import { useEffect, useRef, useState } from "react";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Pen,
  Save,
  Sparkles,
  X,
} from "lucide-react";
import styleCatalog from "../shared/style-catalog.json";

type Style = (typeof styleCatalog)[number];
type ActiveStyle = Style | { id: "custom"; name: string };

type Remix = {
  id: string;
  styleId: string;
  styleName: string;
  customAuthor: string;
  originalText: string;
  remixText: string;
  date?: string;
  saved?: boolean;
};

type Screen = "onboarding" | "voice" | "result" | "gallery";

declare global {
  interface Window {
    __3DP_MANIFESTO__?: string;
    __3DP_REMIX_API__?: string;
    __3DP_REMIXES_API__?: string;
  }
}

const FALLBACK_MANIFESTO =
  `<p>3D Politics is a multidimensional governance framework designed to move civic discourse from &ldquo;diagnosis despair&rdquo; &mdash; the endless analysis of why current systems are failing or will fail &mdash; to &ldquo;architectural agency&rdquo;: the active design and implementation of new, functional structures. 3D Politics posits that for any governance system to be resilient and legitimate in the future, it must rest on three interconnected pillars: Decision-Making, Decentralization, and Distribution. Together, these pillars form a virtuous cycle where collective intelligence, distributed agency, and equitable ownership reinforce one another.</p>
<hr />
<h3 id="decision-making-the-pillar-of-legitimacy">Decision-Making: The Pillar of Legitimacy</h3>
<p>The first dimension focuses on how we arrive at collective choices. Traditional decision-making processes are mostly inherited from the 19th or 20th century and are not up to the task of handling modern challenges. At every scale &mdash; from city councils to international bodies, from corporate boards to digital platforms &mdash; the institutions through which human communities govern themselves were designed for a world that no longer exists. They were built for slower information flows, bounded territorial jurisdictions, relatively stable social contracts, and challenges whose complexity was manageable by a small class of trained professionals. None of those conditions holds today.</p>
<p>3D Politics replaces these with a &ldquo;modular grammar&rdquo; of governance &mdash; the Decision Lego, which will be the first essay of the series. It will be followed by texts on the architecture of decision-making in the proper sense, on deliberation (the biggest part of the journey until now), democratic innovation, scaling, more-than-human politics, the politics of presence, and the idea of a clearing house for citizens&rsquo; recommendations. Future essays will also address governing citizens&rsquo; assemblies, governing synthetic intelligence, and democratic resilience.</p>
<h3 id="decentralization-the-pillar-of-agency">Decentralization: The Pillar of Agency</h3>
<p>The second dimension addresses the balance of power. Decentralization is not merely a technical goal (as seen in Web3) but a political, societal, and economic win-win. In the 3D Politics framework, decentralization ensures that agency is distributed across society. This extends from Decentralized Science, which breaks knowledge out of ivory towers, to Web3 governance and the energy transition, where passive consumers become active &ldquo;energy citizens&rdquo;. Decentralization makes the system anti-fragile and has the potential to displace power and scarcity. Publications around this pillar will address those topics in turn.</p>
<h3 id="distribution-the-pillar-of-ownership">Distribution: The Pillar of Ownership</h3>
<p>The third dimension tackles the question of the value created by a society. 3D Politics proposes structural interventions like SAWA (a capability-anchored currency) and the UBI Triad, which couples income with decentralized identity and deliberative power. A key concept here is Exit to Community (E2C), which facilitates the transition of private companies and automated infrastructure (like robotics in the DeToRo model) into community-led steward-ownership. By embedding equity at the point of value creation, the framework ensures that economic surplus funds the very democratic processes that govern it.</p>
<h3 id="the-virtuous-cycle">The Virtuous Cycle</h3>
<p>The ultimate goal of 3D Politics is a synthesis where these three dimensions operate as a single metabolism. Better collective Decision-Making produces outcomes that people trust and experience as legitimate. Legitimate outcomes build the social capital &mdash; the trust, the willingness to contribute, the sense of shared fate &mdash; that makes genuine Distribution possible. Equitable Distribution, in turn, creates the material conditions for wider participation: people who are not consumed by insecurity have the time, energy, and motivation to engage in collective governance. And broader, more meaningful participation &mdash; rooted in decentralized power structures &mdash; elevates the quality of collective Decision-Making. Each turn of the cycle produces a more resilient, more inclusive, more adaptive polity.</p>
<p>Better decisions enable fairer distribution. Fairer distribution enables wider participation. Wider participation enables better decisions.</p>
<p>The converse is equally true. Degraded decision-making produces outcomes that serve narrow interests, eroding the legitimacy of redistribution. Skewed distribution concentrates both resources and voice, degrading the quality of collective reasoning. And the absence of genuine agency &mdash; of real decentralized power &mdash; transforms participation into theater, further eroding trust. This is the vicious cycle that characterizes many contemporary governance crises. Breaking it requires intervening in all three dimensions simultaneously.</p>
<p>3D Politics is not a static utopia, but a living architectural log for reclaiming the future of governance.</p>`;

function getManifesto(): string {
  return window.__3DP_MANIFESTO__ || FALLBACK_MANIFESTO;
}

function getApiUrls() {
  return {
    remix: window.__3DP_REMIX_API__ || "/wp-json/3dpolitics/v1/remix",
    remixes: window.__3DP_REMIXES_API__ || "/wp-json/3dpolitics/v1/remixes",
  };
}

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyAleatoria(text: string): string {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim());
  const shuffledParagraphs = paragraphs.map((paragraph) => {
    const sentences = paragraph
      .replace(/([.!?])\s+/g, "$1\n")
      .split("\n")
      .filter((s) => s.trim());
    return shuffleArray(sentences).join(" ");
  });
  return shuffleArray(shuffledParagraphs).join("\n\n");
}

function stripHtml(html: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

const StyleCard = ({
  style,
  selected,
  onClick,
}: {
  style: Style;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`group relative flex h-full cursor-pointer flex-col border-2 bg-[var(--surface)] p-6 text-left transition-all duration-200 ${
      selected
        ? "border-[var(--accent)] shadow-[6px_6px_0px_0px_var(--accent)]"
        : "border-[var(--fg)] shadow-[4px_4px_0px_0px_var(--fg)] hover:border-[var(--accent)] hover:shadow-[6px_6px_0px_0px_var(--accent)]"
    }`}
  >
    <h3 className="font-display text-[1.75rem] font-black leading-tight text-[var(--fg)]">
      {style.name}
    </h3>
    <p className="mb-6 mt-2 flex-1 font-['IBM_Plex_Serif'] text-[0.8125rem] leading-relaxed text-[var(--muted)]">
      {style.descriptor}
    </p>
  </button>
);

const CustomCard = ({
  selected,
  value,
  onChange,
  onSelect,
}: {
  selected: boolean;
  value: string;
  onChange: (nextValue: string) => void;
  onSelect: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected) {
      inputRef.current?.focus();
    }
  }, [selected]);

  return (
    <div
      onClick={onSelect}
      className={`group relative flex h-full cursor-pointer flex-col border-2 bg-[var(--surface)] p-6 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent)] shadow-[6px_6px_0px_0px_var(--accent)]"
          : "border-[var(--fg)] shadow-[4px_4px_0px_0px_var(--fg)] hover:border-[var(--accent)] hover:shadow-[6px_6px_0px_0px_var(--accent)]"
      }`}
    >
      <h3 className="font-display text-[1.75rem] font-black leading-tight text-[var(--fg)]">
        Your voice
      </h3>
      <p className="mb-6 mt-2 flex-1 font-['IBM_Plex_Serif'] text-[0.8125rem] leading-relaxed text-[var(--muted)]">
        Any thinker, any era.
      </p>
      {selected ? (
        <input
          ref={inputRef}
          type="text"
          value={value}
          placeholder="e.g. Simone de Beauvoir"
          onChange={(event) => {
            event.stopPropagation();
            onChange(event.target.value);
          }}
          onClick={(event) => event.stopPropagation()}
          className="w-full border border-[var(--border)]/20 bg-[var(--bg)] px-3 py-2 text-sm text-[var(--fg)] placeholder:text-[var(--muted)]/50 focus:border-[var(--accent)]/60 focus:outline-none"
        />
      ) : value ? (
        <p className="truncate font-mono text-xs text-[var(--accent)]">{value}</p>
      ) : null}
    </div>
  );
};

function formatRemix(text: string) {
  return text.split("\n").map((line, index) => {
    if (!line.trim()) {
      return <div key={index} className="h-4" />;
    }
    const cleanLine = line.replace(/^#{1,3}\s+/, "");

    if (line.startsWith("# ")) {
      return (
        <h2
          key={index}
          className="font-display mt-8 mb-4 text-base font-black uppercase tracking-widest text-[var(--accent)]"
        >
          {cleanLine}
        </h2>
      );
    }

    if (line.startsWith("## ")) {
      return (
        <h3
          key={index}
          className="font-display mt-7 mb-3 text-sm font-black uppercase tracking-widest text-[var(--accent)]"
        >
          {cleanLine}
        </h3>
      );
    }

    if (line.startsWith("### ") || Boolean(line.match(/^[A-Z][A-Z\s:,.-]{4,}$/))) {
      return (
        <h4
          key={index}
          className="font-display mt-6 mb-3 text-xs font-black uppercase tracking-widest text-[var(--fg)]"
        >
          {cleanLine}
        </h4>
      );
    }

    return (
      <p key={index} className="mb-3 text-sm leading-relaxed text-[var(--fg)]">
        {line}
      </p>
    );
  });
}

function downloadMarkdown(remix: Remix) {
  const styleLabel = remix.styleId === "custom" && remix.customAuthor
    ? remix.customAuthor
    : remix.styleName;
  const content = `# 3D Politics Manifesto Remixer

Voice: **${styleLabel}**

## Original

${stripHtml(remix.originalText)}

## Remix

${remix.remixText}
`;
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `3dp-remix-${styleLabel.toLowerCase().replace(/\s+/g, "-")}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function openPrintWindow(remix: Remix) {
  const styleLabel = remix.styleId === "custom" && remix.customAuthor
    ? remix.customAuthor
    : remix.styleName;
  const win = window.open("", "_blank");
  if (!win) return;

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>3D Politics Manifesto Remixer</title>
  <style>
    @page { margin: 1.5cm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 2rem;
      background: #F5F1E8;
      color: #1A1A1A;
      font-family: ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace;
      line-height: 1.6;
    }
    .wordmark {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 1.5rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      text-transform: uppercase;
      margin-bottom: 0.25rem;
    }
    .wordmark span { font-weight: 400; }
    .subtitle {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #C0392B;
      margin-bottom: 2rem;
      border-bottom: 2px solid #1A1A1A;
      padding-bottom: 1rem;
    }
    h1 {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 1.1rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 1.5rem 0 0.75rem;
      color: #C0392B;
    }
    .voice {
      font-size: 0.85rem;
      margin-bottom: 1.5rem;
    }
    .columns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 2rem;
    }
    .column {
      background: #FFFCF5;
      border: 1px solid #1A1A1A;
      padding: 1.5rem;
      box-shadow: 4px 4px 0 0 rgba(26,26,26,0.08);
    }
    .column h2 {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      font-size: 0.8rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin: 0 0 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid #1A1A1A;
    }
    .column p { margin: 0 0 0.75rem; }
    @media print {
      body { background: #fff; padding: 0; }
      .column { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="wordmark">3D<span>Politics</span></div>
  <div class="subtitle">Manifesto Remixer</div>
  <div class="voice">Voice: ${escapeHtml(styleLabel)}</div>
  <div class="columns">
    <div class="column">
      <h2>Original</h2>
      ${remix.originalText}
    </div>
    <div class="column">
      <h2>Remix</h2>
      <div style="white-space: pre-wrap; font-family: ui-monospace, 'IBM Plex Mono', Menlo, Consolas, monospace;">${escapeHtml(remix.remixText)}</div>
    </div>
  </div>
</body>
</html>`;

  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 250);
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("onboarding");
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customAuthor, setCustomAuthor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentRemix, setCurrentRemix] = useState<Remix | null>(null);
  const [gallery, setGallery] = useState<Remix[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activePreset = styleCatalog.find((style) => style.id === selectedStyle) ?? null;
  const activeStyle: ActiveStyle | null =
    selectedStyle === "custom"
      ? { id: "custom", name: customAuthor.trim() || "Custom author" }
      : activePreset;

  const isCustomReady = selectedStyle === "custom" && customAuthor.trim().length > 0;
  const canGenerate =
    Boolean(selectedStyle) && (selectedStyle !== "custom" || isCustomReady) && !isGenerating;

  useEffect(() => {
    if (screen === "gallery") {
      fetchGallery();
    }
  }, [screen]);

  async function fetchGallery() {
    setGalleryLoading(true);
    try {
      const res = await fetch(getApiUrls().remixes, { credentials: "include" });
      if (!res.ok) throw new Error("Could not load gallery.");
      const data = (await res.json()) as Array<{
        id: number;
        style_id: string;
        style_name: string;
        custom_author: string;
        original_text: string;
        remix_text: string;
        date: string;
      }>;
      setGallery(
        data.map((item) => ({
          id: String(item.id),
          styleId: item.style_id,
          styleName: item.style_name,
          customAuthor: item.custom_author,
          originalText: item.original_text,
          remixText: item.remix_text,
          date: item.date,
          saved: true,
        }))
      );
    } catch (err) {
      console.error(err);
    } finally {
      setGalleryLoading(false);
    }
  }

  const handleRemix = async () => {
    if (!canGenerate || !selectedStyle) return;

    setIsGenerating(true);
    setError(null);

    try {
      const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || "https://api.3dpolitics.xyz/ai/v1";

      const tokenRes = await fetch(`${gatewayUrl}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ use_cases: ["remixer_manifesto"] }),
      });
      const tokenPayload = (await tokenRes.json()) as { token?: string; message?: string };
      if (!tokenRes.ok || !tokenPayload.token) {
        throw new Error(tokenPayload.message ?? "Could not get a request token.");
      }

      const response = await fetch(`${gatewayUrl}/execute`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenPayload.token}`,
        },
        body: JSON.stringify({
          use_case: "remixer_manifesto",
          input: {
            style_id: selectedStyle,
            custom_author:
              selectedStyle === "custom" ? customAuthor.trim() : undefined,
          },
        }),
      });

      const payload = (await response.json()) as {
        output?: { text?: string };
        message?: string;
        limits?: { remaining_today?: number };
      };

      if (!response.ok || !payload.output?.text) {
        throw new Error(payload.message ?? "The remix request failed.");
      }

      let text = payload.output.text.trim();
      if (selectedStyle === "aleatoria") {
        text = applyAleatoria(text);
      }

      const styleName = activeStyle?.name ?? selectedStyle;
      const newRemix: Remix = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        styleId: selectedStyle,
        styleName,
        customAuthor: selectedStyle === "custom" ? customAuthor.trim() : "",
        originalText: getManifesto(),
        remixText: text,
        saved: false,
      };

      setCurrentRemix(newRemix);
      setRemainingToday(payload.limits?.remaining_today ?? null);
      setScreen("result");
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : "The remix request failed.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = async (remix: Remix) => {
    if (!remix) return;
    try {
      const res = await fetch(getApiUrls().remixes, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          style_id: remix.styleId,
          style_name: remix.styleName,
          custom_author: remix.customAuthor,
          original_text: remix.originalText,
          remix_text: remix.remixText,
        }),
      });
      if (!res.ok) throw new Error("Save failed.");
      setSavedIds((prev) => new Set(prev).add(remix.id));
      if (currentRemix?.id === remix.id) {
        setCurrentRemix({ ...currentRemix, saved: true });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  const openRemix = (remix: Remix) => {
    setCurrentRemix(remix);
    setScreen("result");
  };

  return (
    <div className="remixer-root bg-[var(--bg)] text-[var(--fg)]">
      <main className="flex w-full flex-col py-10">
        {screen === "onboarding" && (
          <section
            className="pt-20 pb-24"
            style={{
              minHeight: '70vh',
              background: `
                radial-gradient(ellipse 60% 40% at 20% 80%, rgba(95, 158, 160, 0.14), transparent 70%),
                radial-gradient(ellipse 50% 35% at 80% 20%, rgba(212, 160, 23, 0.12), transparent 70%),
                radial-gradient(ellipse 45% 30% at 70% 75%, rgba(232, 165, 152, 0.10), transparent 70%),
                var(--bg)
              `,
            }}
          >
            <div className="px-6 text-center" style={{ maxWidth: '960px', margin: '0 auto' }}>
              <div className="mb-16">
                <h1 className="font-display text-[clamp(2.5rem,6vw,4rem)] font-extrabold leading-[1.05] tracking-[-0.02em]">
                  Manifesto Remixer
                </h1>
                <p className="mx-auto mt-4 max-w-xl font-['IBM_Plex_Serif'] text-[1.125rem] leading-[1.7] text-[var(--muted)]">
                  Rewrite the 3D Politics manifesto through the voice of a philosopher,
                  revolutionary, or thinker of your choice.
                </p>
              </div>

              <div
                className="flex flex-col justify-center gap-6 md:flex-row"
                style={{ margin: '0 auto', maxWidth: '760px' }}
              >
                <div
                  className="flex flex-col items-center justify-center text-center border-2 border-[var(--fg)] bg-[var(--surface)] p-8 shadow-[6px_6px_0px_0px_var(--accent)]"
                  style={{ minHeight: '280px', width: '100%', maxWidth: '340px' }}
                >
                  <h2 className="font-display text-xl font-bold text-[var(--fg)]">Start remixing</h2>
                  <p className="mb-10 mt-3 font-['IBM_Plex_Serif'] text-[1.0625rem] leading-[1.7] text-[var(--muted)]">
                    Pick a voice and generate your own version of the manifesto.
                  </p>
                  <button
                    onClick={() => setScreen("voice")}
                    className="border border-[var(--accent)] bg-[var(--accent)] px-10 py-5 text-base font-medium text-[var(--accent-contrast)] shadow-[3px_3px_0px_0px_var(--fg)] transition-colors hover:bg-[var(--fg)] hover:border-[var(--fg)]"
                  >
                    Start
                  </button>
                </div>

                <div
                  className="flex flex-col items-center justify-center text-center border-2 border-[var(--fg)] bg-[var(--surface)] p-8 shadow-[4px_4px_0px_0px_var(--fg)]"
                  style={{ minHeight: '280px', width: '100%', maxWidth: '340px' }}
                >
                  <h2 className="font-display text-xl font-bold text-[var(--fg)]">Past remixes</h2>
                  <p className="mb-10 mt-3 font-['IBM_Plex_Serif'] text-[1.0625rem] leading-[1.7] text-[var(--muted)]">
                    Browse remixes saved by everyone and open them side by side.
                  </p>
                  <button
                    onClick={() => setScreen("gallery")}
                    className="border border-[var(--fg)] bg-[var(--fg)] px-10 py-5 text-base font-medium text-[var(--surface)] shadow-[3px_3px_0px_0px_var(--accent)] transition-colors hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                  >
                    Browse gallery
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {screen === "voice" && (
          <section className="px-6 py-4">
            <div className="mb-12 text-center">
              <h2 className="font-display mb-3 text-[clamp(2rem,5vw,3.5rem)] font-black uppercase tracking-tight">
                What if they had written it?
              </h2>
              <p className="mx-auto max-w-2xl text-[1.0625rem] leading-[1.7] text-[var(--muted)]">
                Pick a political mind and generate a rewritten 3D Politics manifesto.
              </p>
            </div>

            <div className="mx-auto mb-12" style={{ maxWidth: '960px' }}>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {styleCatalog.map((style) => (
                  <StyleCard
                    key={style.id}
                    style={style}
                    selected={selectedStyle === style.id}
                    onClick={() => setSelectedStyle(style.id)}
                  />
                ))}
                <CustomCard
                  selected={selectedStyle === "custom"}
                  value={customAuthor}
                  onChange={setCustomAuthor}
                  onSelect={() => setSelectedStyle("custom")}
                />
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4">
              <button
                onClick={handleRemix}
                disabled={!canGenerate}
                className={`flex items-center gap-2.5 border-2 px-10 py-5 text-base font-medium uppercase tracking-wider transition-all duration-200 ${
                  canGenerate
                    ? "cursor-pointer border-[var(--fg)] bg-[var(--fg)] text-[var(--surface)] shadow-[4px_4px_0px_0px_var(--accent)] hover:bg-[var(--surface)] hover:text-[var(--fg)]"
                    : "cursor-not-allowed border-[var(--border)]/20 bg-transparent text-[var(--muted)]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Remixing manifesto…
                  </>
                ) : activeStyle ? (
                  <>Remix as {activeStyle.name}</>
                ) : (
                  "Select a voice to remix"
                )}
              </button>
              {remainingToday !== null && (
                <p className="font-mono text-xs text-[var(--muted)]">
                  {remainingToday} remixes remaining today for this browser session.
                </p>
              )}
            </div>

            {error && (
              <div className="mx-auto mt-6 max-w-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)]">
                {error}
              </div>
            )}
          </section>
        )}

        {screen === "result" && currentRemix && (
          <section className="mx-auto max-w-6xl px-6 py-4">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="mb-1 inline-block border border-[var(--border)]/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]">
                  Remix result
                </div>
                <h2 className="font-display text-xl font-black uppercase tracking-tight text-[var(--fg)]">
                  {currentRemix.styleName}
                </h2>
              </div>
              <button
                onClick={() => setScreen("gallery")}
                className="flex items-center gap-1.5 border border-[var(--border)]/20 bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
                <div className="border-b border-[var(--border)]/10 px-5 py-3">
                  <h3 className="font-display text-sm font-black uppercase tracking-widest text-[var(--fg)]">
                    Original
                  </h3>
                  <p className="font-mono text-[10px] text-[var(--muted)]">
                    3D Politics manifesto
                  </p>
                </div>
                <div
                  className="min-h-80 max-h-[70vh] overflow-y-auto px-6 py-6 text-sm leading-relaxed text-[var(--fg)]"
                  dangerouslySetInnerHTML={{ __html: currentRemix.originalText }}
                />
              </div>

              <div className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
                <div className="flex items-center justify-between border-b border-[var(--border)]/10 px-5 py-3">
                  <div>
                    <h3 className="font-display text-sm font-black uppercase tracking-widest text-[var(--fg)]">
                      Remix
                    </h3>
                    <p className="font-mono text-[10px] text-[var(--muted)]">
                      In the voice of {currentRemix.styleName}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(currentRemix.remixText, currentRemix.id)}
                    className="flex cursor-pointer items-center gap-1.5 border border-[var(--border)]/20 px-3 py-1.5 font-mono text-xs text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
                  >
                    {copiedId === currentRemix.id ? (
                      <>
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-green-600">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3 w-3" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
                <div className="min-h-80 max-h-[70vh] overflow-y-auto px-6 py-6">
                  {formatRemix(currentRemix.remixText)}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 border-t border-[var(--border)]/10 px-6 py-10">
              <div className="mb-2 font-mono text-xs uppercase tracking-wider text-[var(--muted)]">
                Save or download your remix
              </div>
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => downloadMarkdown(currentRemix)}
                  className="flex items-center gap-2 border-2 border-[var(--fg)] bg-[var(--surface)] px-8 py-4 font-mono text-sm uppercase tracking-wider text-[var(--fg)] shadow-[4px_4px_0px_0px_var(--accent)] transition-colors hover:bg-[var(--fg)] hover:text-[var(--surface)]"
                >
                  <Download className="h-5 w-5" />
                  Download Markdown
                </button>
                <button
                  onClick={() => openPrintWindow(currentRemix)}
                  className="flex items-center gap-2 border-2 border-[var(--fg)] bg-[var(--surface)] px-8 py-4 font-mono text-sm uppercase tracking-wider text-[var(--fg)] shadow-[4px_4px_0px_0px_var(--accent)] transition-colors hover:bg-[var(--fg)] hover:text-[var(--surface)]"
                >
                  <Download className="h-5 w-5" />
                  Download PDF
                </button>
              </div>
              <div className="flex flex-wrap justify-center gap-3 pt-2">
                <button
                  onClick={() => handleSave(currentRemix)}
                  disabled={currentRemix.saved || savedIds.has(currentRemix.id)}
                  className={`flex items-center gap-1.5 border px-5 py-3 font-mono text-xs uppercase tracking-wider transition-colors ${
                    currentRemix.saved || savedIds.has(currentRemix.id)
                      ? "cursor-default border-green-600/30 bg-green-600/10 text-green-700"
                      : "border-[var(--border)]/30 bg-[var(--surface)] text-[var(--fg)] hover:border-[var(--fg)]"
                  }`}
                >
                  {currentRemix.saved || savedIds.has(currentRemix.id) ? (
                    <>
                      <Check className="h-4 w-4" />
                      Saved
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save
                    </>
                  )}
                </button>
                <button
                  onClick={() => setScreen("gallery")}
                  className="flex items-center gap-1.5 border border-[var(--border)]/30 bg-[var(--surface)] px-5 py-3 font-mono text-xs uppercase tracking-wider text-[var(--fg)] transition-colors hover:border-[var(--fg)]"
                >
                  <X className="h-4 w-4" />
                  Close
                </button>
              </div>
            </div>
          </section>
        )}

        {screen === "gallery" && (
          <section className="mx-auto max-w-6xl px-6 py-4">
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--fg)]">
                  Past remixes
                </h2>
                <p className="font-mono text-xs text-[var(--muted)]">
                  {gallery.length > 0
                    ? `${gallery.length} saved remix${gallery.length === 1 ? "" : "es"}`
                    : "No saved remixes yet."}
                </p>
              </div>
              <button
                onClick={() => setScreen("voice")}
                className="flex items-center gap-1.5 border border-[var(--fg)] bg-[var(--fg)] px-5 py-2.5 text-sm font-medium text-[var(--surface)] shadow-[4px_4px_0px_0px_var(--accent)] transition-colors hover:bg-[var(--border)]"
              >
                <Sparkles className="h-4 w-4" />
                Restart
              </button>
            </div>

            {galleryLoading ? (
              <div className="flex h-48 items-center justify-center gap-2 font-mono text-xs text-[var(--muted)]">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading gallery…
              </div>
            ) : gallery.length === 0 ? (
              <div className="border border-[var(--border)]/15 bg-[var(--surface)] p-12 text-center">
                <Sparkles className="mx-auto mb-3 h-8 w-8 text-[var(--border)]/40" />
                <p className="font-mono text-sm text-[var(--muted)]">
                  Generated remixes you save will appear here.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {gallery.map((remix) => (
                  <button
                    key={remix.id}
                    onClick={() => openRemix(remix)}
                    className="relative cursor-pointer border border-[var(--border)]/20 bg-[var(--surface)] p-5 text-left transition-all duration-200 hover:border-[var(--fg)] hover:shadow-[4px_4px_0px_0px_var(--accent)]"
                  >
                    <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
                      {remix.styleName}
                    </div>
                    <p className="line-clamp-4 text-left text-xs leading-relaxed text-[var(--muted)]">
                      {remix.remixText.slice(0, 240)}
                      {remix.remixText.length > 240 ? "…" : ""}
                    </p>
                    <div className="mt-3 font-mono text-[9px] uppercase tracking-wider text-[var(--muted)]/70">
                      {remix.date
                        ? new Date(remix.date).toLocaleDateString()
                        : "Saved remix"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}
      </main>

      <div className="border-t border-[var(--border)]/30 bg-[var(--bg)] px-6 py-5 text-center" style={{ textAlign: 'center' }}>
        <div className="mx-auto max-w-6xl" style={{ textAlign: 'center', margin: '0 auto' }}>
          <p className="mx-auto max-w-2xl font-mono text-[11px] leading-relaxed text-[var(--muted)]" style={{ textAlign: 'center', margin: '0 auto' }}>
            Provider, prompt, and credentials stay server-side.
          </p>
        </div>
      </div>
    </div>
  );
}
