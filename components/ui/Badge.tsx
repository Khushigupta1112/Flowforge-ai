import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const tones: Record<Tone, string> = {
  neutral: "bg-white/[0.05] text-[var(--color-ink-2)] ring-white/10",
  success: "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20",
  warning: "bg-amber-500/10 text-amber-300 ring-amber-500/20",
  danger: "bg-rose-500/10 text-rose-300 ring-rose-500/20",
  info: "bg-sky-500/10 text-sky-300 ring-sky-500/20",
  accent: "bg-indigo-500/10 text-indigo-300 ring-indigo-500/20",
};

export interface BadgeProps {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}

export function Badge({ children, tone = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium ring-1",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}