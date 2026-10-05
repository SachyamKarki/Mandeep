// The claim list (search and filters), one claim, and possible duplicates.
import "server-only";
import { query } from "@/lib/db";
import type { ClaimOverview } from "@/lib/queries/types";

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
    // Matches a claim number ("CLM-0012" or "12") or any part of the client, insurer,
    // surveyor or loss type.
    const like = `%${filters.q.trim()}%`;
    const text = "client_name LIKE ? OR insurer_name LIKE ? OR surveyor_name LIKE ? OR loss_type LIKE ?";
    const claimNumber = /^(?:clm-?)?0*(\d+)$/i.exec(filters.q.trim());
    if (claimNumber) {
      where.push(`(claim_id = ? OR ${text})`);
      params.push(claimNumber[1], like, like, like, like);
    } else {
      where.push(`(${text})`);
      params.push(like, like, like, like);
    }
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

// Possible duplicates: another claim with the same client, insurer and loss type
// (the same rule as the "Possible duplicate claims" report in 05_queries.sql).
export const DUPLICATE_CLAIMS_SQL = `SELECT c.claim_id, GROUP_CONCAT(o.claim_id ORDER BY o.claim_id) AS others
FROM claim c
JOIN claim o
  ON  o.client_id   = c.client_id
  AND o.insurer_id  = c.insurer_id
  AND o.loss_type   = c.loss_type
  AND o.claim_id   <> c.claim_id
GROUP BY c.claim_id`;

/** claim_id -> the other claims it may duplicate. */
export async function getDuplicateMap() {
  const rows = await query<{ claim_id: number; others: string }>(DUPLICATE_CLAIMS_SQL);
  return new Map(rows.map((r) => [r.claim_id, r.others.split(",").map(Number)]));
}

export const CLAIM_BY_ID_SQL = `SELECT * FROM v_claim_overview WHERE claim_id = ?`;

export async function getClaim(id: number) {
  const [row] = await query<ClaimOverview>(CLAIM_BY_ID_SQL, [id]);
  return row ?? null;
}
