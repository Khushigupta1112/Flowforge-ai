"use client";

import { useState } from "react";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  Loader2,
  SquareTerminal,
  Trash2,
  XCircle,
  Ban,
} from "lucide-react";
import { useWorkflow } from "@/components/workflow/WorkflowContext";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { cn, formatDuration } from "@/lib/utils";

function statusMeta(status: string) {
  switch (status) {
    case "completed":
      return {
        icon: <CheckCircle2 className="size-3.5 text-emerald-400" />,
        label: "Completed in",
      };
    case "running":
      return { icon: <Loader2 className="size-3.5 animate-spin text-indigo-400" />, label: "Running" };
    case "failed":
      return { icon: <XCircle className="size-3.5 text-rose-400" />, label: "Failed" };
    case "pending":
      return { icon: <Circle className="size-3.5 text-[var(--color-ink-3)]" />, label: "Queued" };
    default:
      return { icon: <Circle className="size-3.5 text-[var(--color-edge-strong)]" />, label: "Idle" };
  }
}

function RunStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; tone: "success" | "warning" | "danger" | "info" | "neutral" }> = {
    idle: { label: "Idle", tone: "neutral" },
    running: { label: "Running", tone: "warning" },
    completed: { label: "Completed", tone: "success" },
    failed: { label: "Failed", tone: "danger" },
    stopped: { label: "Stopped", tone: "neutral" },
  };
  const item = map[status] ?? map.idle;
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function ExecutionPanel() {
  const { executionLog, runStatus, isRunning, stopWorkflow, clearExecution } = useWorkflow();
  const [collapsed, setCollapsed] = useState(false);

  const completedCount = executionLog.filter((entry) => entry.status === "completed").length;
  const failedEntry = executionLog.find((entry) => entry.status === "failed");

  return (
    <div
      className={cn(
        "shrink-0 border-t border-[var(--color-edge)] bg-[#0c0e12] transition-[height]",
        collapsed ? "h-10" : "h-56",
      )}
    >
      {/* header */}
      <div className="flex h-10 items-center gap-2 border-b border-[var(--color-edge)] px-3">
        <SquareTerminal className="size-3.5 text-[var(--color-ink-3)]" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-2)]">
          Execution
        </span>
        <RunStatusBadge status={runStatus} />
        {executionLog.length > 0 && !collapsed && (
          <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
            {completedCount}/{executionLog.length} staged
          </span>
        )}

        <div className="ml-auto flex items-center gap-1">
          {isRunning && (
            <Button size="sm" variant="secondary" onClick={stopWorkflow}>
              <Ban className="size-3.5" />
              Stop
            </Button>
          )}
          {executionLog.length > 0 && (
            <Button size="xs" variant="ghost" onClick={clearExecution} title="Clear execution log">
              <Trash2 className="size-3.5" />
              Clear
            </Button>
          )}
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setCollapsed((value) => !value)}
            title={collapsed ? "Expand execution panel" : "Collapse execution panel"}
          >
            {collapsed ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </Button>
        </div>
      </div>

      {/* body */}
      {!collapsed && (
        <div className="h-[calc(100%-2.5rem)] overflow-y-auto px-3 py-2">
          {executionLog.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-1 py-4 text-center">
              {isRunning ? (
                <Loader2 className="size-5 animate-spin text-indigo-400" />
              ) : (
                <Circle className="size-5 text-[var(--color-edge-strong)]" />
              )}
              <p className="text-[12px] font-medium text-[var(--color-ink-2)]">
                {isRunning ? "Starting…" : "No runs yet"}
              </p>
              <p className="max-w-xs text-[11px] leading-relaxed text-[var(--color-ink-3)]">
                {isRunning
                  ? "Preparing the pipeline."
                  : "Click \"Run Workflow\" to execute the pipeline step by step. Status is tracked live below."}
              </p>
            </div>
          ) : (
            <ol className="space-y-1">
              {executionLog.map((entry) => {
                const meta = statusMeta(entry.status);
                const def = NODE_DEFINITION_MAP[entry.nodeType];
                return (
                  <li
                    key={entry.id}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-2.5 py-1.5",
                      entry.status === "running" && "bg-indigo-500/[0.07] ring-1 ring-indigo-500/15",
                      entry.status === "failed" && "bg-rose-500/[0.06] ring-1 ring-rose-500/15",
                    )}
                  >
                    <span
                      className="grid size-6 shrink-0 place-items-center rounded-md ring-1 ring-white/10"
                      style={{ backgroundColor: `${def.color}12`, color: entry.status === "failed" ? "#fb7185" : def.color }}
                    >
                      <def.icon className="size-3" />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-[var(--color-ink)]">
                      {entry.nodeLabel}
                    </span>

                    {entry.status === "completed" && entry.durationMs !== undefined ? (
                      <span className="font-mono text-[11px] text-emerald-300/80">
                        {formatDuration(entry.durationMs)}
                      </span>
                    ) : (
                      <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
                        {meta.label}
                      </span>
                    )}

                    {entry.error && (
                      <span className="max-w-[240px] truncate text-[11px] text-rose-300/80" title={entry.error}>
                        {entry.error}
                      </span>
                    )}

                    <span className="text-[var(--color-ink-3)]">{meta.icon}</span>
                  </li>
                );
              })}
            </ol>
          )}

          {failedEntry && (
            <p className="mt-2 rounded-lg bg-rose-500/10 px-3 py-2 text-[11.5px] leading-relaxed text-rose-100/90 ring-1 ring-rose-500/15">
              {failedEntry.nodeLabel} failed — check the node&apos;s inspector for details, then adjust and run again.
            </p>
          )}

          {runStatus === "completed" && (
            <p className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium text-emerald-300/90">
              <CheckCircle2 className="size-3.5" />
              All stages passed. Final output is available in the Output node.
            </p>
          )}
        </div>
      )}
    </div>
  );
}