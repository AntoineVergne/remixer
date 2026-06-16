import { useEffect, useRef, useState } from "react";
import { Check, Copy, Loader2, Pen, Shield, Sparkles } from "lucide-react";
import styleCatalog from "../shared/style-catalog.json";

type Style = (typeof styleCatalog)[number];
type ActiveStyle = Style | { id: "custom"; name: string };

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
    className={`relative cursor-pointer rounded-xl border bg-gradient-to-br p-5 text-left transition-all duration-200 ${style.color} ${
      selected
        ? `${style.border} ${style.glow} scale-[1.02] shadow-lg`
        : "border-white/10 hover:scale-[1.01] hover:border-white/25"
    }`}
  >
    {selected && (
      <div
        className={`absolute right-3 top-3 h-2 w-2 rounded-full ${style.border.replace("border-", "bg-")}`}
      />
    )}
    <div className={`mb-3 text-sm font-mono uppercase tracking-[0.3em] ${style.textAccent}`}>
      {style.icon}
    </div>
    <div
      className={`mb-1 inline-block rounded-full border px-2 py-0.5 font-mono text-xs ${style.badge}`}
    >
      {style.era}
    </div>
    <h3 className="mt-2 mb-1 font-semibold text-white">{style.name}</h3>
    <p className="text-xs leading-relaxed text-white/50">{style.descriptor}</p>
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
      className={`relative cursor-pointer rounded-xl border bg-gradient-to-br from-violet-950 to-fuchsia-950 p-5 text-left transition-all duration-200 ${
        selected
          ? "scale-[1.02] border-violet-400 shadow-lg shadow-violet-400/20"
          : "border-dashed border-white/20 hover:scale-[1.01] hover:border-white/40"
      }`}
    >
      {selected && <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-violet-400" />}
      <div className="mb-3 text-violet-300">
        <Pen className="h-6 w-6" />
      </div>
      <div className="mb-1 inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 font-mono text-xs text-violet-300">
        your choice
      </div>
      <h3 className="mt-2 mb-2 font-semibold text-white">In the style of...</h3>
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
        className="w-full rounded-lg border border-white/15 bg-white/8 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-violet-400/60 focus:outline-none"
      />
      {!selected && !value && <p className="mt-2 text-xs text-white/40">Any thinker, any era</p>}
      {value && !selected && <p className="mt-2 truncate text-xs text-violet-300">{value}</p>}
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
      ? "text-violet-300"
      : activePreset?.textAccent ?? "text-white/70";

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
          custom_author: selectedStyle === "custom" ? customAuthor.trim() : undefined,
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

      setRemixedText(payload.reply);
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
    <div className="min-h-screen bg-[#080810] text-white">
      <header className="border-b border-white/8 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              3D Politics <span className="font-normal text-white/40">Manifesto Remixer</span>
            </h1>
            <p className="mt-0.5 text-xs text-white/40">
              Public release with a backend-secured LLM gateway
            </p>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300 md:flex">
            <Shield className="h-3.5 w-3.5" />
            Provider, prompt, and credentials stay server-side
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <section className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-1 font-mono text-xs text-white/40">
            <Sparkles className="h-3.5 w-3.5" />
            6 voices + yours · 1 protected gateway
          </div>
          <h2 className="mb-3 text-4xl font-bold tracking-tight">What if they had written it?</h2>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/55">
            Pick a political mind and generate a rewritten 3D Politics manifesto. The browser only
            sends your selection. The backend chooses the LLM provider, model, prompt, and output
            limits.
          </p>
          <p className="mt-4 text-sm text-white/35">
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
            className={`flex items-center gap-2.5 rounded-xl px-8 py-3.5 text-sm font-medium transition-all duration-200 ${
              canGenerate
                ? "cursor-pointer bg-white text-black shadow-lg shadow-white/10 hover:scale-[1.02] hover:bg-white/90"
                : "cursor-not-allowed bg-white/10 text-white/30"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Remixing manifesto...
              </>
            ) : activeStyle ? (
              <>Remix as {activeStyle.name}</>
            ) : (
              "Select a voice to remix"
            )}
          </button>
        </div>

        {error && (
          <div className="mb-8 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {(remixedText || isGenerating) && (
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
            <div className="flex items-center justify-between border-b border-white/8 px-6 py-4">
              <div>
                <div className={`text-sm font-medium ${outputAccent}`}>{activeStyle?.name}</div>
                <div className="text-xs text-white/40">
                  {selectedStyle === "custom"
                    ? "custom voice"
                    : activePreset?.descriptor ?? "secured remix"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    generating
                  </div>
                )}
                {remixedText && !isGenerating && (
                  <button
                    onClick={handleCopy}
                    className="flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3 w-3 text-green-400" />
                        <span className="text-green-400">Copied</span>
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
              <div className="prose prose-invert prose-sm max-w-none">
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
                        className={`mt-6 mb-2 text-sm font-bold uppercase tracking-widest ${outputAccent}`}
                      >
                        {cleanLine}
                      </h3>
                    );
                  }

                  return (
                    <p key={index} className="mb-0 text-sm leading-relaxed text-white/80">
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!remixedText && !isGenerating && (
          <div className="py-4 text-center text-sm text-white/20">
            {!selectedStyle
              ? "Choose a voice above to begin"
              : selectedStyle === "custom" && !customAuthor.trim()
                ? "Type an author name in the card above"
                : "Generate a remix through the backend gateway"}
          </div>
        )}
      </main>

      <footer className="mt-10 border-t border-white/8 px-6 py-5">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 text-xs text-white/25">
          <span>3D Politics by Antoine Vergne</span>
          <span>Backend-selected LLM provider · remixer.3dpolitics.xyz</span>
        </div>
      </footer>
    </div>
  );
}
