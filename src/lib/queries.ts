import "server-only";
import { query } from "./db";

// Every SQL statement the pages run lives here, so each page can also
// show the exact query behind its data.

export type ClaimStatus = "Open" | "Surveyed" | "Closed";
export type LossType = "Marine" | "Motor" | "Industrial";

export const STATUSES: ClaimStatus[] = ["Open", "Surveyed", "Closed"];
export const LOSS_TYPES: LossType[] = ["Marine", "Motor", "Industrial"];

export type ClaimOverview = {
  claim_id: number;
  loss_type: LossType;
  claimed_amount: number;
  status: ClaimStatus;
  insurer_id: number;
  insurer_name: string;
  client_id: number;
  client_name: string;
  surveyor_id: number;
  surveyor_name: string;
  visit_count: number;
  last_visit: string | null;
  invoice_id: number | null;
  fee_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
};

export type SiteVisit = { visit_id: number; claim_id: number; visit_date: string; findings: string };

export type UnpaidInvoice = {
  invoice_id: number;
  claim_id: number;
  insurer_name: string;
  client_name: string;
  fee_amount: number;
  amount_paid: number;
  balance_due: number;
  payment_status: "Unpaid" | "Part paid";
};

// ---------- Dashboard ----------

export const DASHBOARD_STATS_SQL = `SELECT
  (SELECT COUNT(*) FROM claim WHERE status <> 'Closed')             AS open_claims,
  (SELECT COUNT(*) FROM claim)                                      AS total_claims,
  (SELECT COALESCE(SUM(claimed_amount), 0) FROM claim
     WHERE status <> 'Closed')                                      AS open_value,
  (SELECT COALESCE(SUM(fee_amount), 0) FROM invoice)                AS fees_billed,
  (SELECT COALESCE(SUM(fee_amount - amount_paid), 0) FROM invoice)  AS fees_outstanding`;

export type DashboardStats = {
  open_claims: number;
  total_claims: number;
  open_value: number;
  fees_billed: number;
  fees_outstanding: number;
};

export async function getDashboardStats() {
  const [row] = await query<DashboardStats>(DASHBOARD_STATS_SQL);
  return row;
}

export const OPEN_CLAIMS_SQL = `SELECT claim_id, client_name, insurer_name, loss_type,
       claimed_amount, status, visit_count, last_visit
FROM v_claim_overview
WHERE status <> 'Closed'
ORDER BY claim_id DESC`;

export const getOpenClaims = () => query<ClaimOverview>(OPEN_CLAIMS_SQL);

export const UNPAID_INVOICES_SQL = `SELECT *
FROM v_unpaid_invoices
ORDER BY balance_due DESC`;

export const getUnpaidInvoices = () => query<UnpaidInvoice>(UNPAID_INVOICES_SQL);

export const LOSS_TYPE_SUMMARY_SQL = `SELECT loss_type,
       COUNT(*)            AS claims,
       SUM(claimed_amount) AS total_claimed
FROM claim
GROUP BY loss_type
ORDER BY total_claimed DESC`;

export type LossTypeSummary = { loss_type: LossType; claims: number; total_claimed: number };

export const getLossTypeSummary = () => query<LossTypeSummary>(LOSS_TYPE_SUMMARY_SQL);

// ---------- Claims ----------

export function claimListSql(filters: { status?: string; loss_type?: string; q?: string }) {
  const where: string[] = [];
  const params: string[] = [];
  if (filters.status) {
    where.push("status = ?");
    params.push(filters.status);
  }
  if (filters.loss_type) {
    where.push("loss_type = ?");
    params.push(filters.loss_type);
  }
  if (filters.q) {
    where.push("(client_name LIKE ? OR insurer_name LIKE ?)");
    params.push(`%${filters.q}%`, `%${filters.q}%`);
  }
  const sql = `SELECT *
FROM v_claim_overview${where.length ? `\nWHERE ${where.join("\n  AND ")}` : ""}
ORDER BY claim_id DESC`;
  return { sql, params };
}

export async function getClaims(filters: { status?: string; loss_type?: string; q?: string }) {
  const { sql, params } = claimListSql(filters);
  return query<ClaimOverview>(sql, params);
}

export const CLAIM_BY_ID_SQL = `SELECT * FROM v_claim_overview WHERE claim_id = ?`;

export async function getClaim(id: number) {
  const [row] = await query<ClaimOverview>(CLAIM_BY_ID_SQL, [id]);
  return row ?? null;
}

export const VISITS_FOR_CLAIM_SQL = `SELECT visit_id, claim_id, visit_date, findings
FROM site_visit
WHERE claim_id = ?
ORDER BY visit_date DESC, visit_id DESC`;

export const getVisitsForClaim = (id: number) => query<SiteVisit>(VISITS_FOR_CLAIM_SQL, [id]);

// ---------- Directory ----------

