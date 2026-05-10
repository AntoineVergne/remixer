import { useState, useRef, useEffect } from "react";
import Anthropic from "@anthropic-ai/sdk";
import { Loader2, Key, Eye, EyeOff, Copy, Check, Pen } from "lucide-react";

const MANIFESTO_CORE = `3D Politics: Exploring Governance for the 21st Century

EXECUTIVE SUMMARY

Today I start a series of publications which is designed to move the discourse from "diagnosis despair" to "architectural agency" by applying the 3D Politics framework (Decision-Making, Decentralization, Distribution). With this approach, I intend to publish around 10 key essays inspired by my professional practice over the past 20 years.

WHAT IS 3D POLITICS

3D Politics is a multidimensional governance framework designed to move civic discourse from "diagnosis despair"—the endless analysis of why current systems are failing—to "architectural agency"—the active design and implementation of new, functional structures. It posits that for any governance system to be resilient and legitimate in the age of AI and global complexity, it must balance three interconnected pillars: Decision-Making, Decentralization, and Distribution. Together, these pillars form a "virtuous cycle" where collective intelligence, distributed agency, and equitable ownership reinforce one another.

DECISION-MAKING: THE PILLAR OF LEGITIMACY

The first dimension focuses on how we arrive at collective choices. Traditional decision making processes are mostly inherited from the 19th or 20th Century and not up to the task to handle modern challenges. 3D Politics replaces these with a "modular grammar" of governance—the Decision Lego. By using tools like citizens' assemblies and scaling frameworks, we can harness collective intelligence at scale. This pillar emphasizes the "Politics of Presence," recognizing that trust is built through embodied, face-to-face deliberation, even as we use AI to aggregate recommendations and ensure that the voices of "silent stakeholders"—such as future generations and ecosystems—are represented in the room.

DECENTRALIZATION: THE PILLAR OF AGENCY

The second dimension addresses the balance of power. Decentralization is not merely a technical goal but a political, societal and economic win-win situation. In the 3D framework, decentralization ensures that agency is distributed across society. This extends from Decentralized Science, which breaks knowledge out of ivory towers, to web3 governance and the Energy Transition, where passive consumers become active "energy citizens". Decentralization is making the system anti-fragile.

DISTRIBUTION: THE PILLAR OF OWNERSHIP

The third dimension, Distribution, ensures that the value created by a society is shared in a fair way. Without equitable distribution, governance systems lose the trust of their participants. 3D Politics proposes structural interventions like SAWA (a capability-anchored currency) and the UBI Triad, which couples income with decentralized identity and deliberative power. A key concept here is Exit to Community (E2C), which facilitates the transition of private companies and automated infrastructure into community-led steward-ownership. By embedding equity at the point of value creation, the framework ensures that economic surplus funds the very democratic processes that govern it.

THE VIRTUOUS CYCLE

The ultimate goal of 3D Politics is a synthesis where these three dimensions operate as a single metabolism. Better Decision-Making leads to fairer Distribution, which increases the trust and resources available for the community. These resources enable further Decentralization, which in turn empowers more people to participate in Decision-Making. This synthesis is physically modeled in concepts like Syntropolis, a blueprint for an integrated 3D polity that acts as a living laboratory for a civilization that is technologically advanced, democratically scaled, and economically fair. 3D Politics is not a static utopia, but a living architectural log for reclaiming the future of governance.`;

