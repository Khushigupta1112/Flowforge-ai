import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-[var(--color-edge-strong)] bg-white/[0.015] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-3 grid size-11 place-items-center rounded-xl bg-white/[0.04] text-[var(--color-ink-2)] ring-1 ring-white/10">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-[var(--color-ink)]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-[var(--color-ink-2)]">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}