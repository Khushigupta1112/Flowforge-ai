"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertTriangle, CheckCircle2, Info, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info" | "warning";

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  message?: string;
}

interface ToastContextValue {
  push: (kind: ToastKind, title: string, message?: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastKind, ReactNode> = {
  success: <CheckCircle2 className="size-4.5 text-emerald-400" />,
  error: <AlertTriangle className="size-4.5 text-rose-400" />,
  warning: <Zap className="size-4.5 text-amber-400" />,
  info: <Info className="size-4.5 text-sky-400" />,
};

const RING: Record<ToastKind, string> = {
  success: "ring-emerald-400/20",
  error: "ring-rose-400/25",
  warning: "ring-amber-400/20",
  info: "ring-sky-400/20",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counter = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (kind: ToastKind, title: string, message?: string) => {
      const id = ++counter.current;
      setToasts((current) => [...current.slice(-3), { id, kind, title, message }]);
      window.setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4200);
    },
    [dismiss],
  );

  const value = useMemo<ToastContextValue>(
    () => ({
      push,
      success: (title, message) => push("success", title, message),
      error: (title, message) => push("error", title, message),
      info: (title, message) => push("info", title, message),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[999] flex w-80 flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={cn(
              "pointer-events-auto animate-slide-up rounded-xl border border-[var(--color-edge)] bg-[#12151c]/95 backdrop-blur px-3.5 py-3 shadow-2xl ring-1",
              RING[toast.kind],
            )}
          >
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 shrink-0">{ICONS[toast.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-[var(--color-ink)]">
                  {toast.title}
                </p>
                {toast.message && (
                  <p className="mt-0.5 text-xs leading-relaxed text-[var(--color-ink-2)]">
                    {toast.message}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismiss(toast.id)}
                className="shrink-0 rounded-md p-1 text-[var(--color-ink-3)] transition-colors hover:bg-white/5 hover:text-[var(--color-ink)]"
                aria-label="Dismiss notification"
              >
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}