import type { Metadata } from "next";
import Link from "next/link";
import { createClaim } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { ClaimFields } from "@/components/claim-fields";
import { SqlPeek } from "@/components/sql-block";
import { Card, PageHeader } from "@/components/ui";
import { getClients, getInsurers, getSurveyors } from "@/lib/queries";

export const metadata: Metadata = { title: "New claim" };

const INSERT_SQL = `INSERT INTO claim (insurer_id, client_id, surveyor_id, loss_type, claimed_amount, status)
VALUES (?, ?, ?, ?, ?, 'Open');`;

export default async function NewClaimPage() {
  const [insurers, clients, surveyors] = await Promise.all([getInsurers(), getClients(), getSurveyors()]);

  return (
    <>
      <PageHeader
        title="New claim"
        description="Pick the insurer, client and surveyor from the lists, so their details are never typed twice."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Claim details">
          <ActionForm action={createClaim} submitLabel="Save claim">
            <ClaimFields insurers={insurers} clients={clients} surveyors={surveyors} />
          </ActionForm>
        </Card>

        <Card title="How it is saved">
          <p className="text-sm text-muted">
            The claim row stores only the three IDs. Foreign keys make sure each one exists, and the CHECK
            constraint rejects amounts of 0 or less. New claims start as <strong>Open</strong>.
          </p>
          <SqlPeek sql={INSERT_SQL} label="View INSERT statement" />
          <p className="mt-4 text-sm text-muted">
            Missing someone?{" "}
            <Link href="/directory" className="font-semibold text-accent hover:underline">
              Add them in the directory
            </Link>
            .
          </p>
        </Card>
      </div>
    </>
  );
}
