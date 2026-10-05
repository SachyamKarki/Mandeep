import Link from "next/link";
import {
  ArrowUpRight,
  Banknote,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
  FileWarning,
  MapPin,
  PieChart,
  Receipt,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import {
  Bar,
  Card,
  PageHeader,
  PaymentBadge,
  StatRow,
  StatusBadge,
  linkClass,
  panelClass,
} from "@/components/ui";
import { claimNo, formatDate, npr } from "@/lib/format";
import {
  getDashboardStats,
  getLossTypeSummary,
  getOpenClaims,
  getUnpaidInvoices,
} from "@/lib/queries";

function Shortcut({ href, icon: Icon, label, hint }: { href: string; icon: LucideIcon; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className={`${panelClass} group flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:border-ink/40 hover:bg-subtle`}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-sm bg-subtle text-accent group-hover:bg-surface">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block truncate text-xs text-muted">{hint}</span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-faint group-hover:text-ink" />
    </Link>
  );
}

export default async function DashboardPage() {
  const [stats, openClaims, unpaid, lossTypes] = await Promise.all([
    getDashboardStats(),
    getOpenClaims(),
    getUnpaidInvoices(),
    getLossTypeSummary(),
  ]);
  const recentOpen = openClaims.slice(0, 8);
  const topUnpaid = unpaid.slice(0, 8);
  const maxClaimed = Math.max(...lossTypes.map((l) => l.total_claimed), 1);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Open claims and unpaid survey fees at a glance."
      />

      <StatRow
        items={[
          {
            label: "Open claims",
            value: String(stats.open_claims),
            hint: `of ${stats.total_claims} claims in total`,
            icon: ClipboardList,
          },
          { label: "Under survey", value: npr(stats.open_value), hint: "Claimed on open claims", icon: Wallet },
          { label: "Fees billed", value: npr(stats.fees_billed), icon: Receipt },
          {
            label: "Fees outstanding",
            value: npr(stats.fees_outstanding),
            hint: `${unpaid.length} invoices still owing`,
            icon: Banknote,
          },
        ]}
      />

      <nav aria-label="Shortcuts" className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Shortcut href="/claims" icon={FileText} label="Claims" hint={`${stats.total_claims} claims · search and filter`} />
        <Shortcut href="/visits" icon={MapPin} label="Site visits" hint="Every survey visit, newest first" />
        <Shortcut href="/invoices" icon={Receipt} label="Invoices" hint={`${unpaid.length} still owing`} />
        <Shortcut href="/directory" icon={Building2} label="Directory" hint="Insurers, clients and surveyors" />
      </nav>

      <div className="mt-6 space-y-6">
        <Card
          icon={ClipboardList}
          title="Open claims"
          description={`${openClaims.length} claims not closed yet`}
          action={
            <Link href="/claims?status=Open" className={linkClass}>
              View all <ArrowUpRight size={15} />
            </Link>
          }
        >
          <DataTable
            rows={recentOpen}
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
              { header: "Type", cell: (r) => r.loss_type, hideBelow: "xl" },
              { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
              { header: "Last visit", cell: (r) => formatDate(r.last_visit) },
              { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            ]}
          />
        </Card>

        <Card icon={PieChart} title="Claims by loss type" description="Total amount claimed">
          <ul className="grid gap-5 md:grid-cols-3 md:gap-8">
            {lossTypes.map((l) => (
              <li key={l.loss_type}>
                <div className="mb-2 flex items-baseline justify-between gap-4 text-sm">
                  <span className="min-w-0 truncate font-medium text-ink">
                    {l.loss_type} <span className="font-normal text-muted">· {l.claims} claims</span>
                  </span>
                  <span className="font-semibold whitespace-nowrap tabular-nums text-ink">{npr(l.total_claimed)}</span>
                </div>
                <Bar pct={(l.total_claimed / maxClaimed) * 100} />
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card
        className="mt-6"
        icon={FileWarning}
        title="Unpaid fees"
        description={`${unpaid.length} invoices with money still owing`}
        action={
          <Link href="/invoices" className={linkClass}>
            All invoices <ArrowUpRight size={15} />
          </Link>
        }
      >
        <DataTable
          rows={topUnpaid}
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
            { header: "Insurer", cell: (r) => r.insurer_name, hideBelow: "xl" },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Fee", cell: (r) => npr(r.fee_amount), align: "right" },
            { header: "Paid", cell: (r) => npr(r.amount_paid), align: "right", hideBelow: "xl" },
            {
              header: "Balance due",
              cell: (r) => <span className="font-semibold text-ink">{npr(r.balance_due)}</span>,
              align: "right",
            },
            { header: "Status", cell: (r) => <PaymentBadge fee={r.fee_amount} paid={r.amount_paid} /> },
          ]}
        />
      </Card>
    </>
  );
}
