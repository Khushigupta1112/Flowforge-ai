import type { LucideIcon } from "lucide-react";
import { BookOpenText, PenSquare, Mic, ShoppingBag } from "lucide-react";
import type {
  ElementModel,
  GeneratedWorkflow,
  SavedEdge,
  SavedNode,
  WorkflowNodeConfig,
  WorkflowNodeType,
} from "@/types/workflow";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  accent: string;
  category: string;
  build: () => GeneratedWorkflow;
}

export function createNode(
  type: WorkflowNodeType,
  position: { x: number; y: number },
  overrides: Partial<WorkflowNodeConfig> = {},
): SavedNode {
  const def = NODE_DEFINITION_MAP[type];
  return {
    id: `${type}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    position,
    config: { ...def.createConfig(), ...overrides } as WorkflowNodeConfig,
  };
}

/**
 * Convert a list of element models into a SavedNode/SavedEdge graph.
 * Each element may declare explicit `edgesTo` indexes; otherwise nodes are
 * chained source → target in array order (the common linear case).
 */
export function buildFromElementModels(
  name: string,
  description: string,
  elements: ElementModel[],
): GeneratedWorkflow {
  const created: SavedNode[] = elements.map((element, index) =>
    createNode(element.type, element.position, element.config),
  );
  const edges: SavedEdge[] = [];

  for (let sourceIndex = 0; sourceIndex < elements.length; sourceIndex++) {
    const element = elements[sourceIndex];
    const explicit = Array.isArray(element.edgesTo) ? element.edgesTo : [];
    const targets =
      explicit.length > 0
        ? explicit
        : sourceIndex < elements.length - 1
          ? [sourceIndex + 1]
          : [];
    for (const targetIndex of targets) {
      if (targetIndex < 0 || targetIndex >= created.length) continue;
      edges.push({
        id: `edge-${edges.length + 1}`,
        source: created[sourceIndex].id,
        target: created[targetIndex].id,
      });
    }
  }

  return { name, description, nodes: created, edges };
}

/** Lay out typed elements down the canvas (chains arranged vertically). */
export function layoutVertically(
  elements: Array<Omit<ElementModel, "position">>,
  options: { startX?: number; startY?: number; spacing?: number } = {},
): ElementModel[] {
  const { startX = 240, startY = 40, spacing = 120 } = options;
  return elements.map((element, index) => ({
    ...element,
    position: { x: startX, y: startY + index * spacing },
  }));
}

function element(type: WorkflowNodeType, overrides: Partial<WorkflowNodeConfig> = {}): Omit<ElementModel, "position"> {
  return {
    type,
    config: {
      ...NODE_DEFINITION_MAP[type].createConfig(),
      ...overrides,
    } as WorkflowNodeConfig,
  };
}

/* ------------------------------------------------------------------ */
/* Template definitions                                                */
/* ------------------------------------------------------------------ */

const linkedinTemplate: WorkflowTemplate = {
  id: "linkedin-post",
  name: "LinkedIn Post Generator",
  description:
    "Turn a topic into a polished LinkedIn post: brainstorm angles, draft, and pass a quality gate.",
  icon: PenSquare,
  accent: "#38bdf8",
  category: "Marketing",
  build: () =>
    buildFromElementModels(
      "LinkedIn Post Generator",
      "Write a LinkedIn post about how AI is transforming agriculture.",
      layoutVertically([
        element("input", {
          input:
            "Write a LinkedIn post about how AI is transforming agriculture.",
        }),
        element("ideaGenerator", { count: 4 }),
        element("writer", { contentType: "LinkedIn post", tone: "Professional" }),
        element("qualityChecker"),
        element("output"),
      ]),
    ),
};

const blogTemplate: WorkflowTemplate = {
  id: "blog-writer",
  name: "Blog Writer",
  description:
    "Research a topic, outline angles, write a structured post, then verify quality.",
  icon: BookOpenText,
  accent: "#34d399",
  category: "Content",
  build: () =>
    buildFromElementModels(
      "Blog Writer",
      "Write a blog post about the future of AI agents.",
      layoutVertically([
        element("input", { input: "Write a blog post about the future of AI agents." }),
        element("research"),
        element("ideaGenerator", { count: 3, focus: "Strong blog angles" }),
        element("writer", { contentType: "Blog post", length: "Long" }),
        element("qualityChecker"),
        element("output"),
      ]),
    ),
};

const productTemplate: WorkflowTemplate = {
  id: "product-description",
  name: "Product Description Generator",
  description:
    "Generate benefit-led product copy with ideas, drafting, and a quality check.",
  icon: ShoppingBag,
  accent: "#a78bfa",
  category: "E-commerce",
  build: () =>
    buildFromElementModels(
      "Product Description Generator",
      "Create a product description for an ergonomic wireless standing desk.",
      layoutVertically([
        element("input", {
          input:
            "Write a product description for an ergonomic adjustable standing desk.",
        }),
        element("ideaGenerator", { count: 3, focus: "Benefit-led selling angles" }),
        element("writer", { contentType: "Product description", tone: "Persuasive" }),
        element("qualityChecker"),
        element("output"),
      ]),
    ),
};

const youtubeTemplate: WorkflowTemplate = {
  id: "youtube-script",
  name: "YouTube Script Generator",
  description:
    "Research a topic, brainstorm segments, and write a full spoken script.",
  icon: Mic,
  accent: "#fb7185",
  category: "Video",
  build: () =>
    buildFromElementModels(
      "YouTube Script Generator",
      "Write an 8-minute YouTube script about building AI agents for beginners.",
      layoutVertically([
        element("input", {
          input:
            "Write an 8-minute YouTube script about building AI agents for beginners.",
        }),
        element("research"),
        element("ideaGenerator", { count: 5, focus: "Video segments and hooks" }),
        element("writer", {
          contentType: "YouTube script",
          tone: "Enthusiastic",
          length: "Long",
          instructions:
            "Write for spoken delivery: opening hook, clear chapters, a call to action, and a closing loop.",
        }),
        element("qualityChecker"),
        element("output"),
      ]),
    ),
};

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  linkedinTemplate,
  blogTemplate,
  productTemplate,
  youtubeTemplate,
];

export const TEMPLATE_MAP: Record<string, WorkflowTemplate> =
  Object.fromEntries(WORKFLOW_TEMPLATES.map((t) => [t.id, t]));

export function getTemplate(templateId: string): WorkflowTemplate | undefined {
  return TEMPLATE_MAP[templateId];
}