import type { Metadata } from "next";
import { Database, History, KeyRound, LayoutDashboard, ShieldCheck, Table2 } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { SqlBlock, SqlPeek } from "@/components/ui/sql-block";
import { Card, EmptyState, PageHeader, panelClass } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { query, runReport } from "@/lib/db";
import { npr } from "@/lib/format";
import {
  CLAIM_BY_ID_SQL,
  CLAIM_HISTORY_SQL,
  CLIENTS_SQL,
  DASHBOARD_STATS_SQL,
  INSURERS_SQL,
  INVOICES_SQL,
  LOSS_TYPE_SUMMARY_SQL,
  OPEN_CLAIMS_SQL,
  SURVEYORS_SQL,
  UNPAID_INVOICES_SQL,
  USERS_SQL,
  VISITS_FOR_CLAIM_SQL,
  auditLogSql,
  claimListSql,
  claimsForSql,
} from "@/lib/queries";
import { loadShowcaseQueries } from "@/lib/showcase";

export const metadata: Metadata = { title: "Documentation" };

// The query behind each screen. Kept here so the working pages stay free of SQL.
const SCREEN_SQL: { screen: string; what: string; sql: string }[] = [
  { screen: "Dashboard", what: "Headline figures", sql: DASHBOARD_STATS_SQL },
  { screen: "Dashboard", what: "Open claims", sql: OPEN_CLAIMS_SQL },
  { screen: "Dashboard", what: "Claims by loss type", sql: LOSS_TYPE_SUMMARY_SQL },
  { screen: "Dashboard", what: "Unpaid fees (v_unpaid_invoices)", sql: UNPAID_INVOICES_SQL },
  { screen: "Claims", what: "Claim list with filters", sql: claimListSql({}).sql },
  { screen: "Claim detail", what: "One claim (v_claim_overview)", sql: CLAIM_BY_ID_SQL },
  { screen: "Claim detail", what: "Site visits", sql: VISITS_FOR_CLAIM_SQL },
  { screen: "Claim detail", what: "Change history", sql: CLAIM_HISTORY_SQL },
  { screen: "Invoices", what: "All invoices", sql: INVOICES_SQL },
  { screen: "Directory", what: "Insurers", sql: INSURERS_SQL },
  { screen: "Directory", what: "Clients", sql: CLIENTS_SQL },
  { screen: "Directory", what: "Surveyors", sql: SURVEYORS_SQL },
  { screen: "Directory", what: "Claims linked to an insurer", sql: claimsForSql("insurer") },
  { screen: "New claim", what: "Save a claim", sql: `INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount, status)
VALUES (?, ?, ?, ?, ?, 'Open');` },
  { screen: "Edit claim", what: "Save changes", sql: `UPDATE claim
SET insurer_id = ?, client_id = ?, surveyor_id = ?,
    loss_type = ?, claimed_amount = ?, status = ?
WHERE claim_id = ?;

-- trg_claim_after_update then writes the old and new row to audit_log.` },
  { screen: "Audit trail", what: "Change log with filters", sql: auditLogSql({}).sql },
  { screen: "Users", what: "Login accounts", sql: USERS_SQL },
];

const ACCESS: { account: string; role: string; can: string }[] = [
  { account: "mcs_owner", role: "all privileges", can: "Builds the schema (npm run db:setup). Owns the views and triggers." },
  { account: "mcs_app", role: "mcs_admin", can: "The web app. The app itself limits staff users to adding and editing." },
  { account: "wb_admin", role: "mcs_admin", can: "Read, add, edit and delete records. Manage login accounts." },
  { account: "wb_staff", role: "mcs_staff", can: "Read, add and edit records. Read the audit trail. No deletes." },
];

