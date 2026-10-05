"use server";

// Invoices: one per claim; create, record payments, correct and delete.
// Every action checks the signed-in user, validates the form on the server,
// writes in a transaction (so the audit triggers know who made the change)
// and returns a message for the toast.

import { transaction } from "@/lib/db";
import { amount, assertClaimNotClosed, assertFound, FormError, getActor, getAdminActor, id, refresh, toFormState } from "@/actions/shared";
import type { FormState } from "@/lib/form-state";

export async function createInvoice(_prev: FormState, fd: FormData): Promise<FormState> {
  try {
    const claimId = id(fd, "claim_id", "claim");
    const fee = amount(fd, "fee_amount", "Fee amount");
    await transaction(await getActor(), async (tx) => {
      await assertClaimNotClosed(tx, claimId);
      await tx.execute(`INSERT INTO invoice (claim_id, fee_amount, amount_paid) VALUES (?, ?, 0)`, [claimId, fee]);
    });
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
