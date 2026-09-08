<div align="center">

# FlowForge AI

**A visual AI workflow builder — compose AI nodes on a canvas, connect them into a pipeline, and run it step by step with live status.**

Built with Next.js 16 · React 19 · React Flow · Tailwind CSS v4 · Gemini

[Features](#features) · [Demo GIF](#) · [Getting Started](#getting-started) · [Architecture](#architecture) · [Deploy](#deploy-to-vercel) · [Roadmap](#roadmap)

</div>

---

## What is FlowForge?

Content teams lose hours copy-pasting between a **brief → idea → draft → edit → publish** flow. FlowForge turns that pipeline into a living diagram: drag AI nodes onto a canvas, connect them, and run the whole thing end-to-end. Tweak one prompt, rerun, compare — no scripts, no glue code. Each workflow is a repeatable asset you can run on a new topic tomorrow.

The MVP was built to prove two risky things on day one:

1. A **visual node model** that maps onto how people actually write content.
2. **Live, steerable execution** — you see what each stage produced and why.

Both work end-to-end **even offline**, thanks to a first-class **demo mode**.

---

## Features

| | |
|---|---|
| 🧩 **Visual canvas** | React Flow editor: drag-and-drop, pan/zoom, minimap, connectable handles. |
| 📦 **8 node types** | Input, AI Agent, Research, Idea Generator, Writer, Rewriter, Quality Checker, Output. |
| ⚙️ **Step-by-step execution** | Nodes run in dependency order; each node's output feeds its downstream nodes as context. Live pending → running → completed → failed status, per-node output previews, and a console-style execution log. |
| 🎛️ **Inspector panel** | Configure any node: model, temperature, prompts, tone, length, strictness, and more. |
| 🧠 **AI workflow generator** | Describe a workflow in plain words and get a fully wired-up workflow back. |
| 📄 **Templates** | LinkedIn post, blog writer, product description, YouTube script — pre-wired pipelines. |
| 🕹️ **Demo mode** | No API key required. Realistic mock outputs drive every feature. Demo-mode badges appear throughout. |
| 💾 **Persistence** | Workflows autosave to `localStorage` (name, nodes, positions, config) and are reloadable from the dashboard. |

---

## Tech Stack

- **Next.js 16** (App Router, Turbopack) + **TypeScript**
- **React 19** + **@xyflow/react 12** (React Flow fork) for the canvas
- **Tailwind CSS v4** (CSS-first config) + **lucide-react** icons
- **Google Gemini** via server route handlers
- **No database, no auth** — intentionally. See [Design decisions](#design-decisions).

---

## Getting Started

### Prerequisites

- **Node.js 18.18+** (built & tested on Node 24)
- **npm** (or pnpm/yarn)

### Install & run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The landing page pitches the product; the **Dashboard** lists templates and your saved workflows.

> **Windows / PowerShell note:** if `npm run dev` misbehaves, use `npm.cmd run dev`.

### Enable real AI (optional)

```bash
cp .env.example .env.local   # then edit and add your key
```

```env
GEMINI_API_KEY=your_key_here
```

Without a key, the app runs in **demo mode** with realistic mock responses. To get a free key: [Google AI Studio → Get API key](https://aistudio.google.com/apikey).

### Production build

```bash
npm run build
npm run start
```

---

## Architecture

```
app/
  page.tsx                  # landing page
  dashboard/page.tsx       # templates + saved workflows
  builder/page.tsx         # editor (?id=X&run=1 auto-runs)
  api/ai/                   # Gemini call (or mock) — server-only
  api/generate-workflow/    # AI workflow builder (or null) — server-only
  api/demo-status/          # whether demo mode is active
components/
  ui/                       # Button, Modal, Toast, Form, Badge, Skeleton, etc.
  workflow/                 # canvas, nodes, inspector, execution panel, library, context
  dashboard/ & landing/     # page sections
lib/
  node-definitions.ts       # node catalog + per-type config defaults
  workflow-engine.ts        # validation, topological ordering, execution runner
  ai.ts                     # AI calls + local fallback workflow generator
  templates.ts              # template builder + auto-layout
  storage.ts                # localStorage CRUD + seeding
  demo.ts                   # mock AI responses
types/workflow.ts           # shared types
```

### How execution works

1. `getExecutionOrder` topologically sorts nodes by their edges.
2. For each node, `buildNodeRequest` composes a prompt from the node's config **plus the text produced by every upstream node**.
3. `executeWorkflow` runs them in order through the AI (or demo fallback), writing outputs back to node state and appending to the execution log — all surfaced live on the canvas and in the panel.

---

## Design Decisions

- **No backend data layer.** Workflows persist in `localStorage` so the MVP runs anywhere with zero setup. Swapping in a database later touches only `lib/storage.ts`.
- **Server-only AI.** Gemini calls live in route handlers so API keys never reach the browser.
- **Demo mode is first-class.** Every AI endpoint degrades gracefully to mock output when the key is absent — the product is fully explorable with zero configuration.
- **Dependency-driven execution.** The engine sorts nodes, builds per-node prompts from upstream output, and runs them in order — a natural fit for chained content pipelines.

---

## Deploy to Vercel

1. Push this repo to GitHub (below).
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Framework preset: **Next.js** (auto-detected). No build overrides needed.
4. Add the env var `GEMINI_API_KEY` (optional — app works without it in demo mode).
5. **Deploy.** That's it.

---

## Roadmap

- [ ] Output diffing and per-workflow revision history
- [ ] Branching / conditionals and re-runnable sub-pipelines
- [ ] Cloud data layer + team workspaces & sharing (swap `lib/storage.ts`)
- [ ] Custom tools, external APIs, and deterministic (non-LLM) gate nodes

---

## License

MIT © [Khushi Gupta](https://github.com/Khushigupta1112)

> Note: This repo targets **Next.js 16**, which has breaking changes vs. earlier versions. See `node_modules/next/dist/docs/` for authoritative guidance. The `AGENTS.md` rules block is auto-managed by `next dev` (see `node_modules/next/dist/server/lib/generate-agent-files.js`) — commit it along with your work to keep the tree clean.
