"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Radio } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useDemoMode } from "@/components/ui/DemoModeBanner";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  const pathname = usePathname();
  const { demoMode } = useDemoMode();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-edge)] bg-[var(--color-canvas)]/85 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="transition-opacity hover:opacity-80">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-medium transition-colors",
                    active
                      ? "bg-white/[0.05] text-[var(--color-ink)]"
                      : "text-[var(--color-ink-2)] hover:text-[var(--color-ink)]",
                  )}
                >
                  <item.icon className="size-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2.5">
          {demoMode && (
            <Badge tone="warning" className="hidden sm:inline-flex">
              <Radio className="size-3" />
              Demo Mode
            </Badge>
          )}
          <Link href="/builder">
            <Button size="sm" variant="primary">
              New Workflow
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}