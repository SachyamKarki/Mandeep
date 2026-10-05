// Site visits: for one claim, and across all claims.
import "server-only";
import { query } from "@/lib/db";
import type { ClaimStatus, LossType, SiteVisit } from "@/lib/queries/types";

export const VISITS_FOR_CLAIM_SQL = `SELECT visit_id, claim_id, visit_date, findings
FROM site_visit
WHERE claim_id = ?
ORDER BY visit_date DESC, visit_id DESC`;

export const getVisitsForClaim = (id: number) => query<SiteVisit>(VISITS_FOR_CLAIM_SQL, [id]);

export type SiteVisitRow = SiteVisit & {
  client_name: string;
  surveyor_name: string;
  loss_type: LossType;
  status: ClaimStatus;
};

export const ALL_VISITS_SQL = `SELECT v.visit_id, v.claim_id, v.visit_date, v.findings,
       cl.client_name, s.surveyor_name, c.loss_type, c.status
FROM site_visit v
JOIN claim    c  ON c.claim_id     = v.claim_id
JOIN client   cl ON cl.client_id   = c.client_id
JOIN surveyor s  ON s.surveyor_id  = c.surveyor_id
ORDER BY v.visit_date DESC, v.visit_id DESC`;

export const getAllVisits = () => query<SiteVisitRow>(ALL_VISITS_SQL);
