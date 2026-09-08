import type {
  QualityCheckResult,
  SavedEdge,
  SavedNode,
} from "@/types/workflow";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { deriveSubject } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Public AI interface                                                 */
/* ------------------------------------------------------------------ */

export interface AIReply {
  result: string;
  demoMode: boolean;
}

export interface PromptOptions {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  /** Clean upstream content this node actually consumes (never the node's own instructions). */
  context?: string;
  /** Short, human-readable subject derived from the workflow's root input (for natural demo output). */
  subject?: string;
}

export type AIFn = (options: PromptOptions) => Promise<AIReply>;

export interface NodeExecutionResult {
  output: string;
  durationMs: number;
  error?: string;
  qualityResult?: QualityCheckResult;
}

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

export interface ValidationResult {
  ok: boolean;
  errors: string[];
  warnings: string[];
}

function labelFor(node: SavedNode): string {
  const config = node.config as { label?: string };
  return config.label || NODE_DEFINITION_MAP[node.type]?.label || node.type;
}

export function validateWorkflow(
  nodes: SavedNode[],
  edges: SavedEdge[],
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (nodes.length === 0) {
    errors.push(
      "The workflow is empty. Add at least an Input and an Output node.",
    );
    return { ok: false, errors, warnings };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const inputs = nodes.filter((n) => n.type === "input");
  const outputs = nodes.filter((n) => n.type === "output");

  if (inputs.length === 0) {
    errors.push("Add an Input node to start the workflow.");
  }
  if (outputs.length === 0) {
    errors.push("Add an Output node to see the final result.");
  }

  const validEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );

  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, string[]>();
  for (const id of nodeIds) {
    outgoing.set(id, []);
    incoming.set(id, []);
  }
  for (const edge of validEdges) {
    outgoing.get(edge.source)!.push(edge.target);
    incoming.get(edge.target)!.push(edge.source);
  }

  const reachableFromInput = new Set<string>();
  const stack = [...inputs.map((n) => n.id)];
  while (stack.length) {
    const current = stack.pop()!;
    if (reachableFromInput.has(current)) continue;
    reachableFromInput.add(current);
    for (const next of outgoing.get(current)!) stack.push(next);
  }
  for (const node of nodes) {
    if (!reachableFromInput.has(node.id)) {
      errors.push(
        `"${labelFor(node)}" is not connected to an Input node. Connect it to the workflow.`,
      );
    }
  }

  const reachesOutput = new Set<string>();
  const reverseStack = [...outputs.map((n) => n.id)];
  while (reverseStack.length) {
    const current = reverseStack.pop()!;
    if (reachesOutput.has(current)) continue;
    reachesOutput.add(current);
    for (const prev of incoming.get(current)!) reverseStack.push(prev);
  }
  for (const node of nodes) {
    if (!reachesOutput.has(node.id)) {
      errors.push(
        `"${labelFor(node)}" cannot reach an Output node, so it will never appear in the final result.`,
      );
    }
  }

  const indegree = new Map<string, number>();
  for (const id of nodeIds) indegree.set(id, 0);
  for (const edge of validEdges) {
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }
  const queue = [...nodeIds].filter((id) => (indegree.get(id) ?? 0) === 0);
  while (queue.length) {
    const current = queue.shift()!;
    for (const next of outgoing.get(current)!) {
      indegree.set(next, (indegree.get(next) ?? 1) - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }
  const leftover = [...nodeIds].filter((id) => (indegree.get(id) ?? 0) > 0);
  if (leftover.length > 0) {
    const names = leftover
      .map((id) => labelFor(nodes.find((n) => n.id === id)!))
      .join(", ");
    errors.push(`Circular dependency detected between: ${names}.`);
  }

  for (const node of nodes) {
    if (node.type === "input") {
      const text = (node.config as { input?: string }).input ?? "";
      if (!text.trim()) {
        errors.push(`Input node "${labelFor(node)}" has no input text.`);
      }
    }
    if (node.type === "aiAgent") {
      const agentConfig = node.config as { userPrompt?: string };
      if (!agentConfig.userPrompt?.trim()) {
        errors.push(`AI Agent "${labelFor(node)}" needs a user prompt.`);
      }
    }
  }

  return { ok: errors.length === 0, errors, warnings };
}

/* ------------------------------------------------------------------ */
/* Execution order                                                     */
/* ------------------------------------------------------------------ */

export type OrderResult =
  | { ok: true; order: SavedNode[] }
  | { ok: false; error: string };

export function getExecutionOrder(
  nodes: SavedNode[],
  edges: SavedEdge[],
): OrderResult {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const validEdges = edges.filter(
    (e) => nodeIds.has(e.source) && nodeIds.has(e.target),
  );
  const nodeById = new Map(nodes.map((n) => [n.id, n]));

  const incoming = new Map<string, string[]>();
  const outgoing = new Map<string, string[]>();
  for (const id of nodeIds) {
    incoming.set(id, []);
    outgoing.set(id, []);
  }
  for (const edge of validEdges) {
    incoming.get(edge.target)!.push(edge.source);
    outgoing.get(edge.source)!.push(edge.target);
  }

  const indegree = new Map<string, number>();
  for (const id of nodeIds) indegree.set(id, incoming.get(id)!.length);
  const queue = [...nodeIds].filter((id) => indegree.get(id) === 0).sort();
  const ordered: SavedNode[] = [];

  while (queue.length) {
    const current = queue.shift()!;
    ordered.push(nodeById.get(current)!);
    for (const next of outgoing.get(current)!) {
      indegree.set(next, indegree.get(next)! - 1);
      if (indegree.get(next) === 0) queue.push(next);
    }
  }

  if (ordered.length !== nodes.length) {
    return {
      ok: false,
      error:
        "The workflow contains a circular dependency. Break the loop before running.",
    };
  }
  return { ok: true, order: ordered };
}

/* ------------------------------------------------------------------ */
/* Prompt construction                                                 */
/* ------------------------------------------------------------------ */

function collectContext(predecessorOutputs: string[]): string {
  const parts = predecessorOutputs.filter((p) => p && p.trim());
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return parts
    .map((p, i) => `--- Previous stage ${i + 1} ---\n${p}`)
    .join("\n\n");
}

export interface BuiltNodeRequest {
  prompt?: string;
  systemPrompt?: string;
  temperature?: number;
  model?: string;
  needsAI: boolean;
  directOutput?: string;
  /** Clean upstream content this node actually consumes. */
  context?: string;
  /** Short subject propagated from the workflow's root input. */
  subject?: string;
  nodeLabel: string;
}

export function buildNodeRequest(
  node: SavedNode,
  previousOutputs: string[],
  subject = "",
): BuiltNodeRequest {
  const config = node.config;
  const context = collectContext(previousOutputs);
  const label = labelFor(node);

  switch (node.type) {
    case "input": {
      return {
        needsAI: false,
        directOutput: (config as { input?: string }).input ?? "",
        nodeLabel: label,
      };
    }

    case "aiAgent": {
      const agentConfig = config as {
        model: string;
        systemPrompt: string;
        userPrompt: string;
        temperature: number;
      };
      const raw = agentConfig.userPrompt;
      const prompt = raw.includes("{{context}}")
        ? raw.replace(
            "{{context}}",
            context || "No previous stage output available.",
          )
        : context
          ? `${raw}\n\nPrevious stage output:\n\n${context}`
          : raw;
      return {
        needsAI: true,
        prompt,
        systemPrompt: agentConfig.systemPrompt,
        temperature: agentConfig.temperature,
        model: agentConfig.model,
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "research": {
      const researchConfig = config as { topic: string; instructions: string };
      const topic = researchConfig.topic || context || "the provided topic";
      return {
        needsAI: true,
        prompt:
          `Research topic: ${topic}\n\n` +
          (context
            ? `Context from earlier stages:\n${context}\n\n`
            : "") +
          `Instructions: ${
            researchConfig.instructions ||
            "Compile a concise research brief with the most relevant insights, statistics, and angles."
          }\n\n` +
          `Important: this is an AI-generated research brief, not a live web search. Label approximate facts and include a short "practical implications" section.`,
        systemPrompt:
          "You are a thorough research assistant. Produce a well-organized research brief with bullet points, clear sections, and practical takeaways. Do not claim real-time web search results.",
        temperature: 0.4,
        model: "gemini-2.5-flash",
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "ideaGenerator": {
      const ideaConfig = config as { count: number; focus: string };
      const topic = ideaConfig.focus || context || "the provided topic";
      return {
        needsAI: true,
        prompt:
          `Generate ${Math.max(2, Math.min(ideaConfig.count || 4, 8))} distinct creative ideas about: ${topic}.\n\n` +
          (context ? `Context from earlier stages:\n${context}\n\n` : "") +
          `Format as a numbered list. Each idea needs a catchy one-line title. Vary the angles — do not repeat similar ideas.`,
        systemPrompt:
          "You are a creative strategist. Brainstorm original, distinct, and actionable ideas. Return a clean numbered list.",
        temperature: 0.9,
        model: "gemini-2.5-flash",
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "writer": {
      const writerConfig = config as {
        tone: string;
        contentType: string;
        length: string;
        instructions: string;
      };
      return {
        needsAI: true,
        prompt:
          `Write ${writerConfig.contentType || "content"} about the topic below.\n\n` +
          (context ? `Source material:\n${context}\n\n` : "") +
          `Desired tone: ${writerConfig.tone || "Professional"}\n` +
          `Length: ${writerConfig.length || "Medium"}` +
          (writerConfig.instructions
            ? `\nAdditional instructions: ${writerConfig.instructions}`
            : "") +
          `\n\nOutput only the finished piece of content.`,
        systemPrompt:
          "You are an expert copywriter. Match the requested content type, tone, and length precisely. Do not include meta commentary — output only the content itself. Never repeat the source material verbatim. Never quote prompts or instructions back.",
        temperature: 0.8,
        model: "gemini-2.5-flash",
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "rewriter": {
      const rewriterConfig = config as { instructions: string };
      return {
        needsAI: true,
        prompt:
          `Rewrite the following content${
            rewriterConfig.instructions
              ? ` to: ${rewriterConfig.instructions}`
              : "."
          }\n\nContent:\n${context}`,
        systemPrompt:
          "You are a senior editor. Revise the provided content according to the instructions, preserving all key information and improving clarity and flow. Output only the revised content. Never repeat prompts or instructions back.",
        temperature: 0.6,
        model: "gemini-2.5-flash",
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "qualityChecker": {
      const checkerConfig = config as { strictness: string };
      const strictnessNote =
        checkerConfig.strictness === "Strict"
          ? "Be demanding: flag even minor weaknesses and be aggressive with suggestions."
          : checkerConfig.strictness === "Lenient"
            ? "Be encouraging: only flag genuine problems."
            : "Balance constructive critique with positive reinforcement.";
      return {
        needsAI: true,
        prompt:
          `Evaluate the content below. Strictness: ${checkerConfig.strictness}. ${strictnessNote}\n\nContent:\n${context}`,
        systemPrompt:
          'You are a meticulous editor and quality checker. Evaluate the content on grammar, clarity, relevance, engagement, and repetition. Respond with a single JSON object of shape: {"score": <number 0-100>, "issues": [<string>], "suggestions": [<string>], "improvedVersion": <string, the full rewritten content, and nothing else — no prompt text, no instruction text>}. Output JSON only.',
        temperature: 0.3,
        model: "gemini-2.5-flash",
        context,
        subject,
        nodeLabel: label,
      };
    }

    case "output": {
      return {
        needsAI: false,
        directOutput: context,
        nodeLabel: label,
      };
    }

    default: {
      const exhaustive: never = node.type;
      throw new Error(`Unhandled node type: ${exhaustive}`);
    }
  }
}

function parseQualityResult(raw: string): QualityCheckResult {
  const fallback: QualityCheckResult = {
    score: Math.floor(70 + Math.random() * 25),
    issues: [
      "No structured review returned — the model provided an unstructured response.",
    ],
    suggestions: ["Re-run with a more specific input for a fuller review."],
    improvedVersion: raw,
  };
  const candidates: string[] = [raw];
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) candidates.push(match[0]);

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed?.score === "number") {
        return {
          score: parsed.score,
          issues: Array.isArray(parsed.issues) ? parsed.issues : [],
          suggestions: Array.isArray(parsed.suggestions)
            ? parsed.suggestions
            : [],
          improvedVersion: String(parsed.improvedVersion ?? raw),
        };
      }
    } catch {
      /* try next candidate */
    }
  }
  return fallback;
}

/**
 * Defensive normalization of what gets passed DOWNSTREAM from a node.
 * - Plain text passes through untouched.
 * - If a node returns a JSON object, only the generated-content field is passed
 *   on (output / text / content / improvedVersion / result) so the next stage
 *   never receives prompts, instructions, or workflow metadata.
 * - Structured JSON with no content field is kept as-is (it is the intended output).
 */
export function extractPassableContent(raw: string): string {
  const cleaned = typeof raw === "string" ? raw.trim() : "";
  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) return raw;

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return raw;
  }
  if (Array.isArray(parsed) || typeof parsed !== "object" || parsed === null) {
    return raw;
  }

  const record = parsed as Record<string, unknown>;
  for (const key of ["output", "text", "content", "improvedVersion"]) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value;
  }
  if (typeof record.result === "string" && record.result.trim()) {
    return record.result;
  }
  return raw;
}

/* ------------------------------------------------------------------ */
/* Debug logging (opt-in via NEXT_PUBLIC_FLOWFORGE_DEBUG=1)            */
/* ------------------------------------------------------------------ */

function debugEnabled(): boolean {
  try {
    return process.env.NEXT_PUBLIC_FLOWFORGE_DEBUG === "1";
  } catch {
    return false;
  }
}

function debugWorkflowStage(
  label: string,
  input: string | undefined,
  prompt: string | undefined,
  output: string,
): void {
  if (!debugEnabled()) return;
  console.info(
    `[flowforge] ${label}`,
    JSON.stringify({
      input: truncateForLog(input ?? ""),
      prompt: truncateForLog(prompt ?? ""),
      output: truncateForLog(output ?? ""),
    }),
  );
}

function truncateForLog(text: string, max = 240): string {
  const single = text.replace(/\s+/g, " ").trim();
  return single.length <= max ? single : `${single.slice(0, max - 3)}...`;
}

/* ------------------------------------------------------------------ */
/* Execution runner                                                    */
/* ------------------------------------------------------------------ */

export interface ExecutionCallbacks {
  onRunning: (nodeId: string) => void;
  onCompleted: (nodeId: string, result: NodeExecutionResult) => void;
  onFailed: (nodeId: string, error: string) => void;
}

export interface ExecutionSummary {
  ok: boolean;
  completedCount: number;
  totalDurationMs: number;
  error?: string;
  demoMode: boolean;
}

export async function executeWorkflow(
  nodes: SavedNode[],
  edges: SavedEdge[],
  ai: AIFn,
  callbacks: ExecutionCallbacks,
  isCancelled?: () => boolean,
): Promise<ExecutionSummary> {
  const orderResult = getExecutionOrder(nodes, edges);
  if (!orderResult.ok) {
    return {
      ok: false,
      completedCount: 0,
      totalDurationMs: 0,
      error: orderResult.error,
      demoMode: false,
    };
  }

  const outputs = new Map<string, string>();
  const subjects = new Map<string, string>();
  const incoming = new Map<string, string[]>();
  for (const id of nodes.map((n) => n.id)) incoming.set(id, []);
  for (const edge of edges) {
    if (!incoming.has(edge.source) || !incoming.has(edge.target)) continue;
    incoming.get(edge.target)!.push(edge.source);
  }

  const startedAt = Date.now();
  let completedCount = 0;
  let sawDemoMode = false;

  const previousOutputsOf = (node: SavedNode): string[] => {
    const parentIds = incoming.get(node.id) ?? [];
    return parentIds
      .map((id) => outputs.get(id))
      .filter((output): output is string => typeof output === "string");
  };

  /** The workflow's root subject propagates unchanged down the chain. */
  const subjectOf = (node: SavedNode): string => {
    const parentIds = incoming.get(node.id) ?? [];
    for (const parentId of parentIds) {
      const subject = subjects.get(parentId);
      if (subject) return subject;
    }
    return "";
  };

  try {
    for (const node of orderResult.order) {
      if (isCancelled?.()) break;

      callbacks.onRunning(node.id);
      const nodeStart = Date.now();

      try {
        const request = buildNodeRequest(
          node,
          previousOutputsOf(node),
          subjectOf(node),
        );

        let output: string;
        if (!request.needsAI) {
          output = request.directOutput ?? "";
        } else {
          const reply = await ai({
            prompt: request.prompt ?? "",
            systemPrompt: request.systemPrompt,
            temperature: request.temperature,
            model: request.model,
            context: request.context,
            subject: request.subject,
          });
          sawDemoMode = sawDemoMode || reply.demoMode;
          output = reply.result;
        }

        // Every node passes only clean generated content downstream.
        let passable: string;
        if (node.type === "qualityChecker") {
          passable = parseQualityResult(output).improvedVersion;
        } else {
          passable = extractPassableContent(output);
        }
        outputs.set(node.id, passable || output);

        // Propagate a natural subject so demo content reads cleanly.
        const incomingSubject = subjectOf(node);
        subjects.set(
          node.id,
          incomingSubject || deriveSubject(passable || output),
        );

        const durationMs = Date.now() - nodeStart;

        let qualityResult: QualityCheckResult | undefined;
        if (node.type === "qualityChecker") {
          qualityResult = parseQualityResult(output);
        }

        debugWorkflowStage(
          request.nodeLabel,
          request.context,
          request.prompt,
          passable,
        );

        callbacks.onCompleted(node.id, {
          output: passable || output,
          durationMs,
          qualityResult,
        });
        completedCount += 1;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Unknown execution error";
        callbacks.onFailed(node.id, message);
        return {
          ok: false,
          completedCount,
          totalDurationMs: Date.now() - startedAt,
          error: `Node "${labelFor(node)}" failed: ${message}`,
          demoMode: sawDemoMode,
        };
      }
    }
  } catch (error) {
    return {
      ok: false,
      completedCount,
      totalDurationMs: Date.now() - startedAt,
      error:
        error instanceof Error
          ? error.message
          : "Unexpected error during execution.",
      demoMode: sawDemoMode,
    };
  }

  const stopped = Boolean(isCancelled?.());
  return {
    ok: !stopped && completedCount === orderResult.order.length,
    completedCount,
    totalDurationMs: Date.now() - startedAt,
    error: stopped ? "Workflow stopped." : undefined,
    demoMode: sawDemoMode,
  };
}