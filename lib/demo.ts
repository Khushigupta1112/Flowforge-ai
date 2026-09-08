/**
 * Deterministic-ish mock responses used when no Gemini API key is present.
 * These exist so the entire product can be exercised without network or keys.
 *
 * CONTRACT: the mock generators receive only CLEAN content — either the actual
 * upstream stage output (`context`) or a short derived `subject`. They never
 * see (or echo) the instruction prompt that was sent to the model, so no
 * prompts, node instructions, or system prompts can leak into generated content.
 */

import { deriveSubject } from "@/lib/utils";

const VARIATION_A = Math.floor(Math.random() * 2);

/**
 * Reduce clean content to a quotable subject for natural demo copy.
 * Falls back to a stable, neutral phrase so an empty input still produces
 * clean (never echo-filled) content.
 */
function subjectOf(content: string | undefined, subject?: string): string {
  if (subject && subject.trim() && subject.trim() !== "this topic") {
    return subject.trim();
  }
  return deriveSubject(content ?? "") || "this topic";
}

export function mockResearch(content: string, subject?: string): string {
  const topic = subjectOf(content, subject);
  return [
    `AI RESEARCH BRIEF — "${topic}"`,
    ``,
    `Key findings (AI-simulated):`,
    `• Adoption is accelerating: organizations integrating AI into "${topic}" report measurable efficiency gains within the first two quarters.`,
    `• The biggest lever is augmentation, not replacement — practitioners see the best results when models handle the repetitive middle of the work while humans own judgment and direction.`,
    `• Early movers differentiate on workflow design: connecting research → ideation → drafting → review in a single pipeline cuts turnaround time dramatically.`,
    `• Watch-outs: context quality gatekeeps output quality; a clear input brief outperforms prompt tweaking at inference time.`,
    ``,
    `Practical implication: keep inputs explicit, structure the pipeline into atomic steps, and add an explicit review gate before publishing.`,
  ].join("\n");
}

export function mockIdeas(content: string, count: number, subject?: string): string {
  const seeds = [
    "Impact-first framing that leads with a human story",
    "The contrarian take: flip the common assumption on its head",
    "A data-backed listicle built around three concrete numbers",
    "A practical how-to angle with a step-by-step breakdown",
    "A prediction angle: where this is headed in 12 months",
    "A myth-busting angle that clears up common confusion",
    "An interview-style digest with voices from the field",
    "A beginner's on-ramp that assumes zero prior context",
  ];
  const topic = subjectOf(content, subject);
  const chosen = [...seeds].slice(0, Math.max(2, Math.min(count || 4, 8)));
  return chosen
    .map((seed, index) => `${index + 1}. ${seed} — for "${topic}"`)
    .join("\n");
}

function mockWriterCore(contentType: string, tone: string, topic: string): string {
  const hooks: Record<string, string> = {
    "LinkedIn post": `I spent the last month watching "${topic}" quietly change how teams work — and the shift is bigger than most people realize.`,
    "Blog post": `Everyone is talking about ${topic}, but almost nobody is asking the question that actually matters.`,
    "Product description": `Meet the tool that turns "${topic}" from a workflow into a competitive advantage.`,
    "YouTube script": `[HOOK] Most people are only using about 20% of what "${topic}" can actually do. Today, we fix that. [CUT TO INTRO] Let's talk about ${topic}.`,
  };
  const hook = hooks[contentType] ?? `Here is what you need to know about ${topic}.`;

  const bodies: Record<string, string> = {
    Short:
      "The pattern is simple: clear input, structured steps, and a review gate before anything ships. Teams that adopt it see faster turnarounds and more consistent output. The real unlock isn't the model — it's the workflow around it.",
    Medium:
      "The pattern is simple: clear input, structured steps, and a review gate before anything ships. Teams that adopt it see faster turnarounds and more consistent output. The real unlock isn't the model — it's the workflow around it.\n\nYou don't need perfect prompts. You need a repeatable pipeline. Each stage should do one thing well: research gathers context, ideation finds the angle, drafting turns it into words, and a checker catches what the writer missed. That division of labor is what makes AI work feel like a product instead of a party trick.",
    Long:
      "The pattern is simple: clear input, structured steps, and a review gate before anything ships. Teams that adopt it see faster turnarounds and more consistent output. The real unlock isn't the model — it's the workflow around it.\n\nYou don't need perfect prompts. You need a repeatable pipeline. Each stage should do one thing well: research gathers context, ideation finds the angle, drafting turns it into words, and a checker catches what the writer missed. That division of labor is what makes AI work feel like a product instead of a party trick.\n\nStart with a strong input brief — the single highest-leverage change you can make. Then let each node refine one step. Route the small stuff automatically, keep the interesting decisions human, and close the loop with a quality gate. By the time you ship, you're not hoping for good output; you've engineered for it.",
  };

  const toneFlavors: Record<string, string> = {
    Professional:
      "The bottom line: businesses that treat AI as a product to be engineered — not a prompt to be guessed at — are the ones compounding gains quarter over quarter.",
    Enthusiastic:
      "This is genuinely the most exciting shift in years, and the tools are finally here to make it practical for everyone.",
    Authoritative:
      "The verdict is clear: teams that adopt structured AI workflows will outpace everyone who is still treating this as a novelty.",
    Witty:
      "Somewhere, a sales deck just got 40% more convincing. And honestly? It earned it.",
    Empathetic:
      "The good news? You don't need to be an engineer to get real value from this today.",
    Minimalist:
      "Clear input. Structured steps. One review gate. That's the whole playbook.",
  };

  const body = bodies[lengthKey(contentType)] ?? bodies.Medium;
  const flavor =
    toneFlavors[tone] ?? "The pattern is simple, the payoff is compounding, and the time to start is now.";

  return `${hook}\n\n${body}\n\n${flavor}`;
}

