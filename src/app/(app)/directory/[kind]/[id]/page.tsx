import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History } from "lucide-react";
import { deleteDirectoryEntry, updateDirectoryEntry } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { AuditList } from "@/components/audit-list";
import { DataTable } from "@/components/data-table";
import { DeleteButton } from "@/components/delete-button";
import { SqlPeek } from "@/components/sql-block";
import { Card, PageHeader, StatusBadge, inputClass, labelClass, linkClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { DIRECTORY, isDirectoryKind } from "@/lib/directory";
import { claimNo, npr } from "@/lib/format";
import { auditLogSql, claimsForSql, getAuditLog, getClaimsFor, getDirectoryEntry } from "@/lib/queries";

async function load(params: Promise<{ kind: string; id: string }>) {
  const { kind, id } = await params;
  const recordId = Number(id);
  if (!isDirectoryKind(kind) || !Number.isInteger(recordId) || recordId <= 0) notFound();
  const entry = await getDirectoryEntry(kind, recordId);
  if (!entry) notFound();
  return { cfg: DIRECTORY[kind], entry, recordId };
}

export async function generateMetadata({ params }: PageProps<"/directory/[kind]/[id]">): Promise<Metadata> {
  const { cfg, entry } = await load(params);
  return { title: `${cfg.label}: ${entry[cfg.fields[0].name]}` };
}

export default async function DirectoryEntryPage({ params }: PageProps<"/directory/[kind]/[id]">) {
  const { cfg, entry, recordId } = await load(params);
  const [claims, history, user] = await Promise.all([
    getClaimsFor(cfg.kind, recordId),
    getAuditLog({ table: cfg.table, record: recordId }),
    getCurrentUser(),
  ]);
  const name = String(entry[cfg.fields[0].name]);

  return (
    <>
      <Link href={`/directory#${cfg.kind}`} className={`mb-4 ${linkClass}`}>
        ← Directory
      </Link>
      <PageHeader eyebrow={cfg.label} title={name} description={`${claims.length} claims linked to this ${cfg.label.toLowerCase()}`} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6">
          <Card title={`Edit ${cfg.label.toLowerCase()}`}>
            <ActionForm action={updateDirectoryEntry} submitLabel="Save changes">
              <input type="hidden" name="kind" value={cfg.kind} />
              <input type="hidden" name="id" value={recordId} />
              {cfg.fields.map((f) => (
                <div key={f.name}>
                  <label htmlFor={f.name} className={labelClass}>
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    required
                    maxLength={f.max}
                    defaultValue={String(entry[f.name])}
                    className={inputClass}
                  />
                </div>
              ))}
            </ActionForm>
          </Card>

          {user?.role === "admin" && (
          <Card title="Delete">
            <p className="mb-4 text-sm text-muted">
              {claims.length > 0
                ? `MySQL will block this while ${claims.length} claims still point here (ON DELETE RESTRICT). Move or delete those claims first.`
                : "No claims use this record, so it can be deleted. The audit trail keeps a copy."}
            </p>
            <DeleteButton
              action={deleteDirectoryEntry}
              fields={{ kind: cfg.kind, id: recordId }}
              label={`Delete ${cfg.label.toLowerCase()}`}
              confirm={`Delete ${name}?`}
            />
          </Card>
          )}
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card title="Linked claims">
            <DataTable
              rows={claims}
              rowKey={(r) => r.claim_id}
              empty="No claims yet."
              columns={[
                {
                  header: "Claim",
                  cell: (r) => (
                    <Link href={`/claims/${r.claim_id}`} className="font-semibold text-ink hover:underline">
                      {claimNo(r.claim_id)}
                    </Link>
                  ),
                },
                cfg.kind === "client"
                  ? { header: "Insurer", cell: (r) => r.insurer_name }
                  : { header: "Client", cell: (r) => r.client_name },
                { header: "Type", cell: (r) => r.loss_type },
                { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
                { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
            <SqlPeek sql={claimsForSql(cfg.kind)} />
          </Card>

          <Card icon={History} title="Change history" description="From audit_log">
            <AuditList entries={history} empty="No changes since the data was loaded." />
            <div className="mt-8">
              <SqlPeek sql={auditLogSql({ table: cfg.table, record: recordId }).sql} />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
