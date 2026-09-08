import { cn } from "@/lib/utils";

export function cnHelper(...inputs: Array<string | false | null | undefined>) {
  return cn(...inputs);
}

export { cn as classNames } from "@/lib/utils";