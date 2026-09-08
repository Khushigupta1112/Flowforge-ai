"use client";

import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      width="max-w-md"
      title={title}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={destructive ? "danger" : "primary"}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        {destructive && (
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-rose-500/10 text-rose-400 ring-1 ring-rose-500/20">
            <TriangleAlert className="size-4.5" />
          </div>
        )}
        <div className="text-[13px] leading-relaxed text-[var(--color-ink-2)]">
          {description}
        </div>
      </div>
    </Modal>
  );
}