export const INSURERS_SQL = `SELECT i.insurer_id, i.insurer_name, i.phone,
       COUNT(c.claim_id) AS claims
FROM insurer i
LEFT JOIN claim c ON c.insurer_id = i.insurer_id
GROUP BY i.insurer_id, i.insurer_name, i.phone
ORDER BY i.insurer_name`;

export const CLIENTS_SQL = `SELECT cl.client_id, cl.client_name, cl.phone,
       COUNT(c.claim_id) AS claims
FROM client cl
LEFT JOIN claim c ON c.client_id = cl.client_id
GROUP BY cl.client_id, cl.client_name, cl.phone
ORDER BY cl.client_name`;

export const SURVEYORS_SQL = `SELECT s.surveyor_id, s.surveyor_name, s.licence_no,
       COUNT(c.claim_id) AS claims
FROM surveyor s
LEFT JOIN claim c ON c.surveyor_id = s.surveyor_id
GROUP BY s.surveyor_id, s.surveyor_name, s.licence_no
ORDER BY s.surveyor_name`;

export type Insurer = { insurer_id: number; insurer_name: string; phone: string; claims: number };
export type Client = { client_id: number; client_name: string; phone: string; claims: number };
export type Surveyor = { surveyor_id: number; surveyor_name: string; licence_no: string; claims: number };

export const getInsurers = () => query<Insurer>(INSURERS_SQL);
export const getClients = () => query<Client>(CLIENTS_SQL);
export const getSurveyors = () => query<Surveyor>(SURVEYORS_SQL);

// ---------- Invoices ----------

export const INVOICES_SQL = `SELECT claim_id, invoice_id, client_name, insurer_name,
       fee_amount, amount_paid, balance_due, status
FROM v_claim_overview
WHERE invoice_id IS NOT NULL
ORDER BY balance_due DESC, claim_id DESC`;

export const getInvoices = () => query<ClaimOverview>(INVOICES_SQL);

export async function getDirectoryEntry(kind: "insurer" | "client" | "surveyor", id: number) {
  const sql = {
    insurer: `SELECT insurer_id AS id, insurer_name, phone FROM insurer WHERE insurer_id = ?`,
    client: `SELECT client_id AS id, client_name, phone FROM client WHERE client_id = ?`,
    surveyor: `SELECT surveyor_id AS id, surveyor_name, licence_no FROM surveyor WHERE surveyor_id = ?`,
  }[kind];
  const [row] = await query<Record<string, string | number>>(sql, [id]);
  return row ?? null;
}

export function claimsForSql(kind: "insurer" | "client" | "surveyor") {
  const column = { insurer: "insurer_id", client: "client_id", surveyor: "surveyor_id" }[kind];
  return `SELECT claim_id, client_name, insurer_name, surveyor_name, loss_type, claimed_amount, status
FROM v_claim_overview
WHERE ${column} = ?
ORDER BY claim_id DESC`;
}

export const getClaimsFor = (kind: "insurer" | "client" | "surveyor", id: number) =>
  query<ClaimOverview>(claimsForSql(kind), [id]);

// ---------- Audit trail ----------

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

export function auditLogSql(filters: { table?: string; action?: string; user?: string; record?: number }) {
  const where: string[] = [];
  const params: (string | number)[] = [];
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
  const sql = `SELECT audit_id, table_name, record_id, action, changed_by, changed_at, old_data, new_data
FROM audit_log${where.length ? `\nWHERE ${where.join("\n  AND ")}` : ""}
ORDER BY audit_id DESC
LIMIT 200`;
  return { sql, params };
}

export async function getAuditLog(filters: { table?: string; action?: string; user?: string; record?: number }) {
  const { sql, params } = auditLogSql(filters);
  return query<AuditEntry>(sql, params);
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

// ---------- Users ----------

export type AppUser = {
  user_id: number;
  full_name: string;
  email: string;
  role: "admin" | "staff";
  is_active: number;
  pending: number;
  locked: number;
  last_login_at: string | null;
  created_at: string;
  sessions: number;
};

export const USERS_SQL = `SELECT u.user_id, u.full_name, u.email, u.role, u.is_active,
       (u.is_active = FALSE AND u.last_login_at IS NULL) AS pending,
       COALESCE(u.locked_until > NOW(), 0) AS locked,
       u.last_login_at, u.created_at,
       COUNT(s.token_hash) AS sessions
FROM app_user u
LEFT JOIN user_session s ON s.user_id = u.user_id AND s.expires_at > NOW()
GROUP BY u.user_id
ORDER BY u.is_active DESC, u.full_name`;

export const getUsers = () => query<AppUser>(USERS_SQL);

export type UserSession = { token_hash: string; created_at: string; expires_at: string; user_agent: string | null };

export const MY_SESSIONS_SQL = `SELECT token_hash, created_at, expires_at, user_agent
FROM user_session
WHERE user_id = ? AND expires_at > NOW()
ORDER BY created_at DESC`;

export const getSessionsFor = (userId: number) => query<UserSession>(MY_SESSIONS_SQL, [userId]);
