// Dashboard figures, open claims, unpaid fees and the loss-type summary.
import "server-only";
import { query } from "@/lib/db";
import type { LossType, ClaimOverview, UnpaidInvoice } from "@/lib/queries/types";

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
