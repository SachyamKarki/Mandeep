"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";
import { Loader2, Search, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass } from "./core";

const control =
  "h-9 rounded-sm border border-border bg-surface text-sm text-ink outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-subtle";

/** How long to wait after the last keystroke before searching. */
const TYPING_DELAY_MS = 350;

export type ToolbarFilter = {
  name: string;
  /** Read by screen readers; the first option ("All …") acts as the visible label. */
  label: string;
  options: { value: string; label: string }[];
};

/**
 * Search box and filters at the top of a table card.
 * - Results update as you type (after a short pause), on Enter, or when a filter changes.
 * - The current list stays on screen while the new results load (no skeleton flash),
 *   and the search box keeps its focus.
 * - Empty fields are left out of the URL, and every search starts at page 1.
 * - Without JavaScript it is still a normal GET form.
 */
export function TableToolbar({
  basePath,
  search,
  filters = [],
  values,
  keep = {},
}: {
  basePath: string;
  search?: { name: string; placeholder: string };
  filters?: ToolbarFilter[];
  /** Current values from the URL, so the controls show what is applied. */
  values: Record<string, string | undefined>;
  /** Other query values to carry along, such as the selected tab. */
  keep?: Record<string, string>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [pending, startTransition] = useTransition();

  const active = [search?.name, ...filters.map((f) => f.name)].some((n) => n && values[n]);
  const clearHref = Object.keys(keep).length ? `${basePath}?${new URLSearchParams(keep)}` : basePath;

  useEffect(() => () => clearTimeout(timer.current), []);

  function apply() {
    clearTimeout(timer.current);
    const form = formRef.current;
    if (!form) return;
    const params = new URLSearchParams();
    for (const [key, value] of new FormData(form)) {
      const text = String(value).trim();
      if (text) params.set(key, text);
    }
    const qs = params.toString();
    const href = `${basePath}${qs ? `?${qs}` : ""}`;
    // A transition keeps the current page visible until the new results are ready.
    startTransition(() => router.replace(href, { scroll: false }));
  }

  return (
    <form
      ref={formRef}
      action={basePath}
      onSubmit={(e) => {
        e.preventDefault();
        apply();
      }}
      className="-mx-4 -mt-4 mb-4 flex flex-wrap items-center gap-2 border-b border-border bg-canvas/60 px-4 py-3"
    >
      {Object.entries(keep).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {search && (
        <div className="relative min-w-0 flex-1 basis-56">
          {pending ? (
            <Loader2 size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 animate-spin text-faint" />
          ) : (
            <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-faint" />
          )}
          <input
            type="search"
            name={search.name}
            defaultValue={values[search.name] ?? ""}
            placeholder={search.placeholder}
            aria-label={search.placeholder}
            maxLength={60}
            autoComplete="off"
            onChange={() => {
              clearTimeout(timer.current);
              timer.current = setTimeout(apply, TYPING_DELAY_MS);
            }}
            className={cn(control, "w-full pr-3 pl-9")}
          />
        </div>
      )}

      {filters.map((f) => (
        <select
          key={f.name}
          name={f.name}
          aria-label={f.label}
          defaultValue={values[f.name] ?? ""}
          onChange={apply}
          className={cn(control, "min-w-0 flex-none cursor-pointer px-3 sm:min-w-40")}
        >
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      ))}

      {search && (
        <button type="submit" className={buttonClass}>
          Search
        </button>
      )}
      {active && (
        <Link
          href={clearHref}
          replace
          scroll={false}
          onClick={() => formRef.current?.reset()}
          className="inline-flex h-9 items-center gap-1 px-2 text-sm font-semibold text-muted hover:text-ink"
        >
          <X size={15} /> Clear
        </Link>
      )}
      {/* Announces result updates to screen readers while loading. */}
      <span className="sr-only" aria-live="polite">
        {pending ? "Loading results" : ""}
      </span>
    </form>
  );
}
