import type { AIReply, PromptOptions } from "@/lib/workflow-engine";
import type {
  ElementModel,
  GeneratedWorkflow,
  WorkflowNodeConfig,
  WorkflowNodeType,
} from "@/types/workflow";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { buildFromElementModels, layoutVertically } from "@/lib/templates";

/** Call the server-side /api/ai endpoint. */
export async function callAI(options: PromptOptions): Promise<AIReply> {
  const response = await fetch("/api/ai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(options),
  });
  if (!response.ok) {
    throw new Error(`AI request failed (${response.status}).`);
  }
  return (await response.json()) as AIReply;
}

export function nodeDefinition(type: WorkflowNodeType) {
  return NODE_DEFINITION_MAP[type];
}

/* ------------------------------------------------------------------ */
/* AI workflow generation                                              */
/* ------------------------------------------------------------------ */

/** Ask the server to generate a workflow from a natural-language description. */
export async function generateWorkflowWithAI(
  description: string,
): Promise<GeneratedWorkflow | null> {
  try {
    const response = await fetch("/api/generate-workflow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) return null;
    const data = (await response.json()) as { workflow?: GeneratedWorkflow };
    if (!data.workflow || !data.workflow.nodes?.length) return null;
    return data.workflow;
  } catch {
    return null;
  }
}

const KEYWORD_TEMPLATES: Array<{
  keywords: string[];
  templateId: string;
  label: string;
}> = [
  { keywords: ["linkedin", "social", "post"], templateId: "linkedin-post", label: "LinkedIn Content" },
  { keywords: ["blog", "article", "essay", "content"], templateId: "blog-writer", label: "Blog Content" },
  { keywords: ["product", "shopping", "ecommerce", "e-commerce", "listing"], templateId: "product-description", label: "Product Copy" },
  { keywords: ["youtube", "video", "script"], templateId: "youtube-script", label: "Video Script" },
];

/** Offline fallback that turns a description into a sensible workflow. */
export function generateWorkflowLocally(
  description: string,
): GeneratedWorkflow {
  const lower = description.toLowerCase();
  const template = KEYWORD_TEMPLATES.find((candidate) =>
    candidate.keywords.some((keyword) => lower.includes(keyword)),
  );

  const inputConfig: WorkflowNodeConfig = {
    ...NODE_DEFINITION_MAP.input.createConfig(),
    input: description.trim() || "Generate content for the following topic.",
  } as WorkflowNodeConfig;

  const hasResearch =
    template?.templateId === "blog-writer" || template?.templateId === "youtube-script";

  type Step = { type: WorkflowNodeType; overrides?: Partial<WorkflowNodeConfig> };
  const steps: Step[] = [{ type: "input" }, { type: "ideaGenerator" }];
  if (hasResearch) steps.splice(1, 0, { type: "research" });
  steps.push({ type: "writer" }, { type: "qualityChecker" }, { type: "output" });

  const contentTypeFor =
    template?.templateId === "linkedin-post"
      ? "LinkedIn post"
      : template?.templateId === "product-description"
        ? "Product description"
        : template?.templateId === "youtube-script"
          ? "YouTube script"
          : "Blog post";

  const elements = layoutVertically(
    steps.map((step) => ({
      type: step.type,
      config:
        step.type === "input"
          ? inputConfig
          : ({
              ...NODE_DEFINITION_MAP[step.type].createConfig(),
              ...(step.type === "writer" ? { contentType: contentTypeFor } : {}),
              ...(step.overrides ?? {}),
            } as WorkflowNodeConfig),
    })),
  ) as ElementModel[];

  const name = template
    ? `${template.label} Workflow`
    : `${titleCase(description)} Workflow`;
  return buildFromElementModels(name, description, elements);
}

function titleCase(text: string): string {
  const words = text.trim().split(/\s+/).slice(0, 6);
  if (words.length === 0) return "Custom";
  return words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Prefer the real AI generator, falling back to the local heuristic. */
export async function generateWorkflowSmart(
  description: string,
): Promise<{ workflow: GeneratedWorkflow; source: "ai" | "local" }> {
  const aiWorkflow = await generateWorkflowWithAI(description);
  if (aiWorkflow) return { workflow: aiWorkflow, source: "ai" };
  return { workflow: generateWorkflowLocally(description), source: "local" };
}