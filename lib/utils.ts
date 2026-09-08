export type ClassValue = string | false | null | undefined;

export function cn(...inputs: ClassValue[]): string {
  return inputs.filter(Boolean).join(" ");
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${Math.max(1, Math.round(ms))}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export function truncate(text: string, max = 80, ellipsis = "..."): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max).trimEnd()}${ellipsis}`;
}

export function titleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

/**
 * Reduce any piece of clean content to a short, quotable subject line.
 * Used ONLY to make generated demo content read naturally (topic references) —
 * it is never used to assemble prompts or to sanitize model output.
 */
export function deriveSubject(content: string): string {
  const lines = String(content ?? "")
    .split(/\r?\n/)
    .map((line) =>
      line
        .trim()
        .replace(/^[*•\-–—]\s+/, "")
        .replace(/^\d+[.)]\s*/, ""),
    )
    .filter(Boolean);

  let subject = lines[0]?.replace(/^"|"$/g, "").trim() || "";
  if (!subject) return "this topic";

  subject = subject.replace(/[.!?…]+$/, "").trim();
  if (subject.length > 96) subject = `${subject.slice(0, 93).trimEnd()}...`;
  return subject || "this topic";
}