"use server";

import { revalidatePath } from "next/cache";
import { redirect, unstable_rethrow } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { transaction } from "@/lib/db";
import { DIRECTORY, isDirectoryKind } from "@/lib/directory";
import { LOSS_TYPES, STATUSES } from "@/lib/queries";

export type FormState = { error?: string; success?: string };

// ---------- small validation helpers ----------

class FormError extends Error {}

function text(fd: FormData, name: string, label: string, max = 120): string {
  const value = String(fd.get(name) ?? "").trim();
  if (!value) throw new FormError(`${label} is required.`);
  if (value.length > max) throw new FormError(`${label} must be ${max} characters or fewer.`);
  return value;
}

function id(fd: FormData, name: string, label: string): number {
  const value = Number(fd.get(name));
  if (!Number.isInteger(value) || value <= 0) throw new FormError(`Choose a ${label}.`);
  return value;
}

function amount(fd: FormData, name: string, label: string, { allowZero = false } = {}): number {
  const value = Number(fd.get(name));
  if (!Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new FormError(`${label} must be ${allowZero ? "0 or more" : "more than 0"}.`);
  }
  return Math.round(value * 100) / 100;
}

function date(fd: FormData, name: string, label: string): string {
  const value = text(fd, name, label, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
    throw new FormError(`Enter a valid ${label.toLowerCase()}.`);
  }
  return value;
}

function oneOf<T extends string>(fd: FormData, name: string, options: readonly T[], label: string): T {
  const value = String(fd.get(name) ?? "") as T;
  if (!options.includes(value)) throw new FormError(`Choose a valid ${label}.`);
  return value;
}

function assertFound(affectedRows: number, what: string) {
  if (affectedRows === 0) throw new FormError(`That ${what} no longer exists.`);
}

/** The signed-in user's name, written to audit_log.changed_by. Sends signed-out visitors to /login. */
async function getActor(): Promise<string> {
  return (await requireUser()).full_name;
}

/** Deleting is limited to administrators. */
async function getAdminActor(): Promise<string> {
  const user = await requireUser();
  if (user.role !== "admin") throw new FormError("Only an administrator can delete records.");
  return user.full_name;
}

/** Turns validation and MySQL errors into a message the form can show. */
function toFormState(err: unknown): FormState {
  unstable_rethrow(err); // let redirect() through
  if (err instanceof FormError) return { error: err.message };
  const code = (err as { code?: string }).code;
  if (code === "ER_DUP_ENTRY") return { error: "That record already exists." };
  if (code === "ER_NO_REFERENCED_ROW_2") return { error: "A linked record no longer exists." };
  if (code === "ER_ROW_IS_REFERENCED_2") {
    return { error: "Claims still use this record. Move or delete those claims first." };
  }
  if (code === "ER_CHECK_CONSTRAINT_VIOLATED") return { error: "That value breaks a database rule." };
  console.error(err);
  return { error: "Something went wrong saving to the database." };
}

function refresh() {
  revalidatePath("/", "layout");
}

// ---------- claims ----------

function claimFields(fd: FormData) {
  return [
    id(fd, "insurer_id", "insurer"),
    id(fd, "client_id", "client"),
    id(fd, "surveyor_id", "surveyor"),
    oneOf(fd, "loss_type", LOSS_TYPES, "loss type"),
    amount(fd, "claimed_amount", "Claimed amount"),
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
  redirect("/claims");
}

// ---------- site visits ----------

export async function addSiteVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const values = [id(fd, "claim_id", "claim"), date(fd, "visit_date", "Visit date"), text(fd, "findings", "Findings", 2000)];
    await transaction(await getActor(), (tx) =>
      tx.execute(`INSERT INTO site_visit (claim_id, visit_date, findings) VALUES (?, ?, ?)`, values),
    );
    refresh();
    return { success: "Site visit recorded." };
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateSiteVisit(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const values = [date(fd, "visit_date", "Visit date"), text(fd, "findings", "Findings", 2000), id(fd, "visit_id", "visit")];
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

// ---------- invoices ----------

export async function createInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const values = [id(fd, "claim_id", "claim"), amount(fd, "fee_amount", "Fee amount")];
    await transaction(await getActor(), (tx) =>
      tx.execute(`INSERT INTO invoice (claim_id, fee_amount, amount_paid) VALUES (?, ?, 0)`, values),
    );
    refresh();
    return { success: "Invoice created." };
  } catch (err) {
    const state = toFormState(err);
    if (state.error === "That record already exists.") return { error: "This claim already has an invoice." };
    return state;
  }
}

