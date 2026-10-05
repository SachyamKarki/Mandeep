// The audit trail: filtered, paged in SQL, and per claim.
import "server-only";
import { query } from "@/lib/db";

export const AUDIT_TABLES = ["insurer", "client", "surveyor", "claim", "site_visit", "invoice", "app_user"] as const;
export const AUDIT_ACTIONS = ["INSERT", "UPDATE", "DELETE"] as const;

export type AuditEntry = {
  audit_id: number;
  table_name: (typeof AUDIT_TABLES)[number];
  record_id: number;
  action: (typeof AUDIT_ACTIONS)[number];
  changed_by: string;
  changed_at: string;
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
};

type AuditFilters = { table?: string; action?: string; user?: string; record?: number; hideAccounts?: boolean };

export function auditLogSql(filters: AuditFilters) {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.hideAccounts) where.push("table_name <> 'app_user'");
  if (filters.table) {
    where.push("table_name = ?");
    params.push(filters.table);
  }
  if (filters.action) {
    where.push("action = ?");
    params.push(filters.action);
  }
  if (filters.user) {
    where.push("changed_by = ?");
    params.push(filters.user);
  }
  if (filters.record) {
    where.push("record_id = ?");
    params.push(filters.record);
  }
  const whereSql = where.length ? `\nWHERE ${where.join("\n  AND ")}` : "";
  const sql = `SELECT audit_id, table_name, record_id, action, changed_by, changed_at, old_data, new_data
FROM audit_log${whereSql}
ORDER BY audit_id DESC
LIMIT 200`;
  return { sql, params, whereSql };
}

export async function getAuditLog(filters: AuditFilters) {
  const { sql, params } = auditLogSql(filters);
  return query<AuditEntry>(sql, params);
}

/** One page of the audit trail plus the total, paged in SQL so the log can grow without limit. */
export async function getAuditPage(filters: AuditFilters, page: number, size: number) {
  const { params, whereSql } = auditLogSql(filters);
  const [{ total }] = await query<{ total: number }>(`SELECT COUNT(*) AS total FROM audit_log${whereSql}`, params);
  const current = Math.min(Math.max(1, page), Math.max(1, Math.ceil(total / size)));
  // LIMIT and OFFSET are whole numbers worked out here, never text from the request.
  const rows = await query<AuditEntry>(
    `SELECT audit_id, table_name, record_id, action, changed_by, changed_at, old_data, new_data
FROM audit_log${whereSql}
ORDER BY audit_id DESC
LIMIT ${size} OFFSET ${(current - 1) * size}`,
    params,
  );
  return { rows, total, page: current };
}

export const AUDIT_USERS_SQL = `SELECT DISTINCT changed_by FROM audit_log ORDER BY changed_by`;
export const getAuditUsers = () => query<{ changed_by: string }>(AUDIT_USERS_SQL);

// The claim itself, plus its visits and invoice, found through the claim_id stored in the JSON.
export const CLAIM_HISTORY_SQL = `SELECT audit_id, table_name, record_id, action, changed_by, changed_at, old_data, new_data
FROM audit_log
WHERE (table_name = 'claim' AND record_id = ?)
   OR (table_name IN ('site_visit', 'invoice')
       AND COALESCE(new_data ->> '$.claim_id', old_data ->> '$.claim_id') = ?)
ORDER BY audit_id DESC`;

export const getClaimHistory = (claimId: number) =>
  query<AuditEntry>(CLAIM_HISTORY_SQL, [claimId, String(claimId)]);
