"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Layers, Plus, FolderOpen, History } from "lucide-react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { WorkflowCard } from "@/components/dashboard/WorkflowCard";
import { TemplateGrid } from "@/components/dashboard/TemplateCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonTile } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import { TextField } from "@/components/ui/Form";
import {
  createFromTemplate,
  deleteWorkflow,
  ensureSeeded,
  loadAllWorkflows,
  renameWorkflow,
} from "@/lib/storage";
import type { WorkflowSnapshot } from "@/types/workflow";
import { useToast } from "@/components/ui/Toast";

export default function DashboardPage() {
  const router = useRouter();
  const toast = useToast();

  const [workflows, setWorkflows] = useState<WorkflowSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [renameTarget, setRenameTarget] = useState<WorkflowSnapshot | null>(null);
  const [renameText, setRenameText] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<WorkflowSnapshot | null>(null);
  const [deleting, setDeleting] = useState(false);

  const refresh = useCallback(() => {
    setWorkflows(loadAllWorkflows());
  }, []);

  useEffect(() => {
    ensureSeeded();
    refresh();
    setLoading(false);
  }, [refresh]);

  const openBuilder = useCallback(
    (id: string, autoRun = false) => {
      router.push(`/builder?id=${id}${autoRun ? "&run=1" : ""}`);
    },
    [router],
  );

  const applyTemplate = useCallback(
    (templateId: string) => {
      const snapshot = createFromTemplate(templateId);
      toast.success("Template ready", "Workflow opened in the builder.");
      openBuilder(snapshot.meta.id);
    },
    [openBuilder, toast],
  );

  const confirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    setDeleting(true);
    deleteWorkflow(deleteTarget.meta.id);
    refresh();
    setDeleting(false);
    setDeleteTarget(null);
    toast.success("Workflow deleted");
  }, [deleteTarget, refresh, toast]);

  const confirmRename = useCallback(() => {
    if (!renameTarget) return;
    const name = renameText.trim();
    if (!name) {
      toast.error("Name cannot be empty");
      return;
    }
    renameWorkflow(renameTarget.meta.id, name);
    refresh();
    setRenameTarget(null);
    toast.success("Workflow renamed");
  }, [renameTarget, renameText, refresh, toast]);

  const recents = [...workflows]
    .sort(
      (a, b) =>
        new Date(b.meta.updatedAt).getTime() - new Date(a.meta.updatedAt).getTime(),
    )
    .slice(0, 3);

  const sorted = [...workflows].sort(
    (a, b) =>
      new Date(b.meta.updatedAt).getTime() - new Date(a.meta.updatedAt).getTime(),
  );

  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        {/* header */}
        <div className="flex flex-wrap items-center justify-between gap-4 py-10">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">My Workflows</h1>
            <p className="mt-1.5 text-[14px] text-[var(--color-ink-2)]">
              Build, run, and iterate on AI pipelines — all saved locally.
            </p>
          </div>
          <Link href="/builder">
            <Button variant="primary" size="lg">
              <Plus className="size-4" />
              Create Workflow
            </Button>
          </Link>
        </div>

        {/* templates */}
        <section id="templates" className="mt-2">
          <div className="mb-4 flex items-center gap-2">
            <Layers className="size-4 text-[var(--color-ink-3)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">Starter Templates</h2>
          </div>
          <TemplateGrid onUse={(template) => applyTemplate(template.id)} />
        </section>

        {/* workflows */}
        <section className="mt-10">
          <div className="mb-4 flex items-center gap-2">
            <FolderOpen className="size-4 text-[var(--color-ink-3)]" />
            <h2 className="text-[15px] font-semibold tracking-tight">My Workflows</h2>
            {workflows.length > 0 && (
              <span className="font-mono text-[11px] text-[var(--color-ink-3)]">
                {workflows.length}
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <SkeletonTile key={index} />
              ))}
            </div>
          ) : workflows.length === 0 ? (
            <EmptyState
              icon={<Layers className="size-5" />}
              title="No workflows yet"
              description="Create your first workflow, or start from a template above."
              action={
                <Link href="/builder">
                  <Button variant="primary">
                    <Plus className="size-4" />
                    Create Workflow
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sorted.map((workflow) => (
                <WorkflowCard
                  key={workflow.meta.id}
                  workflow={workflow}
                  onRun={(item) => openBuilder(item.meta.id, true)}
                  onEdit={(item) => openBuilder(item.meta.id)}
                  onRename={(item) => {
                    setRenameTarget(item);
                    setRenameText(item.meta.name);
                  }}
                  onDelete={(item) => setDeleteTarget(item)}
                />
              ))}
            </div>
          )}
        </section>

        {/* recents */}
        {recents.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-center gap-2">
              <History className="size-4 text-[var(--color-ink-3)]" />
              <h2 className="text-[15px] font-semibold tracking-tight">Recently edited</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recents.map((workflow) => (
                <WorkflowCard
                  key={workflow.meta.id}
                  workflow={workflow}
                  compact
                  onRun={(item) => openBuilder(item.meta.id, true)}
                  onEdit={(item) => openBuilder(item.meta.id)}
                  onRename={(item) => {
                    setRenameTarget(item);
                    setRenameText(item.meta.name);
                  }}
                  onDelete={(item) => setDeleteTarget(item)}
                />
              ))}
              <Link
                href="/builder"
                className="group flex min-h-32 items-center justify-center rounded-2xl border border-dashed border-[var(--color-edge-strong)] bg-white/[0.015] text-[13px] text-[var(--color-ink-3)] transition-colors hover:border-indigo-400/40 hover:text-[var(--color-ink)]"
              >
                <span className="flex items-center gap-1.5">
                  <Plus className="size-4" />
                  New workflow
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </div>
          </section>
        )}
      </main>

      {/* rename dialog */}
      <Modal
        open={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        title="Rename workflow"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={confirmRename} disabled={!renameText.trim()}>
              Save name
            </Button>
          </>
        }
      >
        <TextField
          value={renameText}
          onChange={(event) => setRenameText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") confirmRename();
          }}
          autoFocus
          placeholder="Workflow name"
        />
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete this workflow?"
        description={
          <>
            <span className="font-medium text-[var(--color-ink)]">
              {deleteTarget?.meta.name}
            </span>{" "}
            will be permanently removed. This action cannot be undone.
          </>
        }
        confirmLabel="Delete workflow"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}