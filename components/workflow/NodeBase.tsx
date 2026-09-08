"use client";

import type { ReactNode } from "react";
import { Handle, Position } from "@xyflow/react";
import {
  Check,
  CircleDashed,
  Loader2,
  X,
} from "lucide-react";
import type { NodeDefinition } from "@/lib/node-definitions";
import type { WorkflowNodeData } from "@/types/workflow";
import { cn, truncate } from "@/lib/utils";

const FEED: Record<string, string> = {
  idle: "bg-[var(--color-edge-strong)]",
  pending: "bg-[var(--color-ink-3)]",
  running: "bg-indigo-400 animate-pulse",
  completed: "bg-emerald-400",
  failed: "bg-rose-400",
};

function StatusIcon({ status }: { status: string }) {
  if (status === "running") return <Loader2 className="size-3 animate-spin text-indigo-300" />;
  if (status === "completed") return <Check className="size-3 text-emerald-300" />;
  if (status === "failed") return <X className="size-3 text-rose-300" />;
  if (status === "pending") return <CircleDashed className="size-3 text-[var(--color-ink-3)]" />;
  return <span className={cn("size-1.5 rounded-full", FEED.idle)} />;
}

export interface NodeBaseProps {
  data: WorkflowNodeData;
  def: NodeDefinition;
  selected?: boolean;
  children?: ReactNode;
  /** Preview line shown when the node has produced output. */
  output?: unknown;
}

export function NodeBase({
  data,
  def,
  selected,
  children,
  output,
}: NodeBaseProps) {
  const status = data.status ?? "idle";
  const running = status === "running";

  const preview =
    typeof output === "string"
      ? truncate(output, 140)
      : output
        ? truncate(JSON.stringify(output), 140)
        : null;

  return (
    <div
      className={cn(
        "ff-node w-[248px] rounded-xl border bg-[#12151d] shadow-[0_10px_30px_-15px_rgba(0,0,0,0.8)]",
        "border-[var(--color-edge)]",
        running && "border-indigo-500/40",
        status === "failed" && "border-rose-500/40",
      )}
      data-testid={`node-${def.type}`}
    >
      {/* accent bar */}
      <div
        className="h-[3px] w-full rounded-t-xl opacity-80"
        style={{ backgroundColor: def.color }}
      />

      {/* header */}
      <div className="flex items-center gap-2.5 px-3 pt-2.5 pb-2">
        <span
          className="grid size-6.5 shrink-0 place-items-center rounded-lg ring-1 ring-white/10"
          style={{
            backgroundColor: `${def.color}1a`,
            color: def.color,
          }}
        >
          <def.icon className="size-3.5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold leading-tight text-[var(--color-ink)]">
            {data.config.label || def.label}
          </p>
          <p className="text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
            {def.shortLabel}
          </p>
        </div>
        <span className="shrink-0" title={`Status: ${status}`}>
          <StatusIcon status={status} />
        </span>
      </div>

      {/* body */}
      {children && (
        <div className="px-3 pb-2.5 pt-0.5 text-[12px] leading-relaxed text-[var(--color-ink-2)]">
          {children}
        </div>
      )}

      {/* output preview */}
      {preview && (
        <div className="mx-3 mb-2.5 rounded-lg border border-[var(--color-edge)] bg-black/25 px-2.5 py-2">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]">
            Output
          </p>
          <p className="line-clamp-4 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-[var(--color-ink-2)]">
            {preview}
          </p>
        </div>
      )}

      {def.hasInput && (
        <Handle type="target" position={Position.Left} className="-left-[5px]!" />
      )}
      {def.hasOutput && (
        <Handle type="source" position={Position.Right} className="-right-[5px]!" />
      )}
    </div>
  );
}