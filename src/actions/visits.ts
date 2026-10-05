"use server";

// Site visits: record, correct and delete visits on a claim.
// Every action checks the signed-in user, validates the form on the server,
// writes in a transaction (so the audit triggers know who made the change)
// and returns a message for the toast.

import { transaction } from "@/lib/db";
import { FINDINGS_MAX, FINDINGS_MIN } from "@/lib/validation";
import { assertClaimNotClosed, assertFound, date, getActor, getAdminActor, id, refresh, text, toFormState } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

export async function addSiteVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const claimId = id(fd, "claim_id", "claim");
    const values = [claimId, date(fd, "visit_date", "Visit date"), text(fd, "findings", "Findings", FINDINGS_MAX, FINDINGS_MIN)];
    await transaction(await getActor(), async (tx) => {
      await assertClaimNotClosed(tx, claimId);
      await tx.execute(`INSERT INTO site_visit (claim_id, visit_date, findings) VALUES (?, ?, ?)`, values);
    });
    refresh();
    return { success: "Site visit recorded." };
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateSiteVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const values = [
      date(fd, "visit_date", "Visit date"),
      text(fd, "findings", "Findings", FINDINGS_MAX, FINDINGS_MIN),
      id(fd, "visit_id", "visit"),
    ];
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(`UPDATE site_visit SET visit_date = ?, findings = ? WHERE visit_id = ?`, values);
      assertFound(result.affectedRows, "site visit");
    });
    refresh();
    return { success: "Site visit updated." };
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteSiteVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const visitId = id(fd, "visit_id", "visit");
    await transaction(await getAdminActor(), async (tx) => {
      const result = await tx.execute(`DELETE FROM site_visit WHERE visit_id = ?`, [visitId]);
      assertFound(result.affectedRows, "site visit");
    });
    refresh();
    return { success: "Site visit deleted." };
  } catch (err) {
    return toFormState(err);
  }
}
