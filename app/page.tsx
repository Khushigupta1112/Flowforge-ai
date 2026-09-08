import Link from "next/link";
import {
  ArrowRight,
  Blocks,
  Gauge,
  LayoutGrid,
  ShieldCheck,
  Sparkles,
  Workflow,
  PenLine,
  Mic,
  ShoppingBag,
  BookOpenText,
} from "lucide-react";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { WorkflowPreview } from "@/components/landing/WorkflowPreview";
import { Badge } from "@/components/ui/Badge";

const FEATURES = [
  {
    icon: Workflow,
    title: "Visual workflow builder",
    body: "Drag AI agents onto a canvas, connect them with edges, and watch data flow from input to output — no code required.",
  },
  {
    icon: Sparkles,
    title: "Generate workflows with AI",
    body: "Describe what you want — “a LinkedIn post about AI in agriculture” — and FlowForge designs the node pipeline for you.",
  },
  {
    icon: Gauge,
    title: "Step-by-step execution",
    body: "Every node runs in order, passing its result to the next. Watch each stage light up in real time with live logs.",
  },
  {
    icon: ShieldCheck,
    title: "Quality-gated output",
    body: "End pipelines with a quality checker that scores grammar, clarity, and engagement — and returns an improved version.",
  },
];

const TEMPLATES = [
  { icon: PenLine, name: "LinkedIn Post Generator", accent: "#38bdf8" },
  { icon: BookOpenText, name: "Blog Writer", accent: "#34d399" },
  { icon: ShoppingBag, name: "Product Descriptions", accent: "#a78bfa" },
  { icon: Mic, name: "YouTube Scripts", accent: "#fb7185" },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-[var(--color-canvas)]">
      <SiteHeader />

      <main>
        {/* ------------------------------ hero ------------------------------ */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[540px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(99,102,241,0.16),transparent)]"
          />
          <div className="relative mx-auto max-w-5xl px-4 pb-20 pt-20 text-center sm:px-6">
            <Badge tone="accent" className="mb-6">
              <Sparkles className="size-3" />
              Visual AI workflow builder
            </Badge>
            <h1 className="text-balance text-5xl font-bold tracking-tight sm:text-6xl">
              Build{" "}
              <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-indigo-200 bg-clip-text text-transparent">
                AI workflows
              </span>{" "}
              visually.
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-pretty text-lg leading-relaxed text-[var(--color-ink-2)]">
              Connect AI agents, automate repetitive tasks, and turn ideas into
              working workflows — without writing a single line of code.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/builder">
                <button className="inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-5 font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition-all hover:bg-indigo-400">
                  Start Building
                  <ArrowRight className="size-4" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--color-edge-strong)] bg-white/[0.02] px-5 font-medium text-[var(--color-ink-2)] transition-all hover:border-white/20 hover:bg-white/[0.04] hover:text-[var(--color-ink)]">
                  <LayoutGrid className="size-4" />
                  Explore Templates
                </button>
              </Link>
            </div>
            <div className="mx-auto mt-14 max-w-3xl">
              <WorkflowPreview />
            </div>
          </div>
        </section>

        {/* ---------------------------- features --------------------------- */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Everything you need to ship with AI
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-2)]">
              FlowForge gives you a real execution engine — not just a diagram
              editor. Build once, run it forever.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5 transition-all hover:border-[var(--color-edge-strong)] hover:bg-[var(--color-panel-2)]"
              >
                <div className="mb-4 grid size-10 place-items-center rounded-xl bg-indigo-500/10 text-indigo-300 ring-1 ring-indigo-500/20 transition-transform group-hover:scale-105">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-[15px] font-semibold text-[var(--color-ink)]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--color-ink-2)]">
                  {feature.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ---------------------------- templates --------------------------- */}
        <section className="border-t border-[var(--color-edge)] bg-[#0b0d11]">
          <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
            <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Start from a proven template
                </h2>
                <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-[var(--color-ink-2)]">
                  Four production-shaped workflows, ready to run the moment you
                  open them.
                </p>
              </div>
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
              >
                View all templates
                <ArrowRight className="size-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {TEMPLATES.map((template) => (
                <Link key={template.name} href="/dashboard">
                  <div className="rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-edge-strong)]">
                    <div
                      className="mb-3 grid size-10 place-items-center rounded-xl ring-1 ring-white/10"
                      style={{ backgroundColor: `${template.accent}14`, color: template.accent }}
                    >
                      <template.icon className="size-5" />
                    </div>
                    <h3 className="text-[14.5px] font-semibold text-[var(--color-ink)]">
                      {template.name}
                    </h3>
                    <p className="mt-1.5 flex items-center gap-1 text-[12px] text-[var(--color-ink-3)]">
                      <Blocks className="size-3" />
                      Gates quality on every run
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ------------------------------- CTA ------------------------------- */}
        <section className="mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Your next workflow is one sentence away.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] leading-relaxed text-[var(--color-ink-2)]">
            Open the builder, describe the outcome you want, and let the AI wire
            up the pipeline for you.
          </p>
          <Link href="/builder">
            <button className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-indigo-500 px-6 font-medium text-white shadow-[0_8px_24px_-8px_rgba(99,102,241,0.6)] transition-all hover:bg-indigo-400">
              Open the Builder
              <ArrowRight className="size-4" />
            </button>
          </Link>
        </section>
      </main>

      <footer className="border-t border-[var(--color-edge)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
          <p className="text-[13px] text-[var(--color-ink-3)]">
            FlowForge AI — build AI workflows visually.
          </p>
          <p className="text-[12px] text-[var(--color-ink-3)]">
            Runs locally, no account required.
          </p>
        </div>
      </footer>
    </div>
  );
}