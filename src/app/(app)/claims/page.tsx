import type { Metadata } from "next";
import Link from "next/link";
import { DataTable } from "@/components/data-table";
import { SqlPeek } from "@/components/sql-block";
import {
  Card,
  PageHeader,
  StatusBadge,
  buttonClass,
  inputClass,
  labelClass,
  secondaryButtonClass,
} from "@/components/ui";
import { claimNo, npr } from "@/lib/format";
import { LOSS_TYPES, STATUSES, claimListSql, getClaims } from "@/lib/queries";

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
  };
  const claims = await getClaims(filters);
  const { sql, params } = claimListSql(filters);
  const total = claims.reduce((sum, c) => sum + c.claimed_amount, 0);

  return (
    <>
      <PageHeader
        title="Claims"
        description="Every claim is stored once and linked to its insurer, client and surveyor."
        action={
          <Link href="/claims/new" className={buttonClass}>
            New claim
          </Link>
        }
      />

      <Card>
        <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_180px_180px_auto]">
          <div>
            <label htmlFor="q" className={labelClass}>
              Search client or insurer
            </label>
            <input id="q" name="q" defaultValue={filters.q} placeholder="e.g. Himal" className={inputClass} />
          </div>
          <div>
            <label htmlFor="status" className={labelClass}>
              Status
            </label>
            <select id="status" name="status" defaultValue={filters.status ?? ""} className={inputClass}>
              <option value="">All</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loss_type" className={labelClass}>
              Loss type
            </label>
            <select id="loss_type" name="loss_type" defaultValue={filters.loss_type ?? ""} className={inputClass}>
              <option value="">All</option>
              {LOSS_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <button type="submit" className={buttonClass}>
              Filter
            </button>
            <Link href="/claims" className={secondaryButtonClass}>
              Clear
            </Link>
          </div>
        </form>
      </Card>

      <Card
        className="mt-6"
        title={`${claims.length} ${claims.length === 1 ? "claim" : "claims"}`}
        description={`Total claimed: ${npr(total)}`}
      >
        <DataTable
          rows={claims}
          rowKey={(r) => r.claim_id}
          empty="No claims match these filters."
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
            { header: "Insurer", cell: (r) => r.insurer_name },
            { header: "Surveyor", cell: (r) => r.surveyor_name },
            { header: "Type", cell: (r) => r.loss_type },
            { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
            { header: "Visits", cell: (r) => r.visit_count, align: "right" },
            { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
        <SqlPeek
          sql={params.length ? `${sql}\n\n-- parameters: ${params.map((p) => `'${p}'`).join(", ")}` : sql}
        />
      </Card>
    </>
  );
}
