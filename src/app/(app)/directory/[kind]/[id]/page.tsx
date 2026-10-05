import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { History } from "lucide-react";
import { deleteDirectoryEntry, updateDirectoryEntry } from "@/actions/directory";
import { ActionForm } from "@/components/ui/action-form";
import { AuditList } from "@/components/audit/audit-list";
import { DataTable } from "@/components/ui/data-table";
import { DeleteButton } from "@/components/ui/delete-button";
import { DirectoryInput } from "@/components/directory/directory-input";
import { Card, PageHeader, StatusBadge, linkClass } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { DIRECTORY, isDirectoryKind } from "@/lib/directory";
import { claimNo, npr } from "@/lib/format";
import { getAuditLog, getClaimsFor, getDirectoryEntry } from "@/lib/queries";

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
      <Link href={`/directory?tab=${cfg.kind}`} className={`mb-4 ${linkClass}`}>
        ← Directory
      </Link>
      <PageHeader eyebrow={cfg.label} title={name} description={`${claims.length} ${claims.length === 1 ? "claim" : "claims"} linked to this ${cfg.label.toLowerCase()}`} />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6">
          <Card title={`Edit ${cfg.label.toLowerCase()}`}>
            <ActionForm action={updateDirectoryEntry} submitLabel="Save changes">
              <input type="hidden" name="kind" value={cfg.kind} />
              <input type="hidden" name="id" value={recordId} />
              {cfg.fields.map((f) => (
                <DirectoryInput key={f.name} field={f} id={f.name} defaultValue={String(entry[f.name])} />
              ))}
            </ActionForm>
          </Card>

          {user?.role === "admin" && (
          <Card title="Delete">
            <p className="mb-4 text-sm text-muted">
              {claims.length > 0
                ? `This can't be deleted while ${claims.length} ${claims.length === 1 ? "claim uses" : "claims use"} it. Reassign or delete ${claims.length === 1 ? "that claim" : "those claims"} first.`
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

        <div className="space-y-6 xl:col-span-2">
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
                { header: "Type", cell: (r) => r.loss_type, hideBelow: "2xl" },
                { header: "Claimed", cell: (r) => npr(r.claimed_amount), align: "right" },
                { header: "Status", cell: (r) => <StatusBadge status={r.status} /> },
              ]}
            />
          </Card>

          <Card icon={History} title="Change history" description="Every change to this record">
            <AuditList entries={history} empty="No changes since the data was loaded." />
          </Card>
        </div>
      </div>
    </>
  );
}
