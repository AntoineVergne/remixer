import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Loader2, Pen, Shield, Sparkles } from "lucide-react";
import styleCatalog from "../shared/style-catalog.json";

type Style = (typeof styleCatalog)[number];
type ActiveStyle = Style | { id: "custom"; name: string };

type Remix = {
  id: string;
  styleName: string;
  styleId: string;
  text: string;
  descriptor?: string;
};

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
  const shuffledParagraphs = shuffleArray(paragraphs).map((paragraph) => {
    const sentences = paragraph
      .replace(/([.!?])\s+/g, "$1\n")
      .split("\n")
      .filter((s) => s.trim());
    return shuffleArray(sentences).join(" ");
  });
  return shuffledParagraphs.join("\n\n");
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
    className={`relative cursor-pointer border bg-[var(--surface)] p-4 text-left transition-all duration-200 ${
      selected
        ? `${style.border} shadow-[4px_4px_0px_0px_var(--fg)] scale-[1.01]`
        : "border-[var(--border)]/15 hover:border-[var(--border)]/60"
    }`}
  >
    {selected && (
      <div
        className={`absolute right-3 top-3 h-2 w-2 rounded-full ${style.textAccent.replace("text-", "bg-")}`}
      />
    )}
    <div
      className={`mb-2 font-mono text-[10px] uppercase tracking-[0.2em] ${style.textAccent}`}
    >
      {style.icon}
    </div>
    <div
      className={`mb-1 inline-block border px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider ${style.badge}`}
    >
      {style.era}
    </div>
    <h3 className="font-display mt-1 mb-0.5 text-sm font-bold text-[var(--fg)]">
      {style.name}
    </h3>
    <p className="text-[11px] leading-relaxed text-[var(--muted)]">
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
      className={`relative cursor-pointer border bg-[var(--surface)] p-4 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent)] shadow-[4px_4px_0px_0px_var(--accent)] scale-[1.01]"
          : "border-dashed border-[var(--border)]/30 hover:border-[var(--border)]/60"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--accent)]" />
      )}
      <div className="mb-2 text-[var(--accent)]">
        <Pen className="h-5 w-5" />
      </div>
      <div className="mb-1 inline-block border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--accent)]">
        your choice
      </div>
      <h3 className="font-display mt-1 mb-1.5 text-sm font-bold text-[var(--fg)]">
        In the style of…
      </h3>
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
      {!selected && !value && (
        <p className="mt-2 text-[11px] text-[var(--muted)]">Any thinker, any era</p>
      )}
      {value && !selected && (
        <p className="mt-2 truncate text-[11px] text-[var(--accent)]">{value}</p>
      )}
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

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customAuthor, setCustomAuthor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputs, setOutputs] = useState<Remix[]>([]);
  const [activeOutputId, setActiveOutputId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const activePreset =
    styleCatalog.find((style) => style.id === selectedStyle) ?? null;

  const activeStyle: ActiveStyle | null =
    selectedStyle === "custom"
      ? { id: "custom", name: customAuthor.trim() || "Custom author" }
      : activePreset;

  const isCustomReady =
    selectedStyle === "custom" && customAuthor.trim().length > 0;
  const canGenerate =
    Boolean(selectedStyle) &&
    (selectedStyle !== "custom" || isCustomReady) &&
    !isGenerating;

  const activeOutput = outputs.find((o) => o.id === activeOutputId) ?? outputs[0] ?? null;

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

      const newRemix: Remix = {
        id: crypto.randomUUID?.() ?? String(Date.now()),
        styleName: activeStyle?.name ?? selectedStyle,
        styleId: selectedStyle,
        text,
        descriptor:
          selectedStyle === "custom"
            ? "custom voice"
            : activePreset?.descriptor ?? "secured remix",
      };

      setOutputs((prev) => [newRemix, ...prev]);
      setActiveOutputId(newRemix.id);
      setRemainingToday(payload.limits?.remaining_today ?? null);
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "The remix request failed.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    window.setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div>
            <a
              href="https://3dpolitics.xyz"
              className="font-display text-lg font-black uppercase tracking-tight"
            >
              3D<span className="font-normal text-[var(--muted)]">Politics</span>
            </a>
            <p className="mt-0.5 font-mono text-xs text-[var(--muted)]">
              Manifesto Remixer
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://3dpolitics.xyz/manifesto/"
              className="flex items-center gap-1.5 border border-[var(--border)]/20 bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to manifesto
            </a>
            <div className="hidden items-center gap-2 border border-[var(--border)]/20 bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--muted)] md:flex">
              <Shield className="h-3.5 w-3.5" />
              Provider, prompt, and credentials stay server-side
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <section className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center gap-2 border border-[var(--border)]/20 px-3 py-1 font-mono text-xs text-[var(--muted)]">
            <Sparkles className="h-3.5 w-3.5" />
            8 voices + yours · 1 protected gateway
          </div>
          <h2 className="font-display mb-2 text-3xl font-black uppercase tracking-tight md:text-4xl">
            What if they had written it?
          </h2>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-[var(--muted)]">
            Pick a political mind and generate a rewritten 3D Politics manifesto.
            The browser only sends your selection; the backend handles the model,
            prompt, and limits.
          </p>
          <p className="mt-2 font-mono text-xs text-[var(--muted)]">
            {remainingToday === null
              ? "Public usage is rate-limited and logged to protect the service."
              : `${remainingToday} remixes remaining today for this browser session.`}
          </p>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.25fr_0.95fr] lg:items-start">
          {/* Left: author selection */}
          <section>
            <h3 className="font-display mb-3 text-xs font-black uppercase tracking-widest text-[var(--muted)]">
              Choose a voice
            </h3>
            <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-2">
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

            <div className="flex justify-center lg:justify-start">
              <button
                onClick={handleRemix}
                disabled={!canGenerate}
                className={`flex items-center gap-2.5 border px-8 py-3.5 text-sm font-medium transition-all duration-200 ${
                  canGenerate
                    ? "cursor-pointer border-[var(--fg)] bg-[var(--fg)] text-[var(--surface)] shadow-[4px_4px_0px_0px_var(--accent)] hover:bg-[var(--border)]"
                    : "cursor-not-allowed border-[var(--border)]/20 bg-transparent text-[var(--muted)]"
                }`}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Remixing manifesto…
                  </>
                ) : activeStyle ? (
                  <>Remix as {activeStyle.name}</>
                ) : (
                  "Select a voice to remix"
                )}
              </button>
            </div>

            {error && (
              <div className="mt-6 border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)]">
                {error}
              </div>
            )}
          </section>

          {/* Middle: output pane */}
          <section className="border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 px-5 py-3">
              <div>
                <h3 className="font-display text-sm font-black uppercase tracking-widest text-[var(--fg)]">
                  {activeOutput ? activeOutput.styleName : "Output"}
                </h3>
                <p className="font-mono text-[10px] text-[var(--muted)]">
                  {activeOutput
                    ? activeOutput.descriptor
                    : "Generated remixes appear here"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && !activeOutput && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    generating
                  </div>
                )}
                {activeOutput && (
                  <button
                    onClick={() => handleCopy(activeOutput.text, activeOutput.id)}
                    className="flex cursor-pointer items-center gap-1.5 border border-[var(--border)]/20 px-3 py-1.5 font-mono text-xs text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
                  >
                    {copiedId === activeOutput.id ? (
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
                )}
              </div>
            </div>

            <div className="min-h-[320px] max-h-[70vh] overflow-y-auto px-6 py-6">
              {activeOutput ? (
                <div className="max-w-none">
                  {formatRemix(activeOutput.text)}
                </div>
              ) : (
                <div className="flex h-full min-h-[280px] flex-col items-center justify-center text-center">
                  <Sparkles className="mb-3 h-8 w-8 text-[var(--border)]/40" />
                  <p className="font-mono text-sm text-[var(--muted)]">
                    Select a voice and generate to see the remix here.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Right: past remixes pane */}
          <section className="flex flex-col border border-[var(--border)] bg-[var(--surface)]">
            <div className="border-b border-[var(--border)]/10 px-5 py-3">
              <h3 className="font-display text-sm font-black uppercase tracking-widest text-[var(--fg)]">
                Past remixes
              </h3>
              <p className="font-mono text-[10px] text-[var(--muted)]">
                {outputs.length > 0
                  ? `${outputs.length} saved — click to read, copy to paste`
                  : "Saved remixes will appear here"}
              </p>
            </div>

            <div className="max-h-[70vh] flex-1 overflow-y-auto">
              {outputs.length === 0 ? (
                <div className="flex h-48 flex-col items-center justify-center px-6 text-center">
                  <Sparkles className="mb-2 h-6 w-6 text-[var(--border)]/40" />
                  <p className="font-mono text-xs text-[var(--muted)]">
                    Your previous remixes will be listed here.
                  </p>
                </div>
              ) : (
                <ul className="divide-y divide-[var(--border)]/10">
                  {outputs.map((output) => {
                    const isActive =
                      activeOutputId === output.id ||
                      (activeOutputId === null && output.id === outputs[0].id);
                    return (
                      <li
                        key={output.id}
                        onClick={() => setActiveOutputId(output.id)}
                        className={`cursor-pointer p-4 transition-colors ${
                          isActive
                            ? "bg-[var(--accent)]/5"
                            : "hover:bg-[var(--bg)]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <h4
                              className={`font-display truncate text-xs font-bold ${
                                isActive ? "text-[var(--accent)]" : "text-[var(--fg)]"
                              }`}
                            >
                              {output.styleName}
                            </h4>
                            <p className="font-mono text-[9px] text-[var(--muted)]">
                              {output.descriptor}
                            </p>
                            <p className="mt-1 line-clamp-3 text-[11px] leading-relaxed text-[var(--muted)]">
                              {output.text}
                            </p>
                          </div>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleCopy(output.text, output.id);
                            }}
                            className="flex shrink-0 items-center gap-1 border border-[var(--border)]/20 px-2 py-1 font-mono text-[10px] text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
                            title="Copy this remix"
                          >
                            {copiedId === output.id ? (
                              <Check className="h-3 w-3 text-green-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                            <span className="hidden sm:inline">
                              {copiedId === output.id ? "Copied" : "Copy"}
                            </span>
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      </main>

      <footer className="mt-10 border-t border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 font-mono text-xs text-[var(--muted)]">
          <span>3D Politics by Antoine Vergne</span>
          <span>Backend-selected LLM provider</span>
        </div>
      </footer>
    </div>
  );
}
