"use client";

import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  width?: string;
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
  width = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[900] grid place-items-center p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full animate-scale-in rounded-2xl border border-[var(--color-edge)] bg-[#101319] shadow-2xl",
          width,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--color-edge)] px-5 py-4">
          <div>
            {title && (
              <h2 className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
                {title}
              </h2>
            )}
            {description && (
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
                {description}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink)]"
            aria-label="Close dialog"
          >
            <X className="size-4" />
          </button>
        </div>
        <div className="px-5 py-4">{children}</div>
        {footer && (
          <div className="flex justify-end gap-2 border-t border-[var(--color-edge)] px-5 py-3.5">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}