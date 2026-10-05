import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, ClipboardList, MapPin } from "lucide-react";
import { Pencil } from "lucide-react";
import { addSiteVisit, updateSiteVisit } from "@/actions/visits";
import { DataTable } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Pagination, paginate } from "@/components/ui/pagination";
import { ModalForm } from "@/components/ui/modal-form";
import { Card, PageHeader, StatRow, StatusBadge } from "@/components/ui";
import { VisitFields } from "@/components/visits/visit-fields";
import { claimNo, formatDate } from "@/lib/format";
import { STATUSES, getAllVisits, getClaims } from "@/lib/queries";

export const metadata: Metadata = { title: "Site visits" };

export default async function VisitsPage({ searchParams }: PageProps<"/visits">) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 60) ?? "";
  const [all, claims] = await Promise.all([getAllVisits(), getClaims({})]);

  const statusParam = Array.isArray(sp.status) ? sp.status[0] : sp.status;
  const status = STATUSES.find((s) => s === statusParam);
  const needle = q.toLowerCase();
  const visits = all.filter(
    (v) =>
      (!needle ||
        [claimNo(v.claim_id), v.client_name, v.surveyor_name, v.findings].some((s) => s.toLowerCase().includes(needle))) &&
      (!status || v.status === status),
  );

  const { page, rows } = paginate(visits, sp);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const claimsVisited = new Set(all.map((v) => v.claim_id)).size;
  const notVisited = claims.filter((c) => c.status !== "Closed" && c.visit_count === 0).length;

  return (
    <>
      <PageHeader
        title="Site visits"
        description="Every survey visit across all claims, newest first."
        action={
          <ModalForm
            trigger="Add visit"
            title="Record a site visit"
            action={addSiteVisit}
            submitLabel="Add visit"
          >
            <VisitFields claims={claims.filter((c) => c.status !== "Closed")} />
          </ModalForm>
        }
      />

      <StatRow
        items={[
          { label: "Total visits", value: String(all.length), icon: MapPin },
          {
            label: "This month",
            value: String(all.filter((v) => v.visit_date.startsWith(thisMonth)).length),
            icon: CalendarCheck,
          },
          {
            label: "Open claims not visited",
            value: String(notVisited),
            hint: `${claimsVisited} claims visited so far`,
            icon: ClipboardList,
          },
        ]}
      />


      <Card className="mt-6" title={`${visits.length} ${visits.length === 1 ? "visit" : "visits"}`}>
        <TableToolbar
          basePath="/visits"
          values={{ q: q || undefined, status }}
          search={{ name: "q", placeholder: "Search claim no., client, surveyor or findings" }}
          filters={[
            {
              name: "status",
              label: "Claim status",
              options: [{ value: "", label: "All claim statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))],
            },
          ]}
        />
        <DataTable
          rows={rows}
          rowKey={(r) => r.visit_id}
          empty="No site visits match."
          columns={[
            { header: "Date", cell: (r) => <span className="font-semibold text-ink">{formatDate(r.visit_date)}</span> },
            {
              header: "Claim",
              cell: (r) => (
                <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                  {claimNo(r.claim_id)}
                </Link>
              ),
            },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Surveyor", cell: (r) => r.surveyor_name, hideBelow: "2xl" },
            { header: "Findings", cell: (r) => r.findings, wrap: true },
            { header: "Claim status", cell: (r) => <StatusBadge status={r.status} />, hideBelow: "xl" },
            {
              header: "Actions",
              cell: (r, view) => (
                <ModalForm
                  trigger="Edit"
                  icon={<Pencil size={13} />}
                  variant="link"
                  title={`Edit site visit · ${claimNo(r.claim_id)}`}
                  description={r.client_name}
                  action={updateSiteVisit}
                  submitLabel="Save visit"
                >
                  <VisitFields
                    idPrefix={`${view}_v${r.visit_id}`}
                    edit={{ visitId: r.visit_id, date: r.visit_date, findings: r.findings }}
                  />
                </ModalForm>
              ),
            },
          ]}
        />
        <Pagination total={visits.length} page={page} params={sp} basePath="/visits" />
      </Card>
    </>
  );
}
