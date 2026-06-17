import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Pen, Shield, Sparkles } from "lucide-react";
import styleCatalog from "../shared/style-catalog.json";

type Style = (typeof styleCatalog)[number];
type ActiveStyle = Style | { id: "custom"; name: string };

function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function applyAleatoria(text: string): string {
  // Split into paragraphs, shuffle, then shuffle sentences within each paragraph.
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
    className={`relative cursor-pointer border bg-[var(--surface)] p-5 text-left transition-all duration-200 ${
      selected
        ? `${style.border} shadow-[4px_4px_0px_0px_var(--fg)] scale-[1.01]`
        : "border-[var(--border)]/20 hover:border-[var(--border)]/60"
    }`}
  >
    {selected && (
      <div
        className={`absolute right-3 top-3 h-2 w-2 rounded-full ${style.textAccent.replace("text-", "bg-")}`}
      />
    )}
    <div
      className={`mb-3 font-mono text-xs uppercase tracking-[0.25em] ${style.textAccent}`}
    >
      {style.icon}
    </div>
    <div
      className={`mb-1 inline-block border px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${style.badge}`}
    >
      {style.era}
    </div>
    <h3 className="font-display mt-2 mb-1 text-base font-bold text-[var(--fg)]">
      {style.name}
    </h3>
    <p className="text-xs leading-relaxed text-[var(--muted)]">
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
      className={`relative cursor-pointer border bg-[var(--surface)] p-5 text-left transition-all duration-200 ${
        selected
          ? "border-[var(--accent)] shadow-[4px_4px_0px_0px_var(--accent)] scale-[1.01]"
          : "border-dashed border-[var(--border)]/30 hover:border-[var(--border)]/60"
      }`}
    >
      {selected && (
        <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-[var(--accent)]" />
      )}
      <div className="mb-3 text-[var(--accent)]">
        <Pen className="h-6 w-6" />
      </div>
      <div className="mb-1 inline-block border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
        your choice
      </div>
      <h3 className="font-display mt-2 mb-2 text-base font-bold text-[var(--fg)]">
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
        <p className="mt-2 text-xs text-[var(--muted)]">Any thinker, any era</p>
      )}
      {value && !selected && (
        <p className="mt-2 truncate text-xs text-[var(--accent)]">{value}</p>
      )}
    </div>
  );
};

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customAuthor, setCustomAuthor] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixedText, setRemixedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [remainingToday, setRemainingToday] = useState<number | null>(null);

  const activePreset = styleCatalog.find((style) => style.id === selectedStyle) ?? null;

  const activeStyle: ActiveStyle | null =
    selectedStyle === "custom"
      ? {
          id: "custom",
          name: customAuthor.trim() || "Custom author",
        }
      : activePreset;

  const isCustomReady = selectedStyle === "custom" && customAuthor.trim().length > 0;
  const canGenerate =
    Boolean(selectedStyle) &&
    (selectedStyle !== "custom" || isCustomReady) &&
    !isGenerating;

  const outputAccent =
    selectedStyle === "custom"
      ? "text-[var(--accent)]"
      : activePreset?.textAccent ?? "text-[var(--muted)]";

  const handleRemix = async () => {
    if (!canGenerate || !selectedStyle) {
      return;
    }

    setIsGenerating(true);
    setError(null);
    setRemixedText("");

    try {
      const response = await fetch("/api/remix", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          style_id: selectedStyle,
          custom_author:
            selectedStyle === "custom" ? customAuthor.trim() : undefined,
        }),
      });

      const payload = (await response.json()) as {
        reply?: string;
        message?: string;
        limits?: { remaining_today?: number };
      };

      if (!response.ok || !payload.reply) {
        throw new Error(payload.message ?? "The remix request failed.");
      }

      let text = payload.reply.trim();
      if (selectedStyle === "aleatoria") {
        text = applyAleatoria(text);
      }

      setRemixedText(text);
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

  const handleCopy = async () => {
    await navigator.clipboard.writeText(remixedText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <header className="border-b border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
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
          <div className="hidden items-center gap-2 border border-[var(--border)]/20 bg-[var(--surface)] px-3 py-2 font-mono text-xs text-[var(--muted)] md:flex">
            <Shield className="h-3.5 w-3.5" />
            Provider, prompt, and credentials stay server-side
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 border border-[var(--border)]/20 px-3 py-1 font-mono text-xs text-[var(--muted)]">
            <Sparkles className="h-3.5 w-3.5" />
            8 voices + yours · 1 protected gateway
          </div>
          <h2 className="font-display mb-3 text-4xl font-black uppercase tracking-tight">
            What if they had written it?
          </h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--muted)]">
            Pick a political mind and generate a rewritten 3D Politics manifesto.
            The browser only sends your selection. The backend chooses the LLM
            provider, model, prompt, and output limits.
          </p>
          <p className="mt-4 font-mono text-sm text-[var(--muted)]">
            {remainingToday === null
              ? "Public usage is rate-limited and logged to protect the service."
              : `${remainingToday} remixes remaining today for this browser session.`}
          </p>
        </section>

        <section className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
        </section>

        <div className="mb-10 flex justify-center">
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
          <div className="mb-8 border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-4 text-sm text-[var(--accent)]">
            {error}
          </div>
        )}

        {(remixedText || isGenerating) && (
          <div className="overflow-hidden border border-[var(--border)] bg-[var(--surface)]">
            <div className="flex items-center justify-between border-b border-[var(--border)]/10 px-6 py-4">
              <div>
                <div className={`font-display text-sm font-bold ${outputAccent}`}>
                  {activeStyle?.name}
                </div>
                <div className="font-mono text-xs text-[var(--muted)]">
                  {selectedStyle === "custom"
                    ? "custom voice"
                    : activePreset?.descriptor ?? "secured remix"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--muted)]">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    generating
                  </div>
                )}
                {remixedText && !isGenerating && (
                  <button
                    onClick={handleCopy}
                    className="flex cursor-pointer items-center gap-1.5 border border-[var(--border)]/20 px-3 py-1.5 font-mono text-xs text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]"
                  >
                    {copied ? (
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
            <div className="px-8 py-8">
              <div className="prose prose-sm max-w-none">
                {remixedText.split("\n").map((line, index) => {
                  if (!line.trim()) {
                    return <div key={index} className="h-4" />;
                  }

                  const isHeading =
                    Boolean(line.match(/^[A-Z][A-Z\s:,.-]{4,}$/)) ||
                    line.startsWith("# ") ||
                    line.startsWith("## ") ||
                    line.startsWith("### ");
                  const cleanLine = line.replace(/^#{1,3}\s+/, "");

                  if (isHeading) {
                    return (
                      <h3
                        key={index}
                        className={`font-display mt-6 mb-2 text-sm font-black uppercase tracking-widest ${outputAccent}`}
                      >
                        {cleanLine}
                      </h3>
                    );
                  }

                  return (
                    <p
                      key={index}
                      className="mb-0 text-sm leading-relaxed text-[var(--fg)]"
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!remixedText && !isGenerating && (
          <div className="py-4 text-center font-mono text-sm text-[var(--muted)]">
            {!selectedStyle
              ? "Choose a voice above to begin"
              : selectedStyle === "custom" && !customAuthor.trim()
                ? "Type an author name in the card above"
                : "Generate a remix through the backend gateway"}
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-[var(--border)] px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 font-mono text-xs text-[var(--muted)]">
          <span>3D Politics by Antoine Vergne</span>
          <span>Backend-selected LLM provider · remixer.3dpolitics.xyz</span>
        </div>
      </footer>
    </div>
  );
}
