"use client";

import { memo } from "react";
import { ArrowRight } from "lucide-react";
import { WORKFLOW_TEMPLATES } from "@/lib/templates";
import type { WorkflowTemplate } from "@/lib/templates";
import { Button } from "@/components/ui/Button";

function TemplateCardImpl({
  template,
  onUse,
}: {
  template: WorkflowTemplate;
  onUse: (template: WorkflowTemplate) => void;
}) {
  return (
    <div className="group relative flex flex-col rounded-2xl border border-[var(--color-edge)] bg-[var(--color-panel)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-edge-strong)]">
      <div
        className="mb-3 grid size-10 place-items-center rounded-xl ring-1 ring-white/10"
        style={{ backgroundColor: `${template.accent}14`, color: template.accent }}
      >
        <template.icon className="size-5" />
      </div>
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[var(--color-ink-3)]">
        {template.category}
      </p>
      <h3 className="mt-1 text-[15px] font-semibold leading-snug text-[var(--color-ink)]">
        {template.name}
      </h3>
      <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-[var(--color-ink-2)]">
        {template.description}
      </p>
      <div className="mt-4">
        <Button
          size="sm"
          variant="outline"
          className="w-full group-hover:border-indigo-400/40 group-hover:text-[var(--color-ink)]"
          onClick={() => onUse(template)}
        >
          Use Template
          <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  );
}

export const TemplateCard = memo(TemplateCardImpl);

export function TemplateGrid({ onUse }: { onUse: (template: WorkflowTemplate) => void }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {WORKFLOW_TEMPLATES.map((template) => (
        <TemplateCard key={template.id} template={template} onUse={onUse} />
      ))}
    </div>
  );
}