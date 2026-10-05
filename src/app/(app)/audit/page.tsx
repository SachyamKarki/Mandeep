import type { Metadata } from "next";
import Link from "next/link";
import { FilePlus2, FileX2, History, PencilLine } from "lucide-react";
import { AuditList } from "@/components/audit-list";
import { SqlBlock, SqlPeek } from "@/components/sql-block";
import {
  Card,
  PageHeader,
  StatRow,
  buttonClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/components/ui";
import { query } from "@/lib/db";
import { AUDIT_ACTIONS, AUDIT_TABLES, auditLogSql, getAuditLog, getAuditUsers } from "@/lib/queries";

export const metadata: Metadata = { title: "Audit trail" };

const COUNTS_SQL = `SELECT
  SUM(action = 'INSERT') AS inserts,
  SUM(action = 'UPDATE') AS updates,
  SUM(action = 'DELETE') AS deletes
FROM audit_log`;

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

function pick(value: string | string[] | undefined, allowed?: readonly string[]) {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  if (allowed && !allowed.includes(v)) return undefined;
  return v.slice(0, 100);
}

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const sp = await searchParams;
  const record = Number(pick(sp.record));
  const filters = {
    table: pick(sp.table, AUDIT_TABLES),
    action: pick(sp.action, AUDIT_ACTIONS),
    user: pick(sp.user),
    record: Number.isInteger(record) && record > 0 ? record : undefined,
  };

  const [entries, users, [counts]] = await Promise.all([
    getAuditLog(filters),
    getAuditUsers(),
    query<{ inserts: number | null; updates: number | null; deletes: number | null }>(COUNTS_SQL),
  ]);
  const { sql, params } = auditLogSql(filters);

  return (
    <>
      <PageHeader
        eyebrow="MySQL triggers"
        title="Audit trail"
        description="Every insert, edit and delete on the six tables is written to audit_log by a trigger, with the old and new values and who made the change."
      />

      <StatRow
        items={[
          { label: "Records added", value: String(counts.inserts ?? 0), icon: FilePlus2 },
          { label: "Edits", value: String(counts.updates ?? 0), icon: PencilLine },
          { label: "Deletions", value: String(counts.deletes ?? 0), icon: FileX2, tone: counts.deletes ? "bad" : undefined },
        ]}
      />
      <SqlPeek sql={COUNTS_SQL} label="View SQL for these figures" />

      <Card className="mt-6">
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_140px_auto]">
          <div>
            <label htmlFor="table" className={labelClass}>
              Table
            </label>
            <select id="table" name="table" defaultValue={filters.table ?? ""} className={inputClass}>
              <option value="">All tables</option>
              {AUDIT_TABLES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="action" className={labelClass}>
              Action
            </label>
            <select id="action" name="action" defaultValue={filters.action ?? ""} className={inputClass}>
              <option value="">All actions</option>
              {AUDIT_ACTIONS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="user" className={labelClass}>
              Changed by
            </label>
            <select id="user" name="user" defaultValue={filters.user ?? ""} className={inputClass}>
              <option value="">Anyone</option>
              {users.map((u) => (
                <option key={u.changed_by}>{u.changed_by}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="record" className={labelClass}>
              Record ID
            </label>
            <input id="record" name="record" type="number" min="1" defaultValue={filters.record} className={inputClass} />
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={buttonClass}>
              Filter
            </button>
            <Link href="/audit" className={secondaryButtonClass}>
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card
        className="mt-6"
        icon={History}
        title={`${entries.length} ${entries.length === 1 ? "change" : "changes"}`}
        description="Newest first, up to 200"
      >
        <AuditList entries={entries} empty="No changes match. Add, edit or delete something and it will show here." />
        <div className="mt-8">
          <SqlPeek
            sql={params.length ? `${sql}\n\n-- parameters: ${params.map((p) => `'${p}'`).join(", ")}` : sql}
          />
        </div>
      </Card>

      <Card className="mt-6" title="How it works" description="One of the 18 triggers in database/04_audit.sql">
        <p className="mb-4 text-sm text-muted">
          The app runs <code className="font-mono text-ink">SET @app_user = &apos;name&apos;</code> before each write.
          The trigger reads it, so the log knows who made the change. Changes made straight in the mysql client are
          logged too, under the MySQL user name.
        </p>
        <SqlBlock sql={TRIGGER_EXAMPLE} />
      </Card>
    </>
  );
}
