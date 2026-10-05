import { Banknote, Pencil } from "lucide-react";
import { recordPayment, updateInvoice } from "@/actions/invoices";
import type { TableView } from "@/components/ui/data-table";
import { ModalForm } from "@/components/ui/modal-form";
import { inputClass, labelClass } from "@/components/ui";
import { claimNo, npr } from "@/lib/format";
import { MAX_FEE } from "@/lib/validation";

type Invoice = {
  claim_id: number;
  invoice_id: number | null;
  fee_amount: number | null;
  amount_paid: number | null;
  balance_due: number | null;
};

/** Row actions for an invoice: record a payment (while money is owed) and correct the figures. */
export function InvoiceActions({ invoice, view }: { invoice: Invoice; view: TableView }) {
  if (invoice.invoice_id == null) return null;
  const id = `${view}_inv${invoice.invoice_id}`;
  const balance = invoice.balance_due ?? 0;

  return (
    <div className="flex flex-wrap justify-end gap-1 lg:justify-start">
      {balance > 0 && (
        <ModalForm
          trigger="Payment"
          icon={<Banknote size={14} />}
          variant="link"
          title={`Record payment · ${claimNo(invoice.claim_id)}`}
          description={`Balance due: ${npr(balance)}`}
          action={recordPayment}
          submitLabel="Record payment"
        >
          <input type="hidden" name="invoice_id" value={invoice.invoice_id} />
          <div>
            <label htmlFor={`${id}_payment`} className={labelClass}>
              Payment received (Rs)
            </label>
            <input
              id={`${id}_payment`}
              name="payment"
              type="number"
              min="0.01"
              max={balance}
              step="0.01"
              required
              className={inputClass}
            />
          </div>
        </ModalForm>
      )}
      <ModalForm
        trigger="Edit"
        icon={<Pencil size={13} />}
        variant="link"
        title={`Correct invoice · ${claimNo(invoice.claim_id)}`}
        description="Fix the fee or the total paid. The total paid can never be more than the fee."
        action={updateInvoice}
        submitLabel="Save invoice"
      >
        <input type="hidden" name="invoice_id" value={invoice.invoice_id} />
        <div>
          <label htmlFor={`${id}_fee`} className={labelClass}>
            Fee (Rs)
          </label>
          <input
            id={`${id}_fee`}
            name="fee_amount"
            type="number"
            min="0.01"
            max={MAX_FEE}
            step="0.01"
            required
            defaultValue={invoice.fee_amount ?? undefined}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor={`${id}_paid`} className={labelClass}>
            Total paid (Rs)
          </label>
          <input
            id={`${id}_paid`}
            name="amount_paid"
            type="number"
            min="0"
            max={MAX_FEE}
            step="0.01"
            required
            defaultValue={invoice.amount_paid ?? undefined}
            className={inputClass}
          />
        </div>
      </ModalForm>
    </div>
  );
}
