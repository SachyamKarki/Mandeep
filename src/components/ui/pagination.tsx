import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { buttonClass, secondaryButtonClass } from "@/components/ui";

export const PAGE_SIZE = 10;

type Params = Record<string, string | string[] | undefined>;

/** Reads a 1-based page number from the query string, clamped to the pages that exist. */
export function pageFrom(params: Params, total: number, param = "page", size = PAGE_SIZE) {
  const raw = params[param];
  const n = Number(Array.isArray(raw) ? raw[0] : raw);
  const pages = Math.max(1, Math.ceil(total / size));
  return Math.min(Math.max(Number.isInteger(n) ? n : 1, 1), pages);
}

/** The rows for one page, plus the page that was actually used. */
export function paginate<T>(rows: T[], params: Params, param = "page", size = PAGE_SIZE) {
  const page = pageFrom(params, rows.length, param, size);
  return { page, rows: rows.slice((page - 1) * size, page * size) };
}

/** Page numbers to show: first, last, and the current page with its neighbours. */
function pageList(page: number, pages: number): (number | "…")[] {
  const keep = new Set([1, pages, page - 1, page, page + 1].filter((p) => p >= 1 && p <= pages));
  const out: (number | "…")[] = [];
  [...keep]
    .sort((a, b) => a - b)
    .forEach((p, i, all) => {
      if (i > 0 && p - all[i - 1] > 1) out.push("…");
      out.push(p);
    });
  return out;
}

const pageBtn = "h-8 min-w-8 px-2.5";

/**
 * "Showing 11–20 of 30" with Previous / page numbers / Next. Keeps the other
 * query-string values (search, filters) and can jump back to a section with `hash`.
 */
export function Pagination({
  total,
  page,
  params,
  basePath,
  param = "page",
  size = PAGE_SIZE,
  hash,
}: {
  total: number;
  page: number;
  params: Params;
  basePath: string;
  param?: string;
  size?: number;
  hash?: string;
}) {
  const pages = Math.ceil(total / size);
  if (pages <= 1) return null;

  const href = (p: number) => {
    const q = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      const value = Array.isArray(v) ? v[0] : v;
      if (value && k !== param) q.set(k, value);
    }
    if (p > 1) q.set(param, String(p));
    const qs = q.toString();
    return `${basePath}${qs ? `?${qs}` : ""}${hash ? `#${hash}` : ""}`;
  };

  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, total);

  return (
    <nav
      aria-label="Pagination"
      className="-mx-4 -mb-4 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3"
    >
      <p className="text-sm text-muted">
        Showing <span className="font-semibold text-ink">{from}</span>–<span className="font-semibold text-ink">{to}</span> of{" "}
        <span className="font-semibold text-ink">{total}</span>
      </p>
      <div className="flex items-center gap-1">
        {page > 1 ? (
          <Link href={href(page - 1)} className={cn(secondaryButtonClass, pageBtn)} aria-label="Previous page" scroll={!hash}>
            <ChevronLeft size={16} />
          </Link>
        ) : (
          <span className={cn(secondaryButtonClass, pageBtn, "pointer-events-none opacity-40")} aria-hidden>
            <ChevronLeft size={16} />
          </span>
        )}
        {pageList(page, pages).map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="px-1 text-sm text-faint">
              …
            </span>
          ) : (
            <Link
              key={p}
              href={href(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(p === page ? buttonClass : secondaryButtonClass, pageBtn)}
              scroll={!hash}
            >
              {p}
            </Link>
          ),
        )}
        {page < pages ? (
          <Link href={href(page + 1)} className={cn(secondaryButtonClass, pageBtn)} aria-label="Next page" scroll={!hash}>
            <ChevronRight size={16} />
          </Link>
        ) : (
          <span className={cn(secondaryButtonClass, pageBtn, "pointer-events-none opacity-40")} aria-hidden>
            <ChevronRight size={16} />
          </span>
        )}
      </div>
    </nav>
  );
}
