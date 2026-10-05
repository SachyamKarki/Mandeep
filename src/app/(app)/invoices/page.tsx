import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { Pagination, paginate } from "@/components/ui/pagination";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { InvoiceActions } from "@/components/invoices/invoice-actions";
import { Banknote, CircleCheck, Receipt } from "lucide-react";
import { Card, PageHeader, PaymentBadge, StatRow } from "@/components/ui";
import { claimNo, npr } from "@/lib/format";
import { getInvoices } from "@/lib/queries";

export const metadata: Metadata = { title: "Invoices" };

const PAYMENT = [
  { value: "", label: "All payments" },
  { value: "unpaid", label: "Unpaid" },
  { value: "part", label: "Part paid" },
  { value: "paid", label: "Paid" },
];

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 60) || undefined;
}

export default async function InvoicesPage({ searchParams }: PageProps<"/invoices">) {
  const sp = await searchParams;
  const q = one(sp.q);
  const payment = PAYMENT.some((p) => p.value === one(sp.payment)) ? one(sp.payment) : undefined;
  const invoices = await getInvoices();

  const needle = q?.toLowerCase();
  const filtered = invoices.filter((i) => {
    const fee = i.fee_amount ?? 0;
    const paid = i.amount_paid ?? 0;
    const state = paid >= fee ? "paid" : paid > 0 ? "part" : "unpaid";
    const text = [`INV-${String(i.invoice_id).padStart(4, "0")}`, claimNo(i.claim_id), i.client_name, i.insurer_name];
    return (!needle || text.some((t) => t.toLowerCase().includes(needle))) && (!payment || state === payment);
  });
  const { page, rows } = paginate(filtered, sp);
  const billed = invoices.reduce((s, i) => s + (i.fee_amount ?? 0), 0);
  const collected = invoices.reduce((s, i) => s + (i.amount_paid ?? 0), 0);

  return (
    <>
      <PageHeader
        title="Invoices"
        description="Survey fees billed to insurers and payments received."
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
          },
        ]}
      />

      <Card
        className="mt-6"
        title="Invoices"
        description={`${filtered.length} of ${invoices.length} · open a claim to record a payment`}
      >
        <TableToolbar
          basePath="/invoices"
          values={{ q, payment }}
          search={{ name: "q", placeholder: "Search invoice, claim no., client or insurer" }}
          filters={[{ name: "payment", label: "Payment", options: PAYMENT }]}
        />
        <DataTable
          rows={rows}
          rowKey={(r) => r.claim_id}
          columns={[
            { header: "Invoice", cell: (r) => `INV-${String(r.invoice_id).padStart(4, "0")}`, hideBelow: "xl" },
            {
              header: "Claim",
              cell: (r) => (
                <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                  {claimNo(r.claim_id)}
                </Link>
              ),
            },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Insurer", cell: (r) => r.insurer_name, hideBelow: "2xl" },
            { header: "Fee", cell: (r) => npr(r.fee_amount), align: "right", hideBelow: "xl" },
            { header: "Paid", cell: (r) => npr(r.amount_paid), align: "right", hideBelow: "xl" },
            {
              header: "Balance due",
              cell: (r) => <span className="font-semibold text-ink">{npr(r.balance_due)}</span>,
              align: "right",
            },
            { header: "Payment", cell: (r) => <PaymentBadge fee={r.fee_amount ?? 0} paid={r.amount_paid ?? 0} /> },
            { header: "Actions", cell: (r, view) => <InvoiceActions invoice={r} view={view} /> },
          ]}
        />
        <Pagination total={filtered.length} page={page} params={sp} basePath="/invoices" />
      </Card>
    </>
  );
}
