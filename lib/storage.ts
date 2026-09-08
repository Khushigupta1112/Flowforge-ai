import type {
  SavedEdge,
  SavedNode,
  WorkflowSnapshot,
} from "@/types/workflow";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { getTemplate } from "@/lib/templates";

const STORAGE_KEY = "flowforge:workflows";
const SEED_FLAG = "flowforge:seeded-v1";

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadAllWorkflows(): WorkflowSnapshot[] {
  if (typeof window === "undefined") return [];
  return safeParse<WorkflowSnapshot[]>(window.localStorage.getItem(STORAGE_KEY), []);
}

export function getWorkflow(id: string): WorkflowSnapshot | undefined {
  return loadAllWorkflows().find((w) => w.meta.id === id);
}

export function saveWorkflow(workflow: WorkflowSnapshot): void {
  const workflows = loadAllWorkflows();
  const index = workflows.findIndex((w) => w.meta.id === workflow.meta.id);
  if (index >= 0) workflows[index] = workflow;
  else workflows.unshift(workflow);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function deleteWorkflow(id: string): void {
  const workflows = loadAllWorkflows().filter((w) => w.meta.id !== id);
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

export function renameWorkflow(id: string, name: string): void {
  const workflows = loadAllWorkflows().map((w) =>
    w.meta.id === id
      ? { ...w, meta: { ...w.meta, name, updatedAt: new Date().toISOString() } }
      : w,
  );
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
}

/** Create a blank, valid workflow (input → output) already wired up. */
export function createBlankWorkflow(name = "Untitled workflow"): WorkflowSnapshot {
  const inputNode: SavedNode = {
    id: uid("node"),
    type: "input",
    position: { x: 240, y: 260 },
    config: NODE_DEFINITION_MAP.input.createConfig(),
  };
  const outputNode: SavedNode = {
    id: uid("node"),
    type: "output",
    position: { x: 240, y: 420 },
    config: NODE_DEFINITION_MAP.output.createConfig(),
  };
  const edge: SavedEdge = { id: uid("edge"), source: inputNode.id, target: outputNode.id };

  return {
    meta: {
      id: uid("wf"),
      name,
      description: "A fresh canvas. Add nodes from the library to start building.",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    nodes: [inputNode, outputNode],
    edges: [edge],
  };
}

/* ------------------------------------------------------------------ */
/* Seeding demo workflows on first launch                              */
/* ------------------------------------------------------------------ */

function seed(): WorkflowSnapshot[] {
  const fromTemplate = (templateId: string): WorkflowSnapshot => {
    const template = getTemplate(templateId);
    const built = template!.build();
    const nodes = built.nodes.map((node) => ({
      ...node,
      position: { x: node.position.x + 60, y: node.position.y - 60 },
    }));
    const now = new Date();
    return {
      meta: {
        id: uid("wf"),
        name: built.name,
        description: built.description,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
      nodes,
      edges: built.edges,
    };
  };

  return [
    fromTemplate("linkedin-post"),
    fromTemplate("blog-writer"),
    fromTemplate("product-description"),
    fromTemplate("youtube-script"),
  ];
}

/** Seed a set of example workflows the very first time the app runs. */
export function ensureSeeded(): void {
  if (typeof window === "undefined") return;
  if (window.localStorage.getItem(SEED_FLAG)) return;
  const workflows = seed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  window.localStorage.setItem(SEED_FLAG, "true");
}

/** Re-create the seed data (used by the dashboard "Reset examples" action). */
export function reseed(): void {
  if (typeof window === "undefined") return;
  const workflows = seed();
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows));
  window.localStorage.setItem(SEED_FLAG, "true");
}

export function normalizeNode(node: SavedNode): SavedNode {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    config: node.config,
  };
}

/** Build and persist a brand-new workflow from a template id. */
export function createFromTemplate(templateId: string): WorkflowSnapshot {
  const template = getTemplate(templateId);
  if (!template) return createBlankWorkflow(`Untitled (${templateId})`);
  const built = template.build();
  const snapshot: WorkflowSnapshot = {
    meta: {
      id: uid("wf"),
      name: built.name,
      description: built.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    nodes: built.nodes,
    edges: built.edges,
  };
  saveWorkflow(snapshot);
  return snapshot;
}