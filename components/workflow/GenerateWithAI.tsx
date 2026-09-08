"use client";

import { useState } from "react";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useWorkflow } from "@/components/workflow/WorkflowContext";
import { generateWorkflowSmart } from "@/lib/ai";
import { useToast } from "@/components/ui/Toast";

const SUGGESTIONS = [
  "Create a workflow for writing LinkedIn posts about AI in agriculture",
  "Build a blog post generator that researches then writes",
  "Generate product descriptions that stand out in marketplaces",
  "Write a YouTube script workflow that starts with research",
];

export function GenerateWithAIModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { applyWorkflow } = useWorkflow();
  const toast = useToast();
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async (prompt?: string) => {
    const text = (prompt ?? description).trim();
    if (!text) {
      toast.error("Describe what you want to build first");
      return;
    }
    setLoading(true);
    try {
      const { workflow, source } = await generateWorkflowSmart(text);
      const name = applyWorkflow(workflow);
      toast.success(
        source === "ai" ? "Workflow generated with AI" : "Workflow built",
        source === "ai"
          ? "AI designed the pipeline — tweak it on the canvas."
          : "Generated locally (demo mode). Add GEMINI_API_KEY for AI-built workflows.",
      );
      onClose();
      void name;
    } catch (error) {
      toast.error(
        "Could not generate workflow",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title="Generate a workflow with AI"
      description="Describe the outcome you want. The AI designs the node pipeline for you — no drag-and-drop needed."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => void generate()}
            loading={loading}
            disabled={!description.trim() && !loading}
          >
            {!loading && <Wand2 className="size-4" />}
            Generate Workflow
          </Button>
        </>
      }
      width="max-w-xl"
    >
      <div className="space-y-3">
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
              void generate();
            }
          }}
          placeholder="e.g. Create a workflow for writing LinkedIn posts about AI in agriculture"
          autoFocus
          rows={3}
          className="w-full resize-none rounded-xl border border-[var(--color-edge)] bg-[#0c0f15] px-3.5 py-3 text-[14px] leading-relaxed text-[var(--color-ink)] placeholder:text-[var(--color-ink-3)] focus:border-indigo-500/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />

        <div>
          <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
            <Sparkles className="size-3" />
            Try one of these
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                disabled={loading}
                onClick={() => {
                  setDescription(suggestion);
                  void generate(suggestion);
                }}
                className="max-w-full truncate rounded-full border border-[var(--color-edge)] bg-white/[0.02] px-3 py-1.5 text-left text-[12px] text-[var(--color-ink-2)] transition-colors hover:border-indigo-400/40 hover:text-[var(--color-ink)] disabled:opacity-50"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--color-ink-3)]">
          {loading ? (
            <>
              <Loader2 className="size-3.5 animate-spin text-indigo-400" />
              Designing workflow…
            </>
          ) : (
            "Tip: press ⌘/Ctrl + Enter to generate."
          )}
        </p>
      </div>
    </Modal>
  );
}