import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { DemoModeProvider } from "@/components/ui/DemoModeBanner";

export const metadata: Metadata = {
  title: {
    default: "FlowForge AI — Build AI workflows visually",
    template: "%s — FlowForge AI",
  },
  description:
    "FlowForge AI lets you connect AI agents into visual workflows: input, research, ideation, writing, and quality review — all in one canvas.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Crect width='24' height='24' rx='6' fill='%230e1116'/%3E%3Ccircle cx='7' cy='10' r='2' fill='%23818cf8'/%3E%3Ccircle cx='13' cy='7' r='2' fill='%23a78bfa'/%3E%3Ccircle cx='11' cy='14' r='2' fill='%23818cf8'/%3E%3Cpath d='M7 10l4 4m2-7l-2 3' stroke='%23a5b4fc' stroke-width='1.5'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#090b0f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-dvh bg-[var(--color-canvas)] text-[var(--color-ink)] antialiased">
        <DemoModeProvider>
          <ToastProvider>{children}</ToastProvider>
        </DemoModeProvider>
      </body>
    </html>
  );
}