function lengthKey(contentType: string): "Short" | "Medium" | "Long" {
  if (contentType === "Blog post" || contentType === "YouTube script") return "Long";
  return "Medium";
}

export function mockWrite(
  contentType: string,
  tone: string,
  length: string,
  content: string,
  subject?: string,
): string {
  void length;
  return mockWriterCore(contentType, tone, subjectOf(content, subject));
}

export function mockRewrite(
  content: string,
  instructions: string,
  subject?: string,
): string {
  const topic = subjectOf(content, subject);
  return `REVISED VERSION\n\n${mockWriterCore("YouTube script", "Professional", topic).slice(
    0,
    620,
  )}\n\n(Applied: ${instructions || "tighter, more direct copy."})`;
}

export function mockQualityCheck(
  content: string,
  subject?: string,
): string {
  const topic = subjectOf(content, subject);
  const score = VARIATION_A === 0 ? 87 : 91;
  return JSON.stringify({
    score,
    issues: VARIATION_A === 0
      ? [
          "The middle paragraph is slightly dense — consider splitting into two shorter sentences.",
          "A few phrases are generic; replacing them with specifics strengthens the point.",
        ]
      : [
          "The opening hook could be more specific to stand out in the feed.",
          "One paragraph repeats an earlier idea in slightly different words.",
        ],
    suggestions: VARIATION_A === 0
      ? [
          "Lead with a concrete number or result in the first sentence.",
          "Split the longest paragraph into two for easier scanning.",
          "End with a specific call to action rather than a general takeaway.",
        ]
      : [
          "Add a concrete example to the opening hook.",
          "Cut the repeated idea to keep the post under 150 words.",
          "Write a pointed final line in the second person.",
        ],
    improvedVersion:
      `${mockWriterCore("YouTube script", "Enthusiastic", topic)}\n\nWhat would you add? Share it in the comments.`,
  });
}

export function mockAgentReply(
  systemPrompt: string,
  prompt: string,
  context?: string,
  subject?: string,
): string {
  void systemPrompt;
  void prompt;
  const topic = subjectOf(context, subject);
  return mockWriterCore("Auto-detect", "Professional", topic);
}

/**
 * Route a mock response for a node based on the node type, detected from the
 * node's SYSTEM prompt (its stable identity), with a keyword fallback for
 * custom aiAgent nodes. Content is generated ONLY from clean `context`/`subject`;
 * the user prompt is used purely for classification — never for content and
 * never echoed back.
 */
export function mockResultForPrompt(
  prompt: string,
  systemPrompt = "",
  context?: string,
  subject?: string,
): string {
  const cleanContext = context?.trim() ? context : undefined;
  const sys = (systemPrompt ?? "").toLowerCase();
  const user = (prompt ?? "").toLowerCase();

  // Built-in node types are identified by their system prompt so the mock
  // can never be derailed by words in the upstream content.
  if (sys.includes("quality checker") || sys.includes("meticulous editor")) {
    return mockQualityCheck(cleanContext ?? "", subject);
  }
  if (sys.includes("senior editor")) {
    return mockRewrite(cleanContext ?? "", "tighten and clarify", subject);
  }
  if (sys.includes("research assistant")) {
    return mockResearch(cleanContext ?? "", subject);
  }
  if (sys.includes("creative strategist")) {
    return mockIdeas(cleanContext ?? "", 4, subject);
  }
  if (sys.includes("expert copywriter")) {
    return mockWrite("Auto-detect", "Professional", "Medium", cleanContext ?? "", subject);
  }

  // Custom aiAgent nodes (or any node with an unexpected system prompt):
  // classify loosely from user text, still generating from clean content only.
  const combined = `${sys}\n${user}`;
  if (/quality|score|grammar|issues|suggestions/i.test(combined)) {
    return mockQualityCheck(cleanContext ?? "", subject);
  }
  if (/idea|brainstorm|angle|hook|concept/i.test(combined)) {
    return mockIdeas(cleanContext ?? "", 4, subject);
  }
  if (/research|brief|summary|facts|findings/i.test(combined)) {
    return mockResearch(cleanContext ?? "", subject);
  }
  if (/revise|rewrite|improve|tighten|condense|rephrase/i.test(combined)) {
    return mockRewrite(cleanContext ?? "", "tighten and clarify", subject);
  }
  if (/script|linkedin|blog|post|write|draft|email|description|copy/i.test(combined)) {
    return mockWrite("Auto-detect", "Professional", "Medium", cleanContext ?? "", subject);
  }
  return mockAgentReply(systemPrompt, prompt, cleanContext, subject);
}