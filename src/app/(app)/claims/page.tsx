import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Pagination, paginate } from "@/components/ui/pagination";
import { NewClaimButton } from "@/components/claims/new-claim-button";
import {
  Card,
  PageHeader,
  StatusBadge,
  rowActionClass,
} from "@/components/ui";
import { claimNo, npr } from "@/lib/format";
import { LOSS_TYPES, STATUSES, getClaims, getDuplicateMap } from "@/lib/queries";

export const metadata: Metadata = { title: "Claims" };

function pick(value: string | string[] | undefined, allowed?: readonly string[]) {
  const v = Array.isArray(value) ? value[0] : value;
  if (!v) return undefined;
  if (allowed && !allowed.includes(v)) return undefined;
  return v.slice(0, 60);
}

export default async function ClaimsPage({ searchParams }: PageProps<"/claims">) {
  const sp = await searchParams;
  const filters = {
    status: pick(sp.status, STATUSES),
    loss_type: pick(sp.loss_type, LOSS_TYPES),
    q: pick(sp.q),
    flag: pick(sp.flag, ["duplicates"]),
  };
  const [found, duplicates] = await Promise.all([getClaims(filters), getDuplicateMap()]);
  const claims = filters.flag ? found.filter((c) => duplicates.has(c.claim_id)) : found;
  const total = claims.reduce((sum, c) => sum + c.claimed_amount, 0);
  const { page, rows } = paginate(claims, sp);

  return (
    <>
      <PageHeader
        title="Claims"
        description="Search, filter and open any claim."
        action={<NewClaimButton />}
      />


      <Card
        title={`${claims.length} ${claims.length === 1 ? "claim" : "claims"}`}
        description={`Total claimed: ${npr(total)}`}
      >
        <TableToolbar
          basePath="/claims"
          values={filters}
          search={{ name: "q", placeholder: "Search claim no., client, insurer or surveyor" }}
          filters={[
            { name: "status", label: "Status", options: [{ value: "", label: "All statuses" }, ...STATUSES.map((s) => ({ value: s, label: s }))] },
            { name: "loss_type", label: "Loss type", options: [{ value: "", label: "All loss types" }, ...LOSS_TYPES.map((t) => ({ value: t, label: t }))] },
            {
              name: "flag",
              label: "Flags",
              options: [
                { value: "", label: "All claims" },
                { value: "duplicates", label: `Possible duplicates (${duplicates.size})` },
              ],
            },
          ]}
        />
        <DataTable
          rows={rows}
          rowKey={(r) => r.claim_id}
          empty="No claims match these filters."
          columns={[
            {
              header: "Claim",
              cell: (r) => (
                <span className="inline-flex flex-col">
                  <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                    {claimNo(r.claim_id)}
                  </Link>
                  {duplicates.has(r.claim_id) && (
                    <span className="text-xs font-semibold text-warn" title="Same client, insurer and loss type as another claim">
                      Possible duplicate
                    </span>
                  )}
                </span>
              ),
            },
            { header: "Client", cell: (r) => r.client_name },
            { header: "Insurer", cell: (r) => r.insurer_name, hideBelow: "xl" },
            { header: "Surveyor", cell: (r) => r.surveyor_name, hideBelow: "2xl" },
            { header: "Type", cell: (r) => r.loss_type },
            { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
            { header: "Visits", cell: (r) => r.visit_count, align: "right", hideBelow: "2xl" },
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
            {
              header: "Actions",
              cell: (r) => (
                <Link href={`/claims/${r.claim_id}/edit`} className={rowActionClass} aria-label={`Edit ${claimNo(r.claim_id)}`}>
                  <Pencil size={13} /> Edit
                </Link>
              ),
            },
          ]}
        />
        <Pagination total={claims.length} page={page} params={sp} basePath="/claims" />
      </Card>
    </>
  );
}
