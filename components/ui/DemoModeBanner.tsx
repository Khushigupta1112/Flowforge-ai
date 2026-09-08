"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Radio } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface DemoModeContextValue {
  demoMode: boolean;
  checking: boolean;
  refresh: () => Promise<void>;
}

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState(false);
  const [checking, setChecking] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/demo-status", { cache: "no-store" });
      const data = (await response.json()) as { demoMode?: boolean };
      setDemoMode(Boolean(data.demoMode));
    } catch {
      setDemoMode(false);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({ demoMode, checking, refresh }),
    [demoMode, checking, refresh],
  );

  return (
    <DemoModeContext.Provider value={value}>{children}</DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeContextValue {
  const context = useContext(DemoModeContext);
  if (!context) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return context;
}

export function DemoModeBadge() {
  const { demoMode, checking } = useDemoMode();
  if (checking || !demoMode) return null;
  return (
    <Badge tone="warning" className="shrink-0">
      <Radio className="size-3" />
      Demo Mode
    </Badge>
  );
}