import { forwardRef, type ButtonHTMLAttributes } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
type Size = "xs" | "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  active?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-indigo-500 text-white hover:bg-indigo-400 disabled:hover:bg-indigo-500 shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_8px_20px_-10px_rgba(99,102,241,0.55)]",
  secondary:
    "bg-[var(--color-panel-3)] text-[var(--color-ink)] hover:bg-[#232a3c] border border-[var(--color-edge)]",
  ghost: "text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:bg-white/[0.04]",
  danger:
    "bg-rose-500/90 text-white hover:bg-rose-500",
  outline:
    "border border-[var(--color-edge-strong)] text-[var(--color-ink-2)] hover:text-[var(--color-ink)] hover:border-white/20 hover:bg-white/[0.03]",
};

const sizeClasses: Record<Size, string> = {
  xs: "h-7 px-2.5 text-xs rounded-lg gap-1.5",
  sm: "h-8 px-3 text-[13px] rounded-lg gap-1.5",
  md: "h-9 px-4 text-sm rounded-lg gap-2",
  lg: "h-11 px-5 text-[15px] rounded-xl gap-2",
  icon: "h-8 w-8 rounded-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "secondary",
      size = "md",
      loading = false,
      active = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
          "disabled:cursor-not-allowed disabled:opacity-45 select-none whitespace-nowrap",
          variantClasses[variant],
          sizeClasses[size],
          active && "ring-1 ring-indigo-400/50 text-[var(--color-ink)]",
          className,
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";