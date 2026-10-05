import type { Metadata } from "next";
import Link from "next/link";
import { Building2, HardHat, Users } from "lucide-react";
import { addDirectoryEntry } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { DataTable } from "@/components/data-table";
import { SqlPeek } from "@/components/sql-block";
import { Card, PageHeader, inputClass, labelClass } from "@/components/ui";
import { DIRECTORY, type DirectoryConfig } from "@/lib/directory";
import { CLIENTS_SQL, INSURERS_SQL, SURVEYORS_SQL, getClients, getInsurers, getSurveyors } from "@/lib/queries";

export const metadata: Metadata = { title: "Directory" };

type Row = { id: number; name: string; detail: string; claims: number };

function AddForm({ cfg }: { cfg: DirectoryConfig }) {
  return (
    <ActionForm
      action={addDirectoryEntry}
      submitLabel={`Add ${cfg.label.toLowerCase()}`}
      className="mt-8 grid gap-4 border-t border-border pt-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
    >
      <input type="hidden" name="kind" value={cfg.kind} />
      {cfg.fields.map((f) => (
        <div key={f.name}>
          <label htmlFor={`${cfg.kind}_${f.name}`} className={labelClass}>
            {f.label}
          </label>
          <input
            id={`${cfg.kind}_${f.name}`}
            name={f.name}
            required
            maxLength={f.max}
            placeholder={f.placeholder}
            className={inputClass}
          />
        </div>
      ))}
    </ActionForm>
  );
}

function Section({
  cfg,
  rows,
  detailHeader,
  sql,
  icon,
}: {
  cfg: DirectoryConfig;
  rows: Row[];
  detailHeader: string;
  sql: string;
  icon: typeof Building2;
}) {
  return (
    <div id={cfg.kind} className="scroll-mt-6">
      <Card icon={icon} title={cfg.plural} description={`${rows.length} records · click a name to edit or delete`}>
        <DataTable
          rows={rows}
          rowKey={(r) => r.id}
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
            { header: detailHeader, cell: (r) => r.detail },
            { header: "Claims", cell: (r) => r.claims, align: "right" },
          ]}
        />
        <SqlPeek sql={sql} />
        <AddForm cfg={cfg} />
      </Card>
    </div>
  );
}

export default async function DirectoryPage() {
  const [insurers, clients, surveyors] = await Promise.all([getInsurers(), getClients(), getSurveyors()]);

  return (
    <>
      <PageHeader
        title="Directory"
        description="Insurers, clients and surveyors are each stored once. Claims point to them by ID."
      />

      <div className="space-y-6">
        <Section
          cfg={DIRECTORY.insurer}
          icon={Building2}
          detailHeader="Phone"
          sql={INSURERS_SQL}
          rows={insurers.map((r) => ({ id: r.insurer_id, name: r.insurer_name, detail: r.phone, claims: r.claims }))}
        />
        <Section
          cfg={DIRECTORY.client}
          icon={Users}
          detailHeader="Phone"
          sql={CLIENTS_SQL}
          rows={clients.map((r) => ({ id: r.client_id, name: r.client_name, detail: r.phone, claims: r.claims }))}
        />
        <Section
          cfg={DIRECTORY.surveyor}
          icon={HardHat}
          detailHeader="Licence no."
          sql={SURVEYORS_SQL}
          rows={surveyors.map((r) => ({
            id: r.surveyor_id,
            name: r.surveyor_name,
            detail: r.licence_no,
            claims: r.claims,
          }))}
        />
      </div>
    </>
  );
}
