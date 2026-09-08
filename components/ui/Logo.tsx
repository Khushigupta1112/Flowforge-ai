import { cn } from "@/lib/utils";

export interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: number;
}

export function Logo({ className, showText = true, size = 28 }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5 select-none", className)}>
      <div
        className="relative grid place-items-center rounded-[10px] bg-gradient-to-br from-indigo-500/20 to-violet-500/20 ring-1 ring-indigo-400/30"
        style={{ width: size, height: size }}
        aria-hidden
      >
        {/* three-node flow glyph */}
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
          <path
            d="M4 9.5L10 12.5M14 6.5L9 10.5M14 6.5l-4 3.5M10 12.5l5.5 4"
            stroke="url(#fflg)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <circle cx="4" cy="9.5" r="2.4" fill="#818cf8" />
          <circle cx="14" cy="6.5" r="2.4" fill="#a78bfa" />
          <circle cx="10" cy="12.5" r="2.4" fill="#818cf8" />
          <circle cx="18.5" cy="16.5" r="2.4" fill="#a78bfa" />
          <defs>
            <linearGradient id="fflg" x1="4" y1="6.5" x2="20" y2="16.5" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a5b4fc" />
              <stop offset="1" stopColor="#c4b5fd" />
            </linearGradient>
          </defs>
        </svg>
      </div>
      {showText && (
        <span className="text-[15px] font-semibold tracking-tight text-[var(--color-ink)]">
          FlowForge<span className="text-indigo-400"> AI</span>
        </span>
      )}
    </div>
  );
}