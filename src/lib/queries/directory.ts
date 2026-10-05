// Insurers, clients and surveyors, and the claims linked to each.
import "server-only";
import { query } from "@/lib/db";
import type { ClaimOverview } from "@/lib/queries/types";

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
