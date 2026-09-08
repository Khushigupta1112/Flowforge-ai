"use client";

import type { ReactNode, TextareaHTMLAttributes, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function labelClasses() {
  return "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-[var(--color-ink-3)]";
}

function fieldClasses() {
  return cn(
    "w-full rounded-lg border border-[var(--color-edge)] bg-[#0c0f15] px-3 py-2 text-[13px] text-[var(--color-ink)]",
    "placeholder:text-[var(--color-ink-3)] focus:border-indigo-500/60 focus:outline-none focus:ring-1 focus:ring-indigo-500/40",
    "transition-colors",
  );
}

export interface FieldGroupProps extends HTMLAttributes<HTMLDivElement> {
  label?: string;
  hint?: string;
  icon?: ReactNode;
  children: ReactNode;
}

export function FieldGroup({ label, hint, icon, children, className, ...props }: FieldGroupProps) {
  return (
    <div className={cn("space-y-1", className)} {...props}>
      {label && (
        <span className={cn(labelClasses(), "flex items-center gap-1.5")}>
          {icon}
          {label}
        </span>
      )}
      {children}
      {hint && <p className="text-[11px] leading-relaxed text-[var(--color-ink-3)]">{hint}</p>}
    </div>
  );
}

export interface TextFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
}

export function TextField({ label, hint, className, ...props }: TextFieldProps) {
  return (
    <FieldGroup label={label} hint={hint}>
      <input className={cn(fieldClasses(), className)} {...props} />
    </FieldGroup>
  );
}

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
}

export function TextArea({ label, hint, className, ...props }: TextAreaProps) {
  return (
    <FieldGroup label={label} hint={hint}>
      <textarea className={cn(fieldClasses(), "min-h-20 resize-y leading-relaxed", className)} {...props} />
    </FieldGroup>
  );
}

export interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export function SelectField({ label, hint, options, className, ...props }: SelectFieldProps) {
  return (
    <FieldGroup label={label} hint={hint}>
      <select className={cn(fieldClasses(), "cursor-pointer appearance-none bg-[#0c0f15]", className)} {...props}>
        {options.map((option) => (
          <option key={option.value} value={option.value} className="bg-[#12151c]">
            {option.label}
          </option>
        ))}
      </select>
    </FieldGroup>
  );
}

export interface SliderFieldProps {
  label?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  format?: (value: number) => string;
  hint?: string;
}

export function SliderField({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: SliderFieldProps) {
  return (
    <FieldGroup label={label} hint={hint}>
      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-1.5 flex-1 cursor-pointer appearance-none rounded-full bg-[var(--color-edge-strong)] accent-indigo-500"
          aria-label={label}
        />
        <span className="w-10 shrink-0 text-right font-mono text-xs text-[var(--color-ink-2)]">
          {format ? format(value) : value}
        </span>
      </div>
    </FieldGroup>
  );
}