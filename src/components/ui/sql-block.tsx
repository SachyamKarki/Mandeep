import type { ReactNode } from "react";

const KEYWORDS = new Set(
  `select from where join left right inner on and or not as group by order having limit with over partition
   insert into values update set delete case when then else end is null distinct asc desc exists in like
   union all between use create view replace table`
    .split(/\s+/)
    .filter(Boolean),
);

const FUNCTIONS = new Set(
  "count sum avg min max round coalesce date_format row_number rank group_concat concat".split(" "),
);

// comments | strings | numbers | words | anything else
const TOKEN = /(--[^\n]*)|('(?:[^']|'')*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_]*)|([\s\S])/g;

function highlight(sql: string): ReactNode[] {
  const out: ReactNode[] = [];
  let plain = "";
  const flush = () => {
    if (plain) out.push(plain);
    plain = "";
  };
  for (const [, comment, str, num, word, other] of sql.matchAll(TOKEN)) {
    let cls: string | null = null;
    let tok = other ?? "";
    if (comment) [cls, tok] = ["sql-comment", comment];
    else if (str) [cls, tok] = ["sql-string", str];
    else if (num) [cls, tok] = ["sql-number", num];
    else if (word) {
      tok = word;
      const lower = word.toLowerCase();
      if (KEYWORDS.has(lower)) cls = "sql-keyword";
      else if (FUNCTIONS.has(lower)) cls = "sql-function";
    }
    if (cls) {
      flush();
      out.push(
        <span key={out.length} className={cls}>
          {tok}
        </span>,
      );
    } else plain += tok;
  }
  flush();
  return out;
}

export function SqlBlock({ sql }: { sql: string }) {
  return (
    <pre className="overflow-x-auto rounded-lg bg-sidebar p-4 font-mono text-sm leading-relaxed text-slate-100">
      <code>{highlight(sql)}</code>
    </pre>
  );
}

/** Collapsible "View SQL" panel shown under a table. */
export function SqlPeek({ sql, label = "View SQL" }: { sql: string; label?: string }) {
  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent hover:text-ink">
        <svg viewBox="0 0 20 20" fill="currentColor" className="size-4 transition-transform group-open:rotate-90" aria-hidden>
          <path d="M7.2 4.2a.75.75 0 0 1 1.06 0l5.25 5.25a.75.75 0 0 1 0 1.06L8.26 15.8a.75.75 0 1 1-1.06-1.06L11.94 10 7.2 5.26a.75.75 0 0 1 0-1.06Z" />
        </svg>
        {label}
      </summary>
      <div className="mt-3">
        <SqlBlock sql={sql} />
      </div>
    </details>
  );
}
