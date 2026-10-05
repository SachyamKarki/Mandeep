// All invoices with their balance due.
import "server-only";
import { query } from "@/lib/db";
import type { ClaimOverview } from "@/lib/queries/types";

export const INVOICES_SQL = `SELECT claim_id, invoice_id, client_name, insurer_name,
       fee_amount, amount_paid, balance_due, status
FROM v_claim_overview
WHERE invoice_id IS NOT NULL
ORDER BY balance_due DESC, claim_id DESC`;

export const getInvoices = () => query<ClaimOverview>(INVOICES_SQL);
