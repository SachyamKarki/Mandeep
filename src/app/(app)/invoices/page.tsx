import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { SqlPeek } from "@/components/sql-block";
import { Banknote, CircleCheck, Receipt } from "lucide-react";
import { Card, PageHeader, PaymentBadge, StatRow } from "@/components/ui";
import { claimNo, npr } from "@/lib/format";
import { INVOICES_SQL, getInvoices } from "@/lib/queries";

export const metadata: Metadata = { title: "Invoices" };

export default async function InvoicesPage() {
  const invoices = await getInvoices();
  const billed = invoices.reduce((s, i) => s + (i.fee_amount ?? 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Survey fees billed to insurers. Balance due is worked out by the database, not added by hand."
      />

      <StatRow
        items={[
          { label: "Fees billed", value: npr(billed), hint: `${invoices.length} invoices`, icon: Receipt },
          { label: "Collected", value: npr(collected), icon: CircleCheck },
          {
            label: "Outstanding",
            value: npr(billed - collected),
            hint: billed ? `${Math.round((collected / billed) * 100)}% collected` : undefined,
            icon: Banknote,
            tone: billed - collected > 0 ? "warn" : undefined,
          },
        ]}
      />

      <Card className="mt-6" title="All invoices" description="Open a claim to record a payment">
        <DataTable
          rows={invoices}
          rowKey={(r) => r.claim_id}
          columns={[
            { header: "Invoice", cell: (r) => `INV-${String(r.invoice_id).padStart(4, "0")}` },
            {
              header: "Claim",
              cell: (r) => (
                <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                  {claimNo(r.claim_id)}
                </Link>
              ),
            },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Insurer", cell: (r) => r.insurer_name },
            { header: "Fee", cell: (r) => npr(r.fee_amount), align: "right" },
            { header: "Paid", cell: (r) => npr(r.amount_paid), align: "right" },
            {
              header: "Balance due",
              cell: (r) => <span className="font-semibold text-ink">{npr(r.balance_due)}</span>,
              align: "right",
            },
            { header: "Payment", cell: (r) => <PaymentBadge fee={r.fee_amount ?? 0} paid={r.amount_paid ?? 0} /> },
          ]}
        />
        <SqlPeek sql={INVOICES_SQL} />
      </Card>
    </>
  );
}