/** Corrects the fee or the total paid. The CHECK constraint stops paid going above the fee. */
export async function updateInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const fee = amount(fd, "fee_amount", "Fee amount");
    const paid = amount(fd, "amount_paid", "Amount paid", { allowZero: true });
    if (paid > fee) throw new FormError("Amount paid cannot be more than the fee.");
    const invoiceId = id(fd, "invoice_id", "invoice");
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(`UPDATE invoice SET fee_amount = ?, amount_paid = ? WHERE invoice_id = ?`, [
        fee,
        paid,
        invoiceId,
      ]);
      assertFound(result.affectedRows, "invoice");
    });
    refresh();
    return { success: "Invoice updated." };
  } catch (err) {
    return toFormState(err);
  }
}

export async function recordPayment(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const invoiceId = id(fd, "invoice_id", "invoice");
    const payment = amount(fd, "payment", "Payment");
    await transaction(await getActor(), async (tx) => {
      // The WHERE clause stops a payment from taking amount_paid above fee_amount.
      const result = await tx.execute(
        `UPDATE invoice
         SET amount_paid = amount_paid + ?
         WHERE invoice_id = ? AND amount_paid + ? <= fee_amount`,
        [payment, invoiceId, payment],
      );
      if (result.affectedRows === 0) throw new FormError("Payment is more than the balance due.");
    });
    refresh();
    return { success: "Payment recorded." };
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const invoiceId = id(fd, "invoice_id", "invoice");
    await transaction(await getAdminActor(), async (tx) => {
      const result = await tx.execute(`DELETE FROM invoice WHERE invoice_id = ?`, [invoiceId]);
      assertFound(result.affectedRows, "invoice");
    });
    refresh();
    return { success: "Invoice deleted." };
  } catch (err) {
    return toFormState(err);
  }
}

// ---------- directory: insurers, clients, surveyors ----------

function directoryConfig(fd: FormData) {
  const kind = String(fd.get("kind") ?? "");
  if (!isDirectoryKind(kind)) throw new FormError("Unknown record type.");
  return DIRECTORY[kind];
}

export async function addDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const cfg = directoryConfig(fd);
    const values = cfg.fields.map((f) => text(fd, f.name, f.label, f.max));
    await transaction(await getActor(), (tx) =>
      tx.execute(
        `INSERT INTO ${cfg.table} (${cfg.fields.map((f) => f.name).join(", ")}) VALUES (${cfg.fields.map(() => "?").join(", ")})`,
        values,
      ),
    );
    refresh();
    return { success: `${cfg.label} added.` };
  } catch (err) {
    return toFormState(err);
  }
}

export async function updateDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const cfg = directoryConfig(fd);
    const values = cfg.fields.map((f) => text(fd, f.name, f.label, f.max));
    const recordId = id(fd, "id", cfg.label.toLowerCase());
    await transaction(await getActor(), async (tx) => {
      const result = await tx.execute(
        `UPDATE ${cfg.table} SET ${cfg.fields.map((f) => `${f.name} = ?`).join(", ")} WHERE ${cfg.pk} = ?`,
        [...values, recordId],
      );
      assertFound(result.affectedRows, cfg.label.toLowerCase());
    });
    refresh();
    return { success: `${cfg.label} updated.` };
  } catch (err) {
    return toFormState(err);
  }
}

export async function deleteDirectoryEntry(_prev: FormState, fd: FormData): Promise<FormState> {
  let kind: string;
  try {
    const cfg = directoryConfig(fd);
    kind = cfg.kind;
    const recordId = id(fd, "id", cfg.label.toLowerCase());
    // ON DELETE RESTRICT on claim stops this if any claim still points here.
    await transaction(await getAdminActor(), async (tx) => {
      const result = await tx.execute(`DELETE FROM ${cfg.table} WHERE ${cfg.pk} = ?`, [recordId]);
      assertFound(result.affectedRows, cfg.label.toLowerCase());
    });
  } catch (err) {
    return toFormState(err);
  }
  refresh();
  redirect(`/directory#${kind}`);
}
