"use server";

// Claims: create, edit, change status and delete.
// Every action checks the signed-in user, validates the form on the server,
// writes in a transaction (so the audit triggers know who made the change)
// and returns a message for the toast.

import { redirect } from "next/navigation";
import { transaction } from "@/lib/db";
import { MAX_CLAIM } from "@/lib/validation";
import { claimNo } from "@/lib/format";
import { flash } from "@/lib/flash";
import { LOSS_TYPES, STATUSES } from "@/lib/queries";
import { amount, assertFound, getActor, getAdminActor, id, oneOf, refresh, toFormState } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

function claimFields(fd: FormData) {
  return [
    id(fd, "insurer_id", "insurer"),
    id(fd, "client_id", "client"),
    id(fd, "surveyor_id", "surveyor"),
    oneOf(fd, "loss_type", LOSS_TYPES, "loss type"),
    amount(fd, "claimed_amount", "Claimed amount", { max: MAX_CLAIM }),
  ] as const;
}

export async function createClaim(_prev: FormState, fd: FormData): Promise<FormState> {
  let claimId: number;
  try {
    const fields = claimFields(fd);
    claimId = await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(
        `INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount, status)
         VALUES (?, ?, ?, ?, ?, 'Open')`,
        [...fields],
      );
      return result.insertId;
    });
  } catch (err) {
    return toFormState(err);
  }
  refresh();
  await flash(`${claimNo(claimId)} created.`);
  redirect(`/claims/${claimId}`);
}

export async function updateClaim(_prev: FormState, fd: FormData): Promise<FormState> {
  let claimId: number;
  try {
    claimId = id(fd, "claim_id", "claim");
    const fields = claimFields(fd);
    const status = oneOf(fd, "status", STATUSES, "status");
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(
        `UPDATE claim
         SET insurer_id = ?, client_id = ?, surveyor_id = ?, loss_type = ?, claimed_amount = ?, status = ?
         WHERE claim_id = ?`,
        [...fields, status, claimId],
      );
      assertFound(result.affectedRows, "claim");
    });
  } catch (err) {
    return toFormState(err);
  }
  refresh();
  await flash("Claim saved.");
  redirect(`/claims/${claimId}`);
}

export async function updateClaimStatus(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const claimId = id(fd, "claim_id", "claim");
    const status = oneOf(fd, "status", STATUSES, "status");
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(`UPDATE claim SET status = ? WHERE claim_id = ?`, [status, claimId]);
      assertFound(result.affectedRows, "claim");
    });
    refresh();
    return { success: `Status set to ${status}.` };
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteClaim(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const claimId = id(fd, "claim_id", "claim");
    await transaction(await getAdminActor(), async (tx) => {
      // Delete children first: MySQL skips triggers on ON DELETE CASCADE rows,
      // so doing it here keeps every removed row in the audit log.
      await tx.execute(`DELETE FROM site_visit WHERE claim_id = ?`, [claimId]);
      await tx.execute(`DELETE FROM invoice WHERE claim_id = ?`, [claimId]);
      const result = await tx.execute(`DELETE FROM claim WHERE claim_id = ?`, [claimId]);
      assertFound(result.affectedRows, "claim");
    });
  } catch (err) {
    return toFormState(err);
  }
  refresh();
  await flash("Claim deleted.");
  redirect("/claims");
}
