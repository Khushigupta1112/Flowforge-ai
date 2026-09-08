"use client";

import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  Copy,
  Download,
  Eye,
  EyeOff,
  FileText,
  RefreshCw,
  Settings2,
  Sparkles,
  Trash2,
  CopyPlus,
  X,
} from "lucide-react";
import { useWorkflow } from "@/components/workflow/WorkflowContext";
import { NODE_DEFINITION_MAP } from "@/lib/node-definitions";
import { AI_MODELS, STRICTNESS_LEVELS, TONES, CONTENT_TYPES, LENGTHS, TEMPERATURE_RANGE } from "@/lib/node-definitions";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FieldGroup,
  SelectField,
  SliderField,
  TextArea,
  TextField,
} from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import type { QualityCheckResult } from "@/types/workflow";
import { cn, formatDuration } from "@/lib/utils";

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    idle: { label: "Idle", cls: "bg-white/[0.05] text-[var(--color-ink-3)] ring-white/10" },
    pending: { label: "Pending", cls: "bg-sky-500/10 text-sky-300 ring-sky-500/20" },
    running: { label: "Running", cls: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20 animate-pulse" },
    completed: { label: "Completed", cls: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20" },
    failed: { label: "Failed", cls: "bg-rose-500/10 text-rose-300 ring-rose-500/20" },
  };
  const item = map[status] ?? map.idle;
  return (
    <span className={cn("inline-flex items-center rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1", item.cls)}>
      {item.label}
    </span>
  );
}

