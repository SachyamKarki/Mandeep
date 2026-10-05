import type { Metadata } from "next";
import Link from "next/link";
import { Changes, actionTone, actionWord, recordLink, recordName } from "@/components/audit/audit-list";
import { DataTable } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { PAGE_SIZE, Pagination } from "@/components/ui/pagination";
import { Card, PageHeader } from "@/components/ui";
import { requireUser } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { AUDIT_ACTIONS, AUDIT_TABLES, getAuditPage, getAuditUsers } from "@/lib/queries";

export const metadata: Metadata = { title: "Audit trail" };

const TABLE_LABELS: Record<(typeof AUDIT_TABLES)[number], string> = {
  insurer: "Insurers",
  client: "Clients",
  surveyor: "Surveyors",
  claim: "Claims",
  site_visit: "Site visits",
  invoice: "Invoices",
  app_user: "User accounts",
};

function pick(value: string | string[] | undefined, allowed?: readonly string[]) {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  if (allowed && !allowed.includes(v)) return undefined;
  return v.slice(0, 100);
}

/** '2026-10-05 13:45:45' -> '5 Oct 2026, 13:45' */
function when(value: string) {
  const [day, time = ""] = value.split(" ");
  return `${formatDate(day)}, ${time.slice(0, 5)}`;
}

export default async function AuditPage({ searchParams }: PageProps<"/audit">) {
  const user = await requireUser();
  // Login-account changes are for administrators only (staff cannot read app_user in MySQL either).
  const isAdmin = user.role === "admin";
  const tables = isAdmin ? AUDIT_TABLES : AUDIT_TABLES.filter((t) => t !== "app_user");

  const sp = await searchParams;
  const filters = {
    table: pick(sp.table, tables),
    action: pick(sp.action, AUDIT_ACTIONS),
    user: pick(sp.user),
    hideAccounts: !isAdmin,
  };

  const [{ rows: entries, total, page }, users] = await Promise.all([
    getAuditPage(filters, Number(pick(sp.page)) || 1, PAGE_SIZE),
    getAuditUsers(),
  ]);

  return (
    <>
      <PageHeader title="Audit trail" description="A record of every change: what changed, who changed it, and when." />


      <Card
        title={`${total} ${total === 1 ? "change" : "changes"}`}
        description="Newest first"
      >
        <TableToolbar
          basePath="/audit"
          values={{ table: filters.table, action: filters.action, user: filters.user }}
          filters={[
            {
              name: "table",
              label: "Record type",
              options: [{ value: "", label: "All records" }, ...tables.map((t) => ({ value: t, label: TABLE_LABELS[t] }))],
            },
            {
              name: "action",
              label: "Change",
              options: [{ value: "", label: "All changes" }, ...AUDIT_ACTIONS.map((a) => ({ value: a, label: actionWord[a] }))],
            },
            {
              name: "user",
              label: "Changed by",
              options: [{ value: "", label: "Anyone" }, ...users.map((u) => ({ value: u.changed_by, label: u.changed_by }))],
            },
          ]}
        />
        <DataTable
          rows={entries}
          rowKey={(e) => e.audit_id}
          empty="No changes match these filters."
          columns={[
            { header: "When", cell: (e) => when(e.changed_at) },
            {
              header: "Record",
              cell: (e) => {
                const href = recordLink(e);
                return href ? (
                  <Link href={href} className="font-semibold text-ink hover:underline">
                    {recordName(e)}
                  </Link>
                ) : (
                  <span className="font-semibold text-ink">{recordName(e)}</span>
                );
              },
            },
            {
              header: "Change",
              cell: (e) => <span className={cn("font-semibold", actionTone[e.action])}>{actionWord[e.action]}</span>,
            },
            { header: "By", cell: (e) => e.changed_by },
            { header: "Details", cell: (e) => <Changes entry={e} />, wrap: true },
          ]}
        />
        <Pagination total={total} page={page} params={sp} basePath="/audit" />
      </Card>
    </>
  );
}