const PRESET_STYLES = [
  {
    id: "satoshi",
    name: "Satoshi Nakamoto",
    era: "2008",
    descriptor: "Peer-to-peer · Cryptographic · Revolutionary",
    color: "from-orange-950 to-yellow-950",
    border: "border-orange-500",
    glow: "shadow-orange-500/20",
    textAccent: "text-orange-400",
    badge: "bg-orange-500/10 text-orange-400 border-orange-500/30",
    icon: "₿",
    systemPrompt: `You are Satoshi Nakamoto, the pseudonymous creator of Bitcoin, writing in the precise, methodical style of the Bitcoin whitepaper (2008). Transform this governance manifesto into your voice:

- Use the terse, engineering-manual prose of the whitepaper
- Frame governance problems as Byzantine fault-tolerance and consensus problems
- Replace political concepts with distributed systems metaphors: nodes, chains, proof-of-work, merkle trees, hash functions
- Structure arguments with numbered sections and sub-sections
- Introduce formal definitions before using concepts
- Reference game theory, cryptographic proofs, and incentive structures
- Be revolutionary but detached — let the technical elegance speak
- End with a quiet confidence that the system described is simply inevitable`,
  },
  {
    id: "montesquieu",
    name: "Montesquieu",
    era: "1748",
    descriptor: "Enlightenment · Separation of Powers · Classical",
    color: "from-amber-950 to-stone-950",
    border: "border-amber-400",
    glow: "shadow-amber-400/20",
    textAccent: "text-amber-300",
    badge: "bg-amber-500/10 text-amber-300 border-amber-500/30",
    icon: "⚖",
    systemPrompt: `You are Charles-Louis de Secondat, Baron de Montesquieu, author of "The Spirit of Laws" (1748). Transform this governance manifesto into your voice:

- Use elegant, measured Enlightenment prose with classical allusions
- Examine governance through the lens of climate, national character, and the nature of different peoples
- Apply your doctrine of the separation of powers to each dimension
- Draw comparisons between republics, monarchies, and despotisms of antiquity
- Reference Lycurgus, Solon, the Roman Republic, and English constitutional arrangements
- Be philosophical and analytical, never polemical
- Structure observations as general laws derived from particular cases`,
  },
  {
    id: "adorno",
    name: "Theodor Adorno",
    era: "1944–66",
    descriptor: "Critical Theory · Dialectical · Frankfurt School",
    color: "from-slate-950 to-zinc-950",
    border: "border-slate-400",
    glow: "shadow-slate-400/20",
    textAccent: "text-slate-300",
    badge: "bg-slate-500/10 text-slate-300 border-slate-500/30",
    icon: "◈",
    systemPrompt: `You are Theodor W. Adorno, Frankfurt School critical theorist and author of "Negative Dialectics" and "Dialectic of Enlightenment." Transform this governance manifesto into your voice:

- Use dense, deliberately difficult dialectical prose — resist easy synthesis
- Deploy negative dialectics: expose the contradictions within every affirmative claim
- Critique how the culture industry and administered society co-opt democratic language
- Question whether the framework's own categories reproduce the domination they oppose
- Use concepts like reification, instrumental reason, non-identity, the administered world
- Be suspicious of any system that presents itself as coherent and complete
- Refuse consoling conclusions — the strength of the analysis lies in naming the impasse`,
  },
  {
    id: "hugo",
    name: "Victor Hugo",
    era: "1862",
    descriptor: "Romantic · Lyrical · Social Justice",
    color: "from-red-950 to-rose-950",
    border: "border-red-500",
    glow: "shadow-red-500/20",
    textAccent: "text-red-400",
    badge: "bg-red-500/10 text-red-400 border-red-500/30",
    icon: "✦",
    systemPrompt: `You are Victor Hugo, author of "Les Misérables" and "Notre-Dame de Paris," writing at the height of your powers. Transform this governance manifesto into your voice:

- Use sweeping, lyrical, passionate prose — you are addressing all of humanity
- Employ dramatic contrasts: light and shadow, the people and the powerful, justice and tyranny
- Use rhetorical questions and exclamations freely
- Build to crescendos of moral conviction
- Invoke history, the French Revolution, the barricades, and the long march of progress
- Personify abstract forces: Liberty speaks, the People rise, the Future knocks
- Write as if each sentence must justify itself before the tribunal of conscience`,
  },
  {
    id: "arendt",
    name: "Hannah Arendt",
    era: "1958",
    descriptor: "Political Philosophy · Public Realm · Action",
    color: "from-blue-950 to-indigo-950",
    border: "border-blue-400",
    glow: "shadow-blue-400/20",
    textAccent: "text-blue-300",
    badge: "bg-blue-500/10 text-blue-300 border-blue-500/30",
    icon: "◉",
    systemPrompt: `You are Hannah Arendt, political philosopher and author of "The Human Condition" and "The Origins of Totalitarianism." Transform this governance manifesto into your voice:

- Use precise, careful, philosophically rigorous prose
- Draw on your key distinctions: labor/work/action; private/social/public realms; process/event
- Center the concept of plurality — that we are all different, and politics is what happens between us
- Invoke natality: the capacity of humans to begin something genuinely new
- Warn of the dangers when the political is dissolved into the social or economic
- Be historically grounded — reference the Greek polis, the American founding, council systems
- Express deep concern about the loss of the public realm and the rise of mass society`,
  },
  {
    id: "rousseau",
    name: "Jean-Jacques Rousseau",
    era: "1762",
    descriptor: "Social Contract · General Will · People's Sovereignty",
    color: "from-green-950 to-emerald-950",
    border: "border-green-500",
    glow: "shadow-green-500/20",
    textAccent: "text-green-400",
    badge: "bg-green-500/10 text-green-400 border-green-500/30",
    icon: "❧",
    systemPrompt: `You are Jean-Jacques Rousseau, philosopher and author of "The Social Contract" and "Discourse on the Origin of Inequality." Transform this governance manifesto into your voice:

- Write with direct, urgent, morally charged prose — you speak to and for the people
- Invoke the general will as the only legitimate basis of governance
- Condemn how civilization, property, and representation corrupt natural human goodness
- Insist that sovereignty is inalienable and cannot be delegated — the people must govern themselves
- Use "the people," "the citizen," and "the social pact" as central terms
- Be emotionally engaged and passionate — this is not an academic exercise but a moral urgency
- Attack all existing authorities and inherited corruptions with righteous indignation`,
  },
];

