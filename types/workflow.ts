import type { Edge, Node } from "@xyflow/react";

/* ------------------------------------------------------------------ */
/* Node type registry                                                  */
/* ------------------------------------------------------------------ */

export const NODE_TYPE_LITERALS = [
  "input",
  "aiAgent",
  "research",
  "ideaGenerator",
  "writer",
  "rewriter",
  "qualityChecker",
  "output",
] as const;

export type WorkflowNodeType = (typeof NODE_TYPE_LITERALS)[number];

/* ------------------------------------------------------------------ */
/* Node status                                                         */
/* ------------------------------------------------------------------ */

export type NodeStatus =
  | "idle"
  | "pending"
  | "running"
  | "completed"
  | "failed";

export type WorkflowRunStatus =
  | "idle"
  | "running"
  | "completed"
  | "failed"
  | "stopped";

/* ------------------------------------------------------------------ */
/* Node configuration (per type)                                       */
/* ------------------------------------------------------------------ */

export interface InputNodeConfig {
  label: string;
  input: string;
}

export interface AIAgentNodeConfig {
  label: string;
  model: string;
  systemPrompt: string;
  userPrompt: string;
  temperature: number;
}

export interface ResearchNodeConfig {
  label: string;
  topic: string;
  instructions: string;
}

export interface IdeaGeneratorNodeConfig {
  label: string;
  count: number;
  focus: string;
}

export interface WriterNodeConfig {
  label: string;
  tone: string;
  contentType: string;
  length: string;
  instructions: string;
}

export interface RewriterNodeConfig {
  label: string;
  instructions: string;
}

export interface QualityCheckerNodeConfig {
  label: string;
  strictness: string;
}

export interface OutputNodeConfig {
  label: string;
}

/* Discriminated union of every config, keyed by node type */
export type WorkflowNodeConfig =
  | ({ type: "input" } & InputNodeConfig)
  | ({ type: "aiAgent" } & AIAgentNodeConfig)
  | ({ type: "research" } & ResearchNodeConfig)
  | ({ type: "ideaGenerator" } & IdeaGeneratorNodeConfig)
  | ({ type: "writer" } & WriterNodeConfig)
  | ({ type: "rewriter" } & RewriterNodeConfig)
  | ({ type: "qualityChecker" } & QualityCheckerNodeConfig)
  | ({ type: "output" } & OutputNodeConfig);

/* ------------------------------------------------------------------ */
/* Runtime node data carried inside React Flow nodes                   */
/* ------------------------------------------------------------------ */

export interface QualityCheckResult {
  score: number;
  issues: string[];
  suggestions: string[];
  improvedVersion: string;
}

export interface WorkflowNodeData extends Record<string, unknown> {
  config: WorkflowNodeConfig;
  status: NodeStatus;
  output?: string;
  error?: string;
  durationMs?: number;
  runIndex?: number;
  result?: QualityCheckResult;
}

export type WorkflowNode = Node<WorkflowNodeData>;

export type WorkflowEdge = Edge;

/* ------------------------------------------------------------------ */
/* Saved workflows (localStorage shape)                                */
/* ------------------------------------------------------------------ */

export interface SavedNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  config: WorkflowNodeConfig;
}

export interface SavedEdge {
  id: string;
  source: string;
  target: string;
}

export interface WorkflowMeta {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  tag?: string;
}

export interface WorkflowSnapshot {
  meta: WorkflowMeta;
  nodes: SavedNode[];
  edges: SavedEdge[];
}

export interface GeneratedWorkflow {
  name: string;
  description?: string;
  nodes: SavedNode[];
  edges: SavedEdge[];
}

export interface ExecutionLogEntry {
  id: string;
  nodeId: string;
  nodeLabel: string;
  nodeType: WorkflowNodeType;
  status: NodeStatus;
  startedAt?: number;
  durationMs?: number;
  error?: string;
}

/* ------------------------------------------------------------------ */
/* Element model used to build workflows programmatically              */
/* ------------------------------------------------------------------ */

export interface ElementModel {
  type: WorkflowNodeType;
  position: { x: number; y: number };
  config: WorkflowNodeConfig;
  /** Optional explicit edge targets (indexes into the same array). */
  edgesTo?: number[];
}