"use client";

import { useCallback, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Sparkles } from "lucide-react";
import {
  NODE_CATEGORIES,
  NODE_DEFINITIONS,
} from "@/lib/node-definitions";
import { Button } from "@/components/ui/Button";

export function NodeLibrary({ onGenerateWithAI }: { onGenerateWithAI: () => void }) {
  const router = useRouter();
  const onDragStart = useCallback((event: DragEvent, type: string) => {
    event.dataTransfer.setData("application/flowforge-node", type);
    event.dataTransfer.effectAllowed = "move";
  }, []);

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-edge)] bg-[#0c0e12]">
      <div className="border-b border-[var(--color-edge)] px-3 py-3">
        <button
          onClick={onGenerateWithAI}
          className="group w-full rounded-xl border border-indigo-500/25 bg-gradient-to-br from-indigo-500/15 to-violet-500/10 px-3 py-2.5 text-left transition-colors hover:border-indigo-400/40 hover:from-indigo-500/20"
        >
          <span className="flex items-center gap-2 text-[13px] font-semibold text-indigo-200">
            <Sparkles className="size-3.5 text-indigo-300" />
            Generate with AI
          </span>
          <span className="mt-1 block text-[11px] leading-snug text-indigo-200/60">
            Describe a workflow and let AI build it.
          </span>
        </button>
      </div>

      <div className="scroll-thin flex-1 overflow-y-auto p-2.5">
        {NODE_CATEGORIES.map((category) => {
          const items = NODE_DEFINITIONS.filter(
            (def) => def.category === category.id,
          );
          if (items.length === 0) return null;
          return (
            <div key={category.id} className="mb-4">
              <p className="mb-1.5 px-1.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                {category.label}
              </p>
              <div className="space-y-1">
                {items.map((def) => (
                  <button
                    key={def.type}
                    draggable
                    onDragStart={(event) => onDragStart(event, def.type)}
                    title={`${def.label} — ${def.description}`}
                    className="group flex w-full cursor-grab items-start gap-2.5 rounded-lg border border-transparent px-2 py-2 text-left transition-colors hover:border-[var(--color-edge)] hover:bg-white/[0.03] active:cursor-grabbing"
                  >
                    <span
                      className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ring-1 ring-white/10"
                      style={{
                        backgroundColor: `${def.color}14`,
                        color: def.color,
                      }}
                    >
                      <def.icon className="size-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex items-center gap-1 text-[12.5px] font-medium text-[var(--color-ink)]">
                        {def.label}
                        <GripVertical className="ml-auto size-3 shrink-0 text-[var(--color-ink-3)] opacity-0 transition-opacity group-hover:opacity-100" />
                      </span>
                      <span className="mt-0.5 block text-[11px] leading-snug text-[var(--color-ink-3)]">
                        {def.description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-[var(--color-edge)] p-2.5">
        <p className="px-1 pb-2 text-[10.5px] leading-relaxed text-[var(--color-ink-3)]">
          Drag nodes onto the canvas, then connect them to build your workflow.
        </p>
        <Button
          variant="ghost"
          size="xs"
          className="w-full justify-start"
          onClick={() => router.push("/dashboard")}
        >
          <span className="text-[var(--color-ink-3)]">Need help? Try a template from the dashboard.</span>
        </Button>
      </div>
    </aside>
  );
}