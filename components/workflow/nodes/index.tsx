"use client";

import type { NodeProps } from "@xyflow/react";
import { NodeBase } from "@/components/workflow/NodeBase";
import { NODE_DEFINITION_MAP, type NodeDefinition } from "@/lib/node-definitions";
import type { WorkflowNode, WorkflowNodeData, WorkflowNodeType } from "@/types/workflow";
import { truncate } from "@/lib/utils";

type NodeViewProps = NodeProps<WorkflowNode>;

function defFor(type: WorkflowNodeType): NodeDefinition {
  return NODE_DEFINITION_MAP[type];
}

function summaryLine(parts: Array<string | undefined | null>): string | null {
  const filled = parts.filter((part): part is string => Boolean(part && part.trim()));
  return filled.length ? filled.join(" · ") : null;
}

function InputNodeView({ data }: NodeViewProps) {
  const config = data.config as { input?: string };
  const meta = summaryLine([config.input]);
  return (
    <NodeBase data={data} def={defFor("input")} output={data.output}>
      <p className="line-clamp-3 whitespace-pre-wrap text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {meta ?? (
          <span className="text-[var(--color-ink-3)]">
            Click to enter the seed text for this workflow.
          </span>
        )}
      </p>
    </NodeBase>
  );
}

function AIAgentNodeView({ data }: NodeViewProps) {
  const config = data.config as {
    model?: string;
    temperature?: number;
    userPrompt?: string;
  };
  const meta = summaryLine([
    config.model,
    config.temperature !== undefined ? `temp ${config.temperature.toFixed(1)}` : null,
  ]);
  return (
    <NodeBase data={data} def={defFor("aiAgent")} output={data.output}>
      <p className="line-clamp-3 text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {truncate(config.userPrompt ?? "Custom prompt", 110)}
      </p>
      {meta && (
        <p className="mt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
          {meta}
        </p>
      )}
    </NodeBase>
  );
}

function ResearchNodeView({ data }: NodeViewProps) {
  const config = data.config as { topic?: string; instructions?: string };
  return (
    <NodeBase data={data} def={defFor("research")} output={data.output}>
      <p className="line-clamp-3 whitespace-pre-wrap text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {config.topic || config.instructions || "AI-generated research brief"}
      </p>
    </NodeBase>
  );
}

function IdeaGeneratorNodeView({ data }: NodeViewProps) {
  const config = data.config as { count?: number; focus?: string };
  return (
    <NodeBase data={data} def={defFor("ideaGenerator")} output={data.output}>
      <p className="line-clamp-3 text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {config.focus || "Brainstorm creative angles"}
      </p>
      <p className="mt-1.5 text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
        {config.count ?? 4} ideas
      </p>
    </NodeBase>
  );
}

function WriterNodeView({ data }: NodeViewProps) {
  const config = data.config as {
    tone?: string;
    contentType?: string;
    length?: string;
  };
  const meta = summaryLine([config.contentType, config.tone, config.length]);
  return (
    <NodeBase data={data} def={defFor("writer")} output={data.output}>
      {meta && (
        <p className="text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">{meta}</p>
      )}
    </NodeBase>
  );
}

function RewriterNodeView({ data }: NodeViewProps) {
  const config = data.config as { instructions?: string };
  return (
    <NodeBase data={data} def={defFor("rewriter")} output={data.output}>
      <p className="line-clamp-3 text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {config.instructions || "Rewrite pass"}
      </p>
    </NodeBase>
  );
}

function QualityCheckerNodeView({ data }: NodeViewProps) {
  const config = data.config as { strictness?: string };
  const score = data.result?.score;
  return (
    <NodeBase data={data} def={defFor("qualityChecker")} output={data.output}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11.5px] text-[var(--color-ink-2)]">
          {config.strictness ?? "Balanced"} review
        </span>
        {score !== undefined && (
          <span
            className={[
              "rounded-md px-1.5 py-0.5 font-mono text-[11px] font-semibold ring-1",
              score >= 85
                ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                : score >= 70
                  ? "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                  : "bg-rose-500/10 text-rose-300 ring-rose-500/20",
            ].join(" ")}
          >
            {score}/100
          </span>
        )}
      </div>
    </NodeBase>
  );
}

function OutputNodeView({ data }: NodeViewProps) {
  const typed = data as WorkflowNodeData;
  return (
    <NodeBase data={typed} def={defFor("output")} output={typed.output}>
      <p className="text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
        {typed.output ? (
          <span className="text-emerald-300/80">Final result ready — open the inspector to review.</span>
        ) : (
          <span className="text-[var(--color-ink-3)]">
            The final result of the workflow appears here.
          </span>
        )}
      </p>
    </NodeBase>
  );
}

export const nodeTypes = {
  input: InputNodeView,
  aiAgent: AIAgentNodeView,
  research: ResearchNodeView,
  ideaGenerator: IdeaGeneratorNodeView,
  writer: WriterNodeView,
  rewriter: RewriterNodeView,
  qualityChecker: QualityCheckerNodeView,
  output: OutputNodeView,
} as const;