function QualityReport({ result }: { result: QualityCheckResult }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-[var(--color-edge)] bg-white/[0.02] p-3">
        <div className="grid size-12 place-items-center rounded-full border-2 border-emerald-400/40">
          <span className="font-mono text-lg font-bold text-emerald-300">{result.score}</span>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[var(--color-ink)]">Quality score</p>
          <p className="text-[11px] text-[var(--color-ink-3)]">
            {result.score >= 85 ? "Ready to ship" : result.score >= 70 ? "Needs minor polish" : "Revise before publishing"}
          </p>
        </div>
      </div>

      {result.issues.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-rose-300/80">Issues</p>
          <ul className="space-y-1">
            {result.issues.map((issue, index) => (
              <li key={index} className="flex gap-2 rounded-lg bg-rose-500/[0.06] px-2.5 py-1.5 text-[12px] leading-relaxed text-rose-100/70 ring-1 ring-rose-500/10">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-rose-400" />
                {issue}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.suggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sky-300/80">Suggestions</p>
          <ul className="space-y-1">
            {result.suggestions.map((suggestion, index) => (
              <li key={index} className="flex gap-2 rounded-lg bg-sky-500/[0.06] px-2.5 py-1.5 text-[12px] leading-relaxed text-sky-100/70 ring-1 ring-sky-500/10">
                <Sparkles className="mt-0.5 size-3 shrink-0 text-sky-400" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OutputText({
  text,
  onCopy,
  compact,
}: {
  text: string;
  onCopy: () => void;
  compact?: boolean;
}) {
  return (
    <div className="relative rounded-xl border border-[var(--color-edge)] bg-[#0c0f15]">
      <div className="flex items-center justify-between border-b border-[var(--color-edge)] px-3 py-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">Result</span>
        <button
          onClick={onCopy}
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink)]"
        >
          <Copy className="size-3" />
          Copy
        </button>
      </div>
      <pre
        className={cn(
          "overflow-auto whitespace-pre-wrap px-3 py-2.5 font-mono text-[12px] leading-relaxed text-[var(--color-ink-2)]",
          compact ? "max-h-40" : "max-h-[52vh]",
        )}
      >
        {text}
      </pre>
    </div>
  );
}

export function Inspector() {
  const {
    selectedNode,
    updateNodeConfig,
    deleteNode,
    duplicateNode,
    runWorkflow,
    clearExecution,
    setSelectedNodeId,
    isRunning,
    notFound,
  } = useWorkflow();
  const toast = useToast();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expandedOutput, setExpandedOutput] = useState(false);

  const copyText = useMemo(
    () => async (text: string, label = "Result") => {
      try {
        await navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
      } catch {
        toast.error("Copy failed", "Clipboard access was denied.");
      }
    },
    [toast],
  );

  if (notFound) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--color-edge)] bg-[var(--color-panel)]">
        <div className="p-5">
          <p className="text-[13px] font-medium text-rose-300">Workflow not found</p>
          <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-2)]">
            This workflow may have been deleted. The canvas shows a fresh blank workflow.
          </p>
        </div>
      </aside>
    );
  }

  if (!selectedNode) {
    return (
      <aside className="flex w-72 shrink-0 flex-col border-l border-[var(--color-edge)] bg-[var(--color-panel)]">
        <div className="flex-1 overflow-y-auto p-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
            Inspector
          </p>
          <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--color-edge-strong)] px-4 py-8 text-center">
            <Settings2 className="mb-2 size-5 text-[var(--color-ink-3)]" />
            <p className="text-[13px] font-medium text-[var(--color-ink)]">No node selected</p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
              Click a node to configure its prompt, model, tone, and more.
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--color-edge)] p-3">
            <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
              <FileText className="size-3" />
              Workflow meta
            </p>
            <p className="text-[12px] leading-relaxed text-[var(--color-ink-2)]">
              Connect nodes left → right. Inputs feed into AI agents on the right, results collect at the Output node.
            </p>
          </div>
        </div>
      </aside>
    );
  }

  const data = selectedNode.data;
  const config = data.config as Record<string, unknown> & { label?: string; type?: string };
  const def = NODE_DEFINITION_MAP[selectedNode.type as keyof typeof NODE_DEFINITION_MAP];

  const patch = (update: Record<string, unknown>) => {
    updateNodeConfig(
      selectedNode.id,
      update as unknown as Parameters<typeof updateNodeConfig>[1],
    );
  };

  const isOutput = selectedNode.type === "output";
  const isQualityChecker = selectedNode.type === "qualityChecker";
  const outputText = typeof data.output === "string" ? data.output : "";
  const hasOutput = Boolean(outputText);

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-[var(--color-edge)] bg-[var(--color-panel)]">
      {/* header */}
      <div className="border-b border-[var(--color-edge)] px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span
            className="grid size-7 shrink-0 place-items-center rounded-lg ring-1 ring-white/10"
            style={{ backgroundColor: `${def.color}14`, color: def.color }}
          >
            <def.icon className="size-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-semibold text-[var(--color-ink)]">
              {config.label || def.label}
            </p>
            <p className="text-[10.5px] font-medium uppercase tracking-wide text-[var(--color-ink-3)]">
              {def.shortLabel}
            </p>
          </div>
          <StatusBadge status={data.status ?? "idle"} />
        </div>

        <div className="mt-2.5 flex items-center gap-1.5">
          <Button size="xs" variant="ghost" onClick={() => duplicateNode(selectedNode.id)} title="Duplicate node">
            <CopyPlus className="size-3.5" />
            Duplicate
          </Button>
          <Button size="xs" variant="ghost" onClick={() => setConfirmDelete(true)} title="Delete node" className="!text-rose-300! hover:!bg-rose-500/10!">
            <Trash2 className="size-3.5" />
            Delete
          </Button>
          <Button size="xs" variant="ghost" className="ml-auto" onClick={() => setSelectedNodeId(null)} title="Close">
            <X className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* body */}
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {data.error && (
          <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-[12px] leading-relaxed text-rose-100 ring-1 ring-rose-500/20">
            {data.error}
          </div>
        )}

        {/* ------- config ------- */}
        <div className="space-y-3.5">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
            <Settings2 className="size-3" />
            Configuration
          </p>

          {selectedNode.type === "input" && (
            <TextArea
              label="Input text"
              hint="The seed text passed to the rest of the workflow."
              value={(config.input as string) ?? ""}
              onChange={(event) => patch({ input: event.target.value })}
              placeholder="e.g. Write a LinkedIn post about AI in agriculture."
            />
          )}

          {selectedNode.type === "aiAgent" && (
            <>
              <SelectField
                label="Model"
                options={AI_MODELS.map((m) => ({ value: m.id, label: m.label }))}
                value={(config.model as string) ?? "gemini-2.5-flash"}
                onChange={(event) => patch({ model: event.target.value })}
              />
              <TextArea
                label="System prompt"
                value={(config.systemPrompt as string) ?? ""}
                onChange={(event) => patch({ systemPrompt: event.target.value })}
                className="min-h-24"
              />
              <TextArea
                label="User prompt"
                hint="Use {{context}} to place the previous stage's output."
                value={(config.userPrompt as string) ?? ""}
                onChange={(event) => patch({ userPrompt: event.target.value })}
                className="min-h-24"
              />
              <SliderField
                label="Temperature"
                value={Number(config.temperature ?? 0.7)}
                min={TEMPERATURE_RANGE.min}
                max={TEMPERATURE_RANGE.max}
                step={TEMPERATURE_RANGE.step}
                onChange={(value) => patch({ temperature: value })}
                format={(value) => value.toFixed(1)}
              />
            </>
          )}

          {selectedNode.type === "research" && (
            <>
              <TextField
                label="Research topic"
                value={(config.topic as string) ?? ""}
                onChange={(event) => patch({ topic: event.target.value })}
                placeholder="Leave empty to use the upstream output."
              />
              <TextArea
                label="Instructions"
                value={(config.instructions as string) ?? ""}
                onChange={(event) => patch({ instructions: event.target.value })}
              />
              <p className="rounded-lg bg-amber-500/[0.07] px-3 py-2 text-[11.5px] leading-relaxed text-amber-100/70 ring-1 ring-amber-500/10">
                MVP note: research is simulated by the AI model and clearly labeled — no live web search.
              </p>
            </>
          )}

          {selectedNode.type === "ideaGenerator" && (
            <>
              <TextField
                label="Focus"
                value={(config.focus as string) ?? ""}
                onChange={(event) => patch({ focus: event.target.value })}
                placeholder="e.g. Content angles, video hooks"
              />
              <SliderField
                label="Idea count"
                value={Number(config.count ?? 4)}
                min={2}
                max={8}
                step={1}
                onChange={(value) => patch({ count: value })}
              />
            </>
          )}

          {selectedNode.type === "writer" && (
            <>
              <SelectField
                label="Content type"
                options={CONTENT_TYPES.map((value) => ({ value, label: value }))}
                value={(config.contentType as string) ?? "LinkedIn post"}
                onChange={(event) => patch({ contentType: event.target.value })}
              />
              <SelectField
                label="Tone"
                options={TONES.map((value) => ({ value, label: value }))}
                value={(config.tone as string) ?? "Professional"}
                onChange={(event) => patch({ tone: event.target.value })}
              />
              <SelectField
                label="Length"
                options={LENGTHS.map((value) => ({ value, label: value }))}
                value={(config.length as string) ?? "Medium"}
                onChange={(event) => patch({ length: event.target.value })}
              />
              <TextArea
                label="Instructions"
                value={(config.instructions as string) ?? ""}
                onChange={(event) => patch({ instructions: event.target.value })}
              />
            </>
          )}

          {selectedNode.type === "rewriter" && (
            <TextArea
              label="Instructions"
              value={(config.instructions as string) ?? ""}
              onChange={(event) => patch({ instructions: event.target.value })}
              placeholder="e.g. Make it more concise and direct."
            />
          )}

          {selectedNode.type === "qualityChecker" && (
            <SelectField
              label="Strictness"
              options={STRICTNESS_LEVELS.map((value) => ({ value, label: value }))}
              value={(config.strictness as string) ?? "Balanced"}
              onChange={(event) => patch({ strictness: event.target.value })}
            />
          )}

          {selectedNode.type === "output" && (
            <p className="text-[11.5px] leading-relaxed text-[var(--color-ink-2)]">
              All finished outputs collect here. Run the workflow to see the final result.
            </p>
          )}
        </div>

        {/* ------- label ------- */}
        <div className="border-t border-[var(--color-edge)] pt-3.5">
          <TextField
            label="Node label"
            value={(config.label as string) ?? def.label}
            onChange={(event) => patch({ label: event.target.value })}
          />
        </div>

        {/* ------- quality report ------- */}
        {isQualityChecker && data.result && (
          <div className="space-y-3 border-t border-[var(--color-edge)] pt-3.5">
            <QualityReport result={data.result} />
          </div>
        )}

        {/* ------- output ------- */}
        {hasOutput && !isOutput && (
          <div className="border-t border-[var(--color-edge)] pt-3.5">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                Stage output
              </p>
              <button
                onClick={() => setExpandedOutput((current) => !current)}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
              >
                {expandedOutput ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {expandedOutput ? "Collapse" : "Expand"}
              </button>
            </div>
            <OutputText
              text={outputText}
              onCopy={() => void copyText(outputText)}
              compact={!expandedOutput}
            />
          </div>
        )}

        {isOutput && (
          <div className="space-y-3 border-t border-[var(--color-edge)] pt-3.5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
                Final output
              </p>
              {hasOutput && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => void copyText(outputText, "Final output")}
                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-white/5"
                    title="Copy to clipboard"
                  >
                    <Copy className="size-3" />
                  </button>
                  <button
                    onClick={() => downloadText(outputText, "flowforge-output.txt", toast)}
                    className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-medium text-[var(--color-ink-2)] transition-colors hover:bg-white/5"
                    title="Download as .txt"
                  >
                    <Download className="size-3" />
                  </button>
                </div>
              )}
            </div>

            {hasOutput ? (
              <>
                <OutputText text={outputText} onCopy={() => void copyText(outputText, "Final output")} />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => void runWorkflow()}
                    disabled={isRunning}
                  >
                    <RefreshCw className="size-3.5" />
                    Regenerate
                  </Button>
                  <Button size="sm" variant="ghost" onClick={clearExecution}>
                    <Trash2 className="size-3.5" />
                    Clear
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center rounded-xl border border-dashed border-[var(--color-edge-strong)] px-4 py-7 text-center">
                <ArrowDownToLine className="mb-2 size-5 text-emerald-400/70" />
                <p className="text-[13px] font-medium text-[var(--color-ink)]">No result yet</p>
                <p className="mt-1 text-[11.5px] leading-relaxed text-[var(--color-ink-3)]">
                  Run the workflow to generate the final output here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this node?"
        description={`"${config.label || def.label}" and its connections will be removed from this workflow. This cannot be undone.`}
        confirmLabel="Delete node"
        destructive
        onConfirm={() => {
          deleteNode(selectedNode.id);
          setConfirmDelete(false);
        }}
        onCancel={() => setConfirmDelete(false)}
      />
    </aside>
  );
}

function downloadText(text: string, filename: string, toast: ReturnType<typeof useToast>) {
  try {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  } catch {
    toast.error("Download failed");
  }
}