function buildCustomPrompt(author: string): string {
  return `You are ${author}. Rewrite the following political manifesto in your authentic voice — your actual writing style, characteristic sentence structures, key concepts, metaphors, rhetorical moves, and intellectual preoccupations as found in your real works. Draw on your genuine philosophical, literary, or political positions. Do not explain or frame what you are doing; simply write as yourself, as if you had authored this manifesto.`;
}

type Style = (typeof PRESET_STYLES)[0];
type CustomStyle = { id: "custom"; name: string; systemPrompt: string };
type AnyStyle = Style | CustomStyle;

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
    className={`relative text-left p-5 rounded-xl border transition-all duration-200 bg-gradient-to-br cursor-pointer ${style.color} ${
      selected
        ? `${style.border} shadow-lg ${style.glow} scale-[1.02]`
        : "border-white/10 hover:border-white/25 hover:scale-[1.01]"
    }`}
  >
    {selected && (
      <div
        className={`absolute top-3 right-3 w-2 h-2 rounded-full ${style.border.replace("border-", "bg-")}`}
      />
    )}
    <div className={`text-2xl mb-3 ${style.textAccent}`}>{style.icon}</div>
    <div
      className={`text-xs font-mono mb-1 px-2 py-0.5 rounded-full border inline-block ${style.badge}`}
    >
      {style.era}
    </div>
    <h3 className="text-white font-semibold mt-2 mb-1">{style.name}</h3>
    <p className="text-white/50 text-xs leading-relaxed">{style.descriptor}</p>
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
  onChange: (v: string) => void;
  onSelect: () => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (selected && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selected]);

  return (
    <div
      onClick={onSelect}
      className={`relative text-left p-5 rounded-xl border transition-all duration-200 cursor-pointer bg-gradient-to-br from-violet-950 to-purple-950 ${
        selected
          ? "border-violet-400 shadow-lg shadow-violet-400/20 scale-[1.02]"
          : "border-dashed border-white/20 hover:border-white/40 hover:scale-[1.01]"
      }`}
    >
      {selected && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-violet-400" />
      )}
      <div className="text-2xl mb-3 text-violet-400">
        <Pen className="w-6 h-6" />
      </div>
      <div className="text-xs font-mono mb-1 px-2 py-0.5 rounded-full border inline-block bg-violet-500/10 text-violet-300 border-violet-500/30">
        your choice
      </div>
      <h3 className="text-white font-semibold mt-2 mb-2">In the style of…</h3>
      <input
        ref={inputRef}
        type="text"
        placeholder="e.g. Simone de Beauvoir"
        value={value}
        onChange={(e) => {
          e.stopPropagation();
          onChange(e.target.value);
        }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-violet-400/60 transition-colors"
      />
      {!selected && !value && (
        <p className="text-white/40 text-xs mt-2">Any thinker, any era</p>
      )}
      {value && !selected && (
        <p className="text-violet-300 text-xs mt-2 truncate">{value}</p>
      )}
    </div>
  );
};

export default function App() {
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [customAuthor, setCustomAuthor] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [remixedText, setRemixedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const activePreset = PRESET_STYLES.find((s) => s.id === selectedStyle);

  const getActiveStyle = (): AnyStyle | null => {
    if (selectedStyle === "custom") {
      return {
        id: "custom",
        name: customAuthor.trim() || "Custom author",
        systemPrompt: buildCustomPrompt(customAuthor.trim()),
      };
    }
    return activePreset ?? null;
  };

  const handleRemix = async () => {
    const style = getActiveStyle();
    if (!style || !apiKey.trim()) return;
    if (style.id === "custom" && !customAuthor.trim()) return;

    setIsGenerating(true);
    setRemixedText("");
    setError(null);

    try {
      const client = new Anthropic({
        apiKey: apiKey.trim(),
        dangerouslyAllowBrowser: true,
      });

      const stream = await client.messages.stream({
        model: "claude-opus-4-7",
        max_tokens: 2500,
        system: style.systemPrompt,
        messages: [
          {
            role: "user",
            content: `Rewrite the following political manifesto in your authentic voice and style. Preserve the core ideas — the three pillars of governance (Decision-Making, Decentralization, Distribution) and the virtuous cycle — but transform everything else: the language, metaphors, structure, and framing. Make it feel like you genuinely authored it. Do not add a preamble or explanation — begin the text immediately.\n\n---\n\n${MANIFESTO_CORE}`,
          },
        ],
      });

      for await (const chunk of stream) {
        if (
          chunk.type === "content_block_delta" &&
          chunk.delta.type === "text_delta"
        ) {
          setRemixedText((prev) => prev + chunk.delta.text);
        }
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to generate remix";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(remixedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeStyle = getActiveStyle();
  const isCustomReady =
    selectedStyle === "custom" && customAuthor.trim().length > 0;
  const canGenerate =
    (selectedStyle && selectedStyle !== "custom"
      ? true
      : isCustomReady) &&
    apiKey.trim() &&
    !isGenerating;

  const outputAccent =
    selectedStyle === "custom"
      ? "text-violet-400"
      : activePreset?.textAccent ?? "text-white/70";

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      {/* Header */}
      <header className="border-b border-white/8 px-6 py-5">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              3D Politics{" "}
              <span className="text-white/40 font-normal">
                Manifesto Remixer
              </span>
            </h1>
            <p className="text-white/40 text-xs mt-0.5">
              Reimagine governance through history's greatest political minds
            </p>
          </div>
          {/* API Key */}
          <div className="flex items-center gap-2 shrink-0">
            <Key className="w-3.5 h-3.5 text-white/30" />
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                placeholder="Anthropic API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 w-52 pr-8"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
              >
                {showKey ? (
                  <EyeOff className="w-3 h-3" />
                ) : (
                  <Eye className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-block text-xs font-mono text-white/30 border border-white/10 rounded-full px-3 py-1 mb-4">
            6 voices + yours · 1 manifesto
          </div>
          <h2 className="text-4xl font-bold tracking-tight mb-3">
            What if they had written it?
          </h2>
          <p className="text-white/50 text-lg max-w-xl mx-auto leading-relaxed">
            Select a thinker — or name your own. Generate their version of the
            3D Politics manifesto.
          </p>
        </div>

        {/* Style Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-8">
          {PRESET_STYLES.map((style) => (
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

        {/* Generate Button */}
        <div className="flex justify-center mb-10">
          <button
            onClick={handleRemix}
            disabled={!canGenerate}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl font-medium text-sm transition-all duration-200 ${
              canGenerate
                ? "bg-white text-black hover:bg-white/90 shadow-lg shadow-white/10 hover:scale-[1.02] cursor-pointer"
                : "bg-white/10 text-white/30 cursor-not-allowed"
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Remixing manifesto…
              </>
            ) : activeStyle ? (
              <>
                <span className="text-base">
                  {selectedStyle === "custom" ? "✍" : (activePreset?.icon ?? "")}
                </span>
                Remix as {activeStyle.name}
              </>
            ) : (
              "Select a voice to remix"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Output */}
        {(remixedText || isGenerating) && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
              <div className="flex items-center gap-3">
                <span className={`text-lg ${outputAccent}`}>
                  {selectedStyle === "custom"
                    ? "✍"
                    : (activePreset?.icon ?? "")}
                </span>
                <div>
                  <div className="text-sm font-medium text-white">
                    {activeStyle?.name}
                  </div>
                  {activePreset && (
                    <div className="text-xs text-white/40">
                      {activePreset.descriptor}
                    </div>
                  )}
                  {selectedStyle === "custom" && (
                    <div className="text-xs text-white/40">custom voice</div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {isGenerating && (
                  <div className="flex items-center gap-1.5 text-white/40 text-xs">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    generating
                  </div>
                )}
                {remixedText && !isGenerating && (
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-white/40 hover:text-white text-xs px-3 py-1.5 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3 h-3 text-green-400" />
                        <span className="text-green-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
            <div className="px-8 py-8">
              <div className="prose prose-invert prose-sm max-w-none">
                {remixedText.split("\n").map((line, i) => {
                  if (!line.trim()) return <div key={i} className="h-4" />;
                  const isHeading =
                    line.match(/^[A-Z][A-Z\s:,–-]{4,}$/) ||
                    line.startsWith("# ") ||
                    line.startsWith("## ") ||
                    line.startsWith("### ");
                  const cleanLine = line.replace(/^#{1,3}\s+/, "");
                  if (isHeading) {
                    return (
                      <h3
                        key={i}
                        className={`text-sm font-bold tracking-widest uppercase mt-6 mb-2 ${outputAccent}`}
                      >
                        {cleanLine}
                      </h3>
                    );
                  }
                  return (
                    <p
                      key={i}
                      className="text-white/80 leading-relaxed text-sm mb-0"
                    >
                      {line}
                    </p>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Empty hint */}
        {!remixedText && !isGenerating && (
          <div className="text-center text-white/20 text-sm py-4">
            {!selectedStyle
              ? "Choose a voice above to begin"
              : selectedStyle === "custom" && !customAuthor.trim()
              ? "Type an author name in the card above"
              : !apiKey.trim()
              ? "Enter your Anthropic API key to generate"
              : "Hit Remix to generate"}
          </div>
        )}
      </main>

      <footer className="border-t border-white/8 px-6 py-5 mt-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-xs text-white/25">
          <span>3D Politics by Antoine Vergne</span>
          <span>Powered by Claude · claude-opus-4-7</span>
        </div>
      </footer>
    </div>
  );
}
