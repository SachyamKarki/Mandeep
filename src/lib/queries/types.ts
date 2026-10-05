// Shapes and fixed lists shared by the query files.

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
