import type { Metadata } from "next";
import { Database, KeyRound, Table2 } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SqlBlock, SqlPeek } from "@/components/sql-block";
import { Card, EmptyState, PageHeader, panelClass } from "@/components/ui";
import { query, runReport } from "@/lib/db";
import { npr } from "@/lib/format";
import { loadShowcaseQueries } from "@/lib/showcase";

export const metadata: Metadata = { title: "SQL Showcase" };

const SCHEMA_SQL = `SELECT c.TABLE_NAME, c.COLUMN_NAME, c.COLUMN_TYPE, c.IS_NULLABLE, c.COLUMN_KEY,
       k.REFERENCED_TABLE_NAME
FROM information_schema.COLUMNS c
LEFT JOIN information_schema.KEY_COLUMN_USAGE k
  ON  k.TABLE_SCHEMA = c.TABLE_SCHEMA
  AND k.TABLE_NAME   = c.TABLE_NAME
  AND k.COLUMN_NAME  = c.COLUMN_NAME
  AND k.REFERENCED_TABLE_NAME IS NOT NULL
WHERE c.TABLE_SCHEMA = DATABASE()
  AND c.TABLE_NAME IN ('insurer', 'client', 'surveyor', 'claim', 'site_visit', 'invoice')
ORDER BY FIELD(c.TABLE_NAME, 'insurer', 'client', 'surveyor', 'claim', 'site_visit', 'invoice'),
         c.ORDINAL_POSITION`;

type SchemaColumn = {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: "YES" | "NO";
  COLUMN_KEY: string;
  REFERENCED_TABLE_NAME: string | null;
};

const MONEY_COLUMN = /amount|fee|paid|balance|claimed|outstanding|billed|collected|value/;

function formatCell(key: string, value: unknown) {
  if (value == null) return <span className="text-faint">NULL</span>;
  if (typeof value === "number" && MONEY_COLUMN.test(key) && !key.endsWith("_pct")) return npr(value);
  if (key.endsWith("_pct")) return `${value}%`;
  return String(value);
}

async function runTimed(sql: string) {
  const start = performance.now();
  try {
    const rows = await runReport(sql);
    return { rows, ms: performance.now() - start, error: null };
  } catch (err) {
    return { rows: [], ms: 0, error: (err as Error).message };
  }
}

export default async function SqlShowcasePage() {
  const queries = loadShowcaseQueries();
  const [schema, ...results] = await Promise.all([
    query<SchemaColumn>(SCHEMA_SQL),
    ...queries.map((q) => runTimed(q.sql)),
  ]);

  const tables = Object.entries(Object.groupBy(schema, (c) => c.TABLE_NAME)) as [string, SchemaColumn[]][];

  return (
    <>
      <PageHeader
        eyebrow="MySQL 8"
        title="SQL Showcase"
        description="Each report below is a query from database/05_queries.sql, run live against the database every time this page loads."
      />

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <nav className="hidden lg:block">
          <div className={`${panelClass} sticky top-6 p-2`}>
            <p className="px-2 pt-1 pb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase">Queries</p>
            <a href="#schema" className="block rounded-sm px-2 py-1.5 text-sm text-ink-soft hover:bg-subtle hover:text-ink">
              Schema
            </a>
            {queries.map((q, i) => (
              <a
                key={q.slug}
                href={`#${q.slug}`}
                className="block rounded-sm px-2 py-1.5 text-sm text-ink-soft hover:bg-subtle hover:text-ink"
              >
                <span className="mr-1.5 text-faint tabular-nums">{i + 1}.</span>
                {q.title}
              </a>
            ))}
          </div>
        </nav>

        <div className="min-w-0 space-y-6">
          <Card
            icon={Database}
            title="Schema"
            description="Six tables, read from information_schema. Matches the ER diagram."
          >
            <div id="schema" className="grid scroll-mt-6 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {tables.map(([table, cols]) => (
                <div key={table} className="overflow-hidden rounded-sm border border-border">
                  <div className="flex items-center gap-2 bg-sidebar px-3 py-2 text-sm font-semibold text-white uppercase">
                    <Table2 size={15} strokeWidth={1.8} />
                    {table}
                  </div>
                  <ul className="divide-y divide-border text-sm">
                    {cols.map((c) => (
                      <li key={c.COLUMN_NAME} className="flex items-center gap-2 px-3 py-1.5">
                        <span className="w-6 shrink-0 text-xs font-bold">
                          {c.COLUMN_KEY === "PRI" ? (
                            <span className="text-warn">PK</span>
                          ) : c.REFERENCED_TABLE_NAME ? (
                            <span className="text-accent">FK</span>
                          ) : null}
                        </span>
                        <span className={c.COLUMN_KEY === "PRI" ? "font-semibold text-ink" : "text-ink-soft"}>
                          {c.COLUMN_NAME}
                        </span>
                        <span className="ml-auto truncate font-mono text-xs text-faint">{c.COLUMN_TYPE}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
              <KeyRound size={13} /> PK = primary key · FK = foreign key
            </p>
            <SqlPeek sql={SCHEMA_SQL} label="View information_schema query" />
          </Card>

          {queries.map((q, i) => {
            const { rows, ms, error } = results[i];
            const columns = rows[0] ? Object.keys(rows[0]) : [];
            return (
              <section key={q.slug} id={q.slug} className={`${panelClass} scroll-mt-6`}>
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-base font-bold tracking-tight text-ink">
                    <span className="mr-2 text-faint tabular-nums">{i + 1}.</span>
                    {q.title}
                  </h2>
                  <p className="mt-0.5 text-sm text-muted">{q.about}</p>
                </div>
                <div className="space-y-4 p-4">
                  <SqlBlock sql={q.sql} />
                  {error ? (
                    <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger">
                      {error}
                    </p>
                  ) : rows.length === 0 ? (
                    <EmptyState>No rows returned. For this check, that is the result you want.</EmptyState>
                  ) : (
                    <div className="overflow-hidden rounded-sm border border-border pt-4">
                      <div className="px-4">
                        <DataTable
                          rows={rows.map((r, idx) => ({ ...r, __key: idx }))}
                          rowKey={(r) => r.__key}
                          columns={columns.map((key) => ({
                            header: key,
                            cell: (r: Record<string, unknown>) => formatCell(key, r[key]),
                            align: typeof rows[0][key] === "number" ? ("right" as const) : ("left" as const),
                          }))}
                        />
                      </div>
                    </div>
                  )}
                  {!error && (
                    <p className="text-xs text-muted">
                      {rows.length} {rows.length === 1 ? "row" : "rows"} · {ms.toFixed(1)} ms
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
