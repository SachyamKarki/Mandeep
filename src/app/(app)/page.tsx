import Link from "next/link";
import { ArrowUpRight, Banknote, ClipboardList, FileWarning, PieChart, Receipt, Wallet } from "lucide-react";
import { DataTable } from "@/components/data-table";
import { SqlPeek } from "@/components/sql-block";
import {
  Bar,
  Card,
  PageHeader,
  PaymentBadge,
  StatRow,
  StatusBadge,
  buttonClass,
  linkClass,
} from "@/components/ui";
import { claimNo, formatDate, npr } from "@/lib/format";
import {
  DASHBOARD_STATS_SQL,
  LOSS_TYPE_SUMMARY_SQL,
  OPEN_CLAIMS_SQL,
  UNPAID_INVOICES_SQL,
  getDashboardStats,
  getLossTypeSummary,
  getOpenClaims,
  getUnpaidInvoices,
} from "@/lib/queries";

export default async function DashboardPage() {
  const [stats, openClaims, unpaid, lossTypes] = await Promise.all([
    getDashboardStats(),
    getOpenClaims(),
    getUnpaidInvoices(),
    getLossTypeSummary(),
  ]);
  const maxClaimed = Math.max(...lossTypes.map((l) => l.total_claimed), 1);

  return (
    <>
      <PageHeader
        eyebrow="Mangaldeep Consulting"
        title="Dashboard"
        description="Open claims and unpaid survey fees at a glance, read live from the MySQL database."
        action={
          <Link href="/claims/new" className={buttonClass}>
            New claim
          </Link>
        }
      />

      <StatRow
        items={[
          {
            label: "Open claims",
            value: String(stats.open_claims),
            hint: `of ${stats.total_claims} claims in total`,
            icon: ClipboardList,
          },
          { label: "Value under survey", value: npr(stats.open_value), hint: "Claimed on open claims", icon: Wallet },
          { label: "Fees billed", value: npr(stats.fees_billed), icon: Receipt },
          {
            label: "Fees outstanding",
            value: npr(stats.fees_outstanding),
            hint: `${unpaid.length} invoices still owing`,
            icon: Banknote,
            tone: stats.fees_outstanding > 0 ? "warn" : undefined,
          },
        ]}
      />
      <SqlPeek sql={DASHBOARD_STATS_SQL} label="View SQL for these figures" />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card
          className="lg:col-span-2"
          icon={ClipboardList}
          title="Open claims"
          description="Claims that are not closed yet"
          action={
            <Link href="/claims?status=Open" className={linkClass}>
              View all <ArrowUpRight size={15} />
            </Link>
          }
        >
          <DataTable
            rows={openClaims}
            rowKey={(r) => r.claim_id}
            empty="No open claims."
            columns={[
              {
                header: "Claim",
                cell: (r) => (
                  <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                    {claimNo(r.claim_id)}
                  </Link>
                ),
              },
              { header: "Client", cell: (r) => r.client_name },
              { header: "Type", cell: (r) => r.loss_type },
              { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
              { header: "Visits", cell: (r) => r.visit_count, align: "right" },
              { header: "Last visit", cell: (r) => formatDate(r.last_visit) },
              { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
          <SqlPeek sql={OPEN_CLAIMS_SQL} />
        </Card>

        <Card icon={PieChart} title="Claims by loss type" description="Total amount claimed">
          <ul className="space-y-5">
            {lossTypes.map((l) => (
              <li key={l.loss_type}>
                <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                  <span className="font-medium text-ink">
                    {l.loss_type} <span className="font-normal text-muted">· {l.claims} claims</span>
                  </span>
                  <span className="font-semibold tabular-nums text-ink">{npr(l.total_claimed)}</span>
                </div>
                <Bar pct={(l.total_claimed / maxClaimed) * 100} />
              </li>
            ))}
          </ul>
          <SqlPeek sql={LOSS_TYPE_SUMMARY_SQL} />
        </Card>
      </div>

      <Card
        className="mt-6"
        icon={FileWarning}
        title="Unpaid fees"
        description="Invoices with money still owing, from the v_unpaid_invoices view"
        action={
          <Link href="/invoices" className={linkClass}>
            All invoices <ArrowUpRight size={15} />
          </Link>
        }
      >
        <DataTable
          rows={unpaid}
          rowKey={(r) => r.invoice_id}
          empty="All fees are paid."
          columns={[
            {
              header: "Claim",
              cell: (r) => (
                <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                  {claimNo(r.claim_id)}
                </Link>
              ),
            },
            { header: "Insurer", cell: (r) => r.insurer_name },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Fee", cell: (r) => npr(r.fee_amount), align: "right" },
            { header: "Paid", cell: (r) => npr(r.amount_paid), align: "right" },
            {
              header: "Balance due",
              cell: (r) => <span className="font-semibold text-ink">{npr(r.balance_due)}</span>,
              align: "right",
            },
            { header: "Status", cell: (r) => <PaymentBadge fee={r.fee_amount} paid={r.amount_paid} /> },
          ]}
        />
        <SqlPeek sql={UNPAID_INVOICES_SQL} />
      </Card>
    </>
  );
}
