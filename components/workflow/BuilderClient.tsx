"use client";

import "@xyflow/react/dist/style.css";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Play, Save, Square, Sparkles } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { NodeLibrary } from "@/components/workflow/NodeLibrary";
import { Inspector } from "@/components/workflow/Inspector";
import { ExecutionPanel } from "@/components/workflow/ExecutionPanel";
import { GenerateWithAIModal } from "@/components/workflow/GenerateWithAI";
import { useWorkflow } from "@/components/workflow/WorkflowContext";
import { DemoModeBadge } from "@/components/ui/DemoModeBanner";

export function BuilderClient() {
  const {
    workflowName,
    setWorkflowName,
    runWorkflow,
    stopWorkflow,
    isRunning,
    manualSave,
    saveStatus,
  } = useWorkflow();
  const [generateOpen, setGenerateOpen] = useState(false);

  const onRun = () => {
    if (isRunning) {
      stopWorkflow();
    } else {
      void runWorkflow();
    }
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-[var(--color-canvas)]">
      {/* ------------------------------ top bar ------------------------------ */}
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--color-edge)] bg-[#0c0e12] px-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[var(--color-ink-3)] transition-colors hover:bg-white/[0.04] hover:text-[var(--color-ink)]"
          title="Back to dashboard"
        >
          <ArrowLeft className="size-4" />
          <Logo showText={false} size={22} />
        </Link>

        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={workflowName}
            onChange={(event) => setWorkflowName(event.target.value)}
            onBlur={() => manualSave()}
            spellCheck={false}
            aria-label="Workflow name"
            className="w-56 min-w-0 truncate rounded-lg border border-transparent bg-transparent px-2 py-1 text-[14px] font-semibold tracking-tight text-[var(--color-ink)] transition-colors hover:border-[var(--color-edge)] focus:border-indigo-500/50 focus:bg-[#0f1217] focus:outline-none"
          />
          {saveStatus === "saved" ? (
            <span className="hidden items-center gap-1 font-mono text-[11px] text-[var(--color-ink-3)] sm:flex">
              <Check className="size-3 text-emerald-400" />
              Saved
            </span>
          ) : (
            <span className="hidden font-mono text-[11px] text-[var(--color-ink-3)] sm:block">Draft</span>
          )}
          <DemoModeBadge />
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button size="sm" variant="ghost" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="size-3.5 text-indigo-300" />
            Generate with AI
          </Button>
          <Button size="sm" variant="secondary" onClick={manualSave} title="Save workflow">
            <Save className="size-3.5" />
            Save
          </Button>
          <Button size="sm" variant="primary" onClick={onRun} loading={false} title={isRunning ? "Stop execution" : "Run workflow"}>
            {isRunning ? (
              <>
                <Square className="size-3.5" />
                Stop
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Run Workflow
              </>
            )}
          </Button>
        </div>
      </header>

      {/* ------------------------------ workspace ----------------------------- */}
      <div className="flex min-h-0 flex-1">
        <NodeLibrary onGenerateWithAI={() => setGenerateOpen(true)} />

        <main className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            <WorkflowCanvas />
          </div>
          <ExecutionPanel />
        </main>

        <Inspector />
      </div>

      <GenerateWithAIModal open={generateOpen} onClose={() => setGenerateOpen(false)} />
    </div>
  );
}