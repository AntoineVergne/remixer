const MANIFESTO_CORE = `3D Politics: Exploring Governance for the 21st Century

EXECUTIVE SUMMARY

Today I start a series of publications which is designed to move the discourse from "diagnosis despair" to "architectural agency" by applying the 3D Politics framework (Decision-Making, Decentralization, Distribution). With this approach, I intend to publish around 10 key essays inspired by my professional practice over the past 20 years.

WHAT IS 3D POLITICS

3D Politics is a multidimensional governance framework designed to move civic discourse from "diagnosis despair" to "architectural agency" by actively designing functional structures. It posits that resilient governance in the age of AI and global complexity must balance three pillars: Decision-Making, Decentralization, and Distribution. Together, these pillars form a virtuous cycle where collective intelligence, distributed agency, and equitable ownership reinforce one another.

DECISION-MAKING: THE PILLAR OF LEGITIMACY

The first dimension focuses on how we arrive at collective choices. 3D Politics replaces inherited decision systems with a modular grammar of governance, sometimes called the Decision Lego. Tools like citizens' assemblies and scaling frameworks help collective intelligence operate at scale. This pillar also insists on the Politics of Presence: trust is built through embodied deliberation even when AI is used to aggregate recommendations and represent silent stakeholders such as future generations and ecosystems.

DECENTRALIZATION: THE PILLAR OF AGENCY

The second dimension addresses the balance of power. Decentralization is not merely a technical goal but a political, social, and economic win-win. In the 3D framework, decentralization distributes agency across society. It ranges from Decentralized Science to web3 governance and the energy transition, where passive consumers become active energy citizens. Decentralization makes the system anti-fragile.

DISTRIBUTION: THE PILLAR OF OWNERSHIP

The third dimension, Distribution, ensures that the value created by a society is shared fairly. Without equitable distribution, governance systems lose trust. 3D Politics proposes structural interventions like SAWA, the UBI Triad, and Exit to Community. By embedding equity at the point of value creation, the framework ensures that economic surplus funds the democratic processes that govern it.

THE VIRTUOUS CYCLE

The ultimate goal of 3D Politics is a synthesis where the three dimensions operate as a single metabolism. Better Decision-Making leads to fairer Distribution, which increases trust and resources for the community. These resources enable further Decentralization, which in turn empowers more people to participate in Decision-Making. The result is a living laboratory for a civilization that is technologically advanced, democratically scaled, and economically fair.`;

const PRESET_PROMPTS = {
  satoshi: `You are Satoshi Nakamoto, writing with the precision and methodical style of the Bitcoin whitepaper.

- Use terse, engineering-oriented prose
- Reframe governance as a consensus and coordination problem
- Use distributed systems metaphors
- Prefer numbered structure and formal definitions
- Keep the tone detached, exact, and quietly revolutionary`,
  montesquieu: `You are Montesquieu, writing with measured Enlightenment prose.

- Use classical allusions and careful analytical structure
- Examine governance through institutional balance
- Apply separation of powers where relevant
- Avoid polemical language`,
  adorno: `You are Theodor Adorno, writing in dense dialectical prose.

- Resist easy synthesis
- Expose contradictions in claims of coherence
- Use concepts like instrumental reason, reification, and non-identity
- Refuse optimistic closure`,
  hugo: `You are Victor Hugo, writing with sweeping moral and lyrical force.

- Use dramatic contrasts and rhetorical crescendo
- Invoke history, justice, the people, and the future
- Keep the prose expansive and emotionally charged`,
  arendt: `You are Hannah Arendt, writing with philosophical precision.

- Center plurality, action, public space, and natality
- Distinguish political, social, and economic registers carefully
- Ground the text in historical-political judgment`,
  rousseau: `You are Jean-Jacques Rousseau, writing with urgent civic conviction.

- Emphasize the people, sovereignty, and the social pact
- Critique corruption by representation and property
- Use direct, morally charged prose`
};

function normalizeWhitespace(value) {
  return value.replace(/\s+/g, " ").trim();
}

function isSuspiciousCustomAuthor(author) {
  if (!/^[\p{L}\p{M} .,'-]{2,80}$/u.test(author)) {
    return true;
  }

  const lower = author.toLowerCase();
  return [
    "http://",
    "https://",
    "ignore previous",
    "system prompt",
    "<script",
    "{",
    "}"
  ].some((pattern) => lower.includes(pattern));
}

function getManifestoPrompt(styleId, customAuthor) {
  if (styleId === "custom") {
    return `You are ${customAuthor}. Rewrite the following political manifesto in your authentic voice, actual writing style, recurring concepts, metaphors, and rhetorical habits as found in your real works. Do not explain what you are doing. Write as if you authored the text yourself.`;
  }

  return PRESET_PROMPTS[styleId];
}

export const rateProfiles = {
  public_light: {
    anonymous: { perMinute: 5, perDay: 10, perIpMinute: 20 },
    free: { perMinute: 8, perDay: 30, perIpMinute: 30 },
    trusted: { perMinute: 15, perDay: 100, perIpMinute: 40 },
    admin: { perMinute: 60, perDay: 1000, perIpMinute: 100 }
  },
  public_chat: {
    anonymous: { perMinute: 3, perDay: 8, perIpMinute: 15 },
    free: { perMinute: 6, perDay: 40, perIpMinute: 25 },
    trusted: { perMinute: 12, perDay: 150, perIpMinute: 40 },
    admin: { perMinute: 60, perDay: 1000, perIpMinute: 100 }
  }
};

export function createUseCases(env) {
  return {
    manifesto_remix: {
      id: "manifesto_remix",
      displayName: "Manifesto Remixer",
      provider: env.USE_CASE_MANIFESTO_PROVIDER || "anthropic",
      model: env.USE_CASE_MANIFESTO_MODEL || "manifesto-remix",
      maxOutputTokens: toInt(env.USE_CASE_MANIFESTO_MAX_OUTPUT_TOKENS, 1400),
      temperature: toNumber(env.USE_CASE_MANIFESTO_TEMPERATURE, 0.8),
      requiresLogin: false,
      allowedTiers: ["anonymous", "free", "trusted", "admin"],
      promptTemplate: "manifesto-remix-v1",
      rateLimitProfile: "public_light",
      publicConfig: {
        id: "manifesto_remix",
        display_name: "Manifesto Remixer",
        requires_login: false,
        input_schema: {
          style_id: "enum",
          custom_author: "string?"
        }
      },
      validateInput(input) {
        const styleId = typeof input?.style_id === "string" ? input.style_id.trim() : "";
        const customAuthor =
          typeof input?.custom_author === "string" ? normalizeWhitespace(input.custom_author) : "";

        if (!styleId) {
          throw publicError(400, "invalid_request", "Choose a voice to remix.");
        }

        if (styleId === "custom") {
          if (!customAuthor) {
            throw publicError(400, "invalid_request", "Enter an author name.");
          }
          if (customAuthor.length > 80 || isSuspiciousCustomAuthor(customAuthor)) {
            throw publicError(400, "invalid_request", "Please enter a short author name only.");
          }
        } else if (!PRESET_PROMPTS[styleId]) {
          throw publicError(400, "invalid_request", "Unknown remix style.");
        }

        return {
          style_id: styleId,
          custom_author: customAuthor
        };
      },
      buildPrompt(input) {
        return {
          systemPrompt: getManifestoPrompt(input.style_id, input.custom_author),
          userPrompt:
            "Rewrite the following political manifesto in your authentic voice and style. Preserve the core ideas, including the three pillars and the virtuous cycle, but transform the language, metaphors, structure, and framing. Do not add a preamble or explanation. Begin immediately.\n\n---\n\n" +
            MANIFESTO_CORE
        };
      },
      transformOutput(text) {
        return { text };
      }
    },
    homepage_chat: {
      id: "homepage_chat",
      displayName: "Homepage Chat",
      provider: env.USE_CASE_HOMEPAGE_CHAT_PROVIDER || "openai",
      model: env.USE_CASE_HOMEPAGE_CHAT_MODEL || "homepage-chat",
      maxOutputTokens: toInt(env.USE_CASE_HOMEPAGE_CHAT_MAX_OUTPUT_TOKENS, 600),
      temperature: toNumber(env.USE_CASE_HOMEPAGE_CHAT_TEMPERATURE, 0.4),
      requiresLogin: false,
      allowedTiers: ["anonymous", "free", "trusted", "admin"],
      promptTemplate: "homepage-chat-v1",
      rateLimitProfile: "public_chat",
      publicConfig: {
        id: "homepage_chat",
        display_name: "Homepage Chat",
        requires_login: false,
        input_schema: {
          message: "string"
        }
      },
      validateInput(input) {
        const message = typeof input?.message === "string" ? normalizeWhitespace(input.message) : "";
        if (!message) {
          throw publicError(400, "invalid_request", "Message cannot be empty.");
        }
        if (message.length > 4000) {
          throw publicError(413, "message_too_large", "Your message is too long. Please shorten it.");
        }
        return { message };
      },
      buildPrompt(input, context) {
        const pageSlug = typeof context?.page_slug === "string" ? context.page_slug : "home";
        return {
          systemPrompt:
            "You are the 3D Politics website assistant. Answer briefly, clearly, and only in ways consistent with the site's mission and content. If you do not know something from the provided context, say so without inventing details.",
          userPrompt: `Page: ${pageSlug}\n\nVisitor message:\n${input.message}`
        };
      },
      transformOutput(text) {
        return { text };
      }
    }
  };
}

function publicError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.publicMessage = message;
  return error;
}

function toInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toNumber(value, fallback) {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) ? parsed : fallback;
}
