"use client";

import { memo, useState } from "react";
import { MoreHorizontal, Pencil, Play, Trash2 } from "lucide-react";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import type { WorkflowSnapshot } from "@/types/workflow";
import { relativeTime } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export interface WorkflowCardProps {
  workflow: WorkflowSnapshot;
  onRun: (workflow: WorkflowSnapshot) => void;
  onEdit: (workflow: WorkflowSnapshot) => void;
  onRename: (workflow: WorkflowSnapshot) => void;
  onDelete: (workflow: WorkflowSnapshot) => void;
  compact?: boolean;
}

export const WorkflowCard = memo(function WorkflowCard({
  workflow,
  onRun,
  onEdit,
  onRename,
  onDelete,
  compact = false,
}: WorkflowCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { nodes, meta } = workflow;

  const nodeTypes = new Set(nodes.map((node) => node.type));
  const nodeIcons = [...nodeTypes].slice(0, 4);

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] transition-all hover:border-[var(--color-edge-strong)] hover:bg-[var(--color-panel-2)]",
        compact ? "p-4" : "p-5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className={cn(
            "line-clamp-1 font-semibold text-[var(--color-ink)]",
            compact ? "text-[13.5px]" : "text-[15px]",
          )}
          title={meta.name}
        >
          {meta.name}
        </h3>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="rounded-lg p-1.5 text-[var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink)]"
            aria-label={`Actions for ${meta.name}`}
            aria-expanded={menuOpen}
          >
            <MoreHorizontal className="size-4" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-8 z-20 w-36 animate-scale-in rounded-xl border border-[var(--color-edge)] bg-[#131620] p-1 shadow-2xl">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onRename(workflow);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-[var(--color-ink-2)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink)]"
                >
                  <Pencil className="size-3.5" />
                  Rename
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onDelete(workflow);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-[12.5px] text-rose-300/90 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                >
                  <Trash2 className="size-3.5" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* node icon strip */}
      <div className="mt-3 flex items-center gap-1.5">
        {nodeIcons.map((type) => {
          const def = NODE_DEFINITION_MAP[type as keyof typeof NODE_DEFINITION_MAP];
          if (!def) return null;
          return (
            <span
              key={type}
              className="grid size-6.5 place-items-center rounded-lg ring-1 ring-white/10"
              style={{ backgroundColor: `${def.color}14`, color: def.color }}
              title={def.label}
            >
              <def.icon className="size-3" />
            </span>
          );
        })}
        {nodes.length > nodeIcons.length && (
          <span className="ml-1 font-mono text-[11px] text-[var(--color-ink-3)]">
            +{nodes.length - nodeIcons.length}
          </span>
        )}
      </div>

      <div className="mt-3 flex items-baseline gap-3 text-[11px] text-[var(--color-ink-3)]">
        <span>
          {nodes.length} node{nodes.length === 1 ? "" : "s"}
        </span>
        <span className="size-0.5 self-center rounded-full bg-[var(--color-edge-strong)]" />
        <span className="truncate">Updated {relativeTime(meta.updatedAt)}</span>
      </div>

      <div className="mt-4 flex gap-2">
        <Button
          size="sm"
          variant="primary"
          className="flex-1"
          onClick={() => onRun(workflow)}
        >
          <Play className="size-3.5" />
          Run
        </Button>
        <Button size="sm" variant="secondary" className="flex-1" onClick={() => onEdit(workflow)}>
          Edit
        </Button>
      </div>
    </div>
  );
});