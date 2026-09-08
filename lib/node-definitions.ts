import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Bot,
  Lightbulb,
  PenLine,
  Repeat,
  Search,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type {
  WorkflowNodeConfig,
  WorkflowNodeType,
} from "@/types/workflow";

export interface NodeCategory {
  id: string;
  label: string;
}

export const NODE_CATEGORIES: NodeCategory[] = [
  { id: "sources", label: "Sources" },
  { id: "agents", label: "AI Agents" },
  { id: "generate", label: "Generate" },
  { id: "refine", label: "Refine" },
  { id: "sinks", label: "Output" },
];

export interface NodeDefinition {
  type: WorkflowNodeType;
  label: string;
  shortLabel: string;
  description: string;
  icon: LucideIcon;
  color: string;
  category: string;
  hasInput: boolean;
  hasOutput: boolean;
  createConfig: () => WorkflowNodeConfig;
}

function defaultInputConfig(): WorkflowNodeConfig {
  return {
    type: "input",
    label: "Input",
    input: "Write a LinkedIn post about how AI is transforming agriculture.",
  };
}

function defaultAIAgentConfig(): WorkflowNodeConfig {
  return {
    type: "aiAgent",
    label: "AI Agent",
    model: "gemini-2.5-flash",
    systemPrompt:
      "You are a precise, helpful AI assistant. Fulfill the request using the context provided, and match the requested style closely.",
    userPrompt: "Complete the following task:\n\n{{context}}",
    temperature: 0.7,
  };
}

function defaultResearchConfig(): WorkflowNodeConfig {
  return {
    type: "research",
    label: "Research",
    topic: "",
    instructions:
      "Compile a concise, factual research brief with the most relevant insights, statistics, and angles.",
  };
}

function defaultIdeaConfig(): WorkflowNodeConfig {
  return {
    type: "ideaGenerator",
    label: "Idea Generator",
    count: 4,
    focus: "",
  };
}

function defaultWriterConfig(): WorkflowNodeConfig {
  return {
    type: "writer",
    label: "Writer",
    tone: "Professional",
    contentType: "LinkedIn post",
    length: "Medium",
    instructions: "Hook the reader, use short clear sentences, end with a strong takeaway.",
  };
}

function defaultRewriterConfig(): WorkflowNodeConfig {
  return {
    type: "rewriter",
    label: "Rewriter",
    instructions: "Tighten the copy, remove fluff, and make it more direct. Preserve all key ideas.",
  };
}

function defaultQualityCheckerConfig(): WorkflowNodeConfig {
  return {
    type: "qualityChecker",
    label: "Quality Checker",
    strictness: "Balanced",
  };
}

function defaultOutputConfig(): WorkflowNodeConfig {
  return {
    type: "output",
    label: "Output",
  };
}

export const NODE_DEFINITIONS: NodeDefinition[] = [
  {
    type: "input",
    label: "Input",
    shortLabel: "Input",
    description: "The starting point. Capture the user's request or topic.",
    icon: ArrowUpFromLine,
    color: "#38bdf8",
    category: "sources",
    hasInput: false,
    hasOutput: true,
    createConfig: defaultInputConfig,
  },
  {
    type: "aiAgent",
    label: "AI Agent",
    shortLabel: "AI Agent",
    description: "Run a custom prompt against an AI model with full control.",
    icon: Bot,
    color: "#94a3b8",
    category: "agents",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultAIAgentConfig,
  },
  {
    type: "research",
    label: "Research",
    shortLabel: "Research",
    description: "Gather and summarize context on a topic (AI-simulated).",
    icon: Search,
    color: "#fbbf24",
    category: "agents",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultResearchConfig,
  },
  {
    type: "ideaGenerator",
    label: "Idea Generator",
    shortLabel: "Generate Ideas",
    description: "Brainstorm multiple creative angles or ideas.",
    icon: Lightbulb,
    color: "#a78bfa",
    category: "generate",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultIdeaConfig,
  },
  {
    type: "writer",
    label: "Writer",
    shortLabel: "Writer",
    description: "Turn ideas and context into polished written content.",
    icon: PenLine,
    color: "#34d399",
    category: "generate",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultWriterConfig,
  },
  {
    type: "rewriter",
    label: "Rewriter",
    shortLabel: "Rewriter",
    description: "Re-express existing copy with new instructions.",
    icon: Repeat,
    color: "#2dd4bf",
    category: "refine",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultRewriterConfig,
  },
  {
    type: "qualityChecker",
    label: "Quality Checker",
    shortLabel: "Quality Check",
    description: "Score the output and return an improved version.",
    icon: ShieldCheck,
    color: "#fb7185",
    category: "refine",
    hasInput: true,
    hasOutput: true,
    createConfig: defaultQualityCheckerConfig,
  },
  {
    type: "output",
    label: "Output",
    shortLabel: "Output",
    description: "Collect the final result for review and export.",
    icon: ArrowDownToLine,
    color: "#4ade80",
    category: "sinks",
    hasInput: true,
    hasOutput: false,
    createConfig: defaultOutputConfig,
  },
];

export const NODE_DEFINITION_MAP: Record<
  WorkflowNodeType,
  NodeDefinition
> = Object.fromEntries(
  NODE_DEFINITIONS.map((def) => [def.type, def]),
) as Record<WorkflowNodeType, NodeDefinition>;

export const AI_MODELS = [
  { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", hint: "Fast · good for most nodes" },
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", hint: "Highest quality · slower" },
] as const;

export const TONES = [
  "Professional",
  "Conversational",
  "Enthusiastic",
  "Authoritative",
  "Witty",
  "Empathetic",
  "Minimalist",
] as const;

export const CONTENT_TYPES = [
  "LinkedIn post",
  "Blog post",
  "Thread / post",
  "Email",
  "Product description",
  "YouTube script",
  "Landing page copy",
  "Tweet",
] as const;

export const LENGTHS = [
  "Short",
  "Medium",
  "Long",
] as const;

export const STRICTNESS_LEVELS = [
  "Lenient",
  "Balanced",
  "Strict",
] as const;

export const TEMPERATURE_RANGE = { min: 0, max: 1, step: 0.1 } as const;