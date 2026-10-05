import type { Metadata } from "next";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { addDirectoryEntry, updateDirectoryEntry } from "@/actions/directory";
import { DataTable } from "@/components/ui/data-table";
import { DirectoryInput } from "@/components/directory/directory-input";
import { ModalForm } from "@/components/ui/modal-form";
import { Pagination, paginate } from "@/components/ui/pagination";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { Card, PageHeader } from "@/components/ui";
import { cn } from "@/lib/cn";
import { DIRECTORY, isDirectoryKind, type DirectoryKind } from "@/lib/directory";
import { getClients, getInsurers, getSurveyors } from "@/lib/queries";

export const metadata: Metadata = { title: "Directory" };

type Row = { id: number; name: string; detail: string; claims: number };

const DETAIL_HEADER: Record<DirectoryKind, string> = { insurer: "Phone", client: "Phone", surveyor: "Licence no." };

const USAGE = [
  { value: "", label: "All records" },
  { value: "used", label: "Used on claims" },
  { value: "unused", label: "Not used yet" },
];

function one(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 60) || undefined;
}

export default async function DirectoryPage({ searchParams }: PageProps<"/directory">) {
  const sp = await searchParams;
  const tabParam = one(sp.tab) ?? "insurer";
  const tab: DirectoryKind = isDirectoryKind(tabParam) ? tabParam : "insurer";
  const q = one(sp.q);
  const usage = USAGE.some((u) => u.value === one(sp.usage)) ? one(sp.usage) : undefined;

  const [insurers, clients, surveyors] = await Promise.all([getInsurers(), getClients(), getSurveyors()]);
  const all: Record<DirectoryKind, Row[]> = {
    insurer: insurers.map((r) => ({ id: r.insurer_id, name: r.insurer_name, detail: r.phone, claims: r.claims })),
    client: clients.map((r) => ({ id: r.client_id, name: r.client_name, detail: r.phone, claims: r.claims })),
    surveyor: surveyors.map((r) => ({ id: r.surveyor_id, name: r.surveyor_name, detail: r.licence_no, claims: r.claims })),
  };

  const cfg = DIRECTORY[tab];
  const needle = q?.toLowerCase();
  const filtered = all[tab].filter(
    (r) =>
      (!needle || r.name.toLowerCase().includes(needle) || r.detail.toLowerCase().includes(needle)) &&
      (usage !== "used" || r.claims > 0) &&
      (usage !== "unused" || r.claims === 0),
  );
  const { page, rows } = paginate(filtered, sp);

  return (
    <>
      <PageHeader title="Directory" description="Insurers, clients and surveyors used on claims." />

      {/* Tabs: one list at a time, with record counts. */}
      <nav aria-label="Directory sections" className="mb-4 flex flex-wrap gap-1 border-b border-border">
        {(Object.keys(DIRECTORY) as DirectoryKind[]).map((k) => (
          <Link
            key={k}
            href={`/directory?tab=${k}`}
            aria-current={k === tab ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors",
              k === tab ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {DIRECTORY[k].plural}
            <span className={cn("rounded-sm px-1.5 text-xs tabular-nums", k === tab ? "bg-ink text-surface" : "bg-subtle")}>
              {all[k].length}
            </span>
          </Link>
        ))}
      </nav>

      <Card
        title={cfg.plural}
        description={`${filtered.length} of ${all[tab].length} · open a name to view or edit`}
        action={
          <ModalForm
            trigger={`Add ${cfg.label.toLowerCase()}`}
            title={`Add ${cfg.label.toLowerCase()}`}
            action={addDirectoryEntry}
            submitLabel={`Add ${cfg.label.toLowerCase()}`}
          >
            <input type="hidden" name="kind" value={cfg.kind} />
            {cfg.fields.map((f) => (
              <DirectoryInput key={f.name} field={f} id={`${cfg.kind}_${f.name}`} />
            ))}
          </ModalForm>
        }
      >
        <TableToolbar
          basePath="/directory"
          keep={{ tab }}
          values={{ q, usage }}
          search={{
            name: "q",
            placeholder: tab === "surveyor" ? "Search name or licence number" : "Search name or phone",
          }}
          filters={[{ name: "usage", label: "Usage", options: USAGE }]}
        />
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
          empty={q || usage ? "Nothing matches this search." : `No ${cfg.plural.toLowerCase()} yet.`}
          columns={[
            { header: "ID", cell: (r) => r.id },
            {
              header: cfg.label,
              cell: (r) => (
                <Link href={`/directory/${cfg.kind}/${r.id}`} className="font-semibold text-ink hover:underline">
                  {r.name}
                </Link>
              ),
            },
            { header: DETAIL_HEADER[tab], cell: (r) => r.detail },
            { header: "Claims", cell: (r) => r.claims, align: "right" },
            {
              header: "Actions",
              cell: (r, view) => (
                <ModalForm
                  trigger="Edit"
                  icon={<Pencil size={13} />}
                  variant="link"
                  title={`Edit ${cfg.label.toLowerCase()}`}
                  description={r.name}
                  action={updateDirectoryEntry}
                  submitLabel="Save changes"
                >
                  <input type="hidden" name="kind" value={cfg.kind} />
                  <input type="hidden" name="id" value={r.id} />
                  {cfg.fields.map((f, i) => (
                    <DirectoryInput
                      key={f.name}
                      field={f}
                      id={`${view}_${cfg.kind}${r.id}_${f.name}`}
                      defaultValue={i === 0 ? r.name : r.detail}
                    />
                  ))}
                </ModalForm>
              ),
            },
          ]}
        />
        <Pagination total={filtered.length} page={page} params={sp} basePath="/directory" />
      </Card>
    </>
  );
}