const TRIGGER_EXAMPLE = `CREATE TRIGGER trg_invoice_after_update AFTER UPDATE ON invoice
FOR EACH ROW
  INSERT INTO audit_log (table_name, record_id, action, changed_by, old_data, new_data)
  SELECT 'invoice', NEW.invoice_id, 'UPDATE', COALESCE(@app_user, CURRENT_USER()),
         JSON_OBJECT('invoice_id', OLD.invoice_id, 'claim_id', OLD.claim_id,
                     'fee_amount', OLD.fee_amount, 'amount_paid', OLD.amount_paid),
         JSON_OBJECT('invoice_id', NEW.invoice_id, 'claim_id', NEW.claim_id,
                     'fee_amount', NEW.fee_amount, 'amount_paid', NEW.amount_paid)
  FROM DUAL
  WHERE JSON_OBJECT(... OLD ...) <> JSON_OBJECT(... NEW ...);  -- skip no-op updates`;

const navLink = "block rounded-sm px-2 py-1.5 text-sm text-ink-soft hover:bg-subtle hover:text-ink";
const navHeading = "px-2 pt-1 pb-2 text-xs font-bold tracking-[0.08em] text-muted uppercase";

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

export default async function DocumentationPage() {
  await requireAdmin();
  const queries = loadShowcaseQueries();
  const [schema, ...results] = await Promise.all([
    query<SchemaColumn>(SCHEMA_SQL),
    ...queries.map((q) => runTimed(q.sql)),
  ]);

  const tables = Object.entries(Object.groupBy(schema, (c) => c.TABLE_NAME)) as [string, SchemaColumn[]][];

  return (
    <>
      <PageHeader
        title="Documentation"
        description="How the database is built, who can access what, and the SQL behind every screen. Administrators only."
      />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[220px_1fr]">
        <nav className="hidden xl:block">
          <div className={`${panelClass} sticky top-6 p-2`}>
            <p className={navHeading}>Contents</p>
            <a href="#schema" className={navLink}>
              Schema
            </a>
            <a href="#access" className={navLink}>
              Access and roles
            </a>
            <a href="#audit" className={navLink}>
              Audit trail
            </a>
            <a href="#screens" className={navLink}>
              SQL behind each screen
            </a>
            <p className={`${navHeading} mt-2 pt-3`}>Reports</p>
            {queries.map((q, i) => (
              <a
                key={q.slug}
                href={`#${q.slug}`}
                className={navLink}
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

          <div id="access" className="scroll-mt-6">
            <Card
              icon={ShieldCheck}
              title="Access and roles"
              description="MySQL roles from database/06_access.sql. Only the schema owner can change the audit log."
            >
              <DataTable
                rows={ACCESS}
                rowKey={(r) => r.account}
                columns={[
                  { header: "Account", cell: (r) => <span className="font-mono text-ink">{r.account}</span> },
                  { header: "MySQL role", cell: (r) => <span className="font-mono">{r.role}</span> },
                  { header: "Can do", cell: (r) => r.can, wrap: true },
                ]}
              />
              <p className="mt-4 text-sm text-muted">
                In the app there is one <strong className="text-ink">administrator</strong>, who can also delete
                records, manage users and read this page. Everyone else is <strong className="text-ink">staff</strong>{" "}
                and can add and edit records. MySQL enforces the single administrator with a UNIQUE key on{" "}
                <code className="font-mono text-ink">app_user.admin_slot</code>.
              </p>
            </Card>
          </div>

          <div id="audit" className="scroll-mt-6">
            <Card icon={History} title="Audit trail" description="One of the 21 triggers in database/04_audit.sql">
              <p className="mb-4 text-sm text-muted">
                Every insert, edit and delete on the six ERD tables and on login accounts is written to{" "}
                <code className="font-mono text-ink">audit_log</code> by a trigger, with the old and new values. The app
                runs <code className="font-mono text-ink">SET @app_user = &apos;name&apos;</code> before each write so the
                log knows who made the change. Changes made in Workbench are logged under the MySQL user name.
              </p>
              <SqlBlock sql={TRIGGER_EXAMPLE} />
            </Card>
          </div>

          <div id="screens" className="scroll-mt-6">
            <Card icon={LayoutDashboard} title="SQL behind each screen" description="The exact queries the app runs">
              <div className="-mt-4">
                {SCREEN_SQL.map((s) => (
                  <SqlPeek key={`${s.screen}-${s.what}`} sql={s.sql} label={`${s.screen} · ${s.what}`} />
                ))}
              </div>
            </Card>
          </div>

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
