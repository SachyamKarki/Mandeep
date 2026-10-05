import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClaim } from "@/app/actions";
import { ActionForm } from "@/components/action-form";
import { ClaimFields } from "@/components/claim-fields";
import { SqlPeek } from "@/components/sql-block";
import { Card, PageHeader, linkClass } from "@/components/ui";
import { claimNo } from "@/lib/format";
import { getClaim, getClients, getInsurers, getSurveyors } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit claim" };

const UPDATE_SQL = `UPDATE claim
SET insurer_id = ?, client_id = ?, surveyor_id = ?,
    loss_type = ?, claimed_amount = ?, status = ?
WHERE claim_id = ?;

-- trg_claim_after_update then writes the old and new row to audit_log.`;

export default async function EditClaimPage({ params }: PageProps<"/claims/[id]/edit">) {
  const claimId = Number((await params).id);
  if (!Number.isInteger(claimId) || claimId <= 0) notFound();
  const [claim, insurers, clients, surveyors] = await Promise.all([
    getClaim(claimId),
    getInsurers(),
    getClients(),
    getSurveyors(),
  ]);
  if (!claim) notFound();

  return (
    <>
      <Link href={`/claims/${claimId}`} className={`mb-4 ${linkClass}`}>
        ← Back to {claimNo(claimId)}
      </Link>
      <PageHeader title={`Edit ${claimNo(claimId)}`} description="Every change is saved to the audit trail." />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" title="Claim details">
          <ActionForm action={updateClaim} submitLabel="Save changes">
            <input type="hidden" name="claim_id" value={claimId} />
            <ClaimFields insurers={insurers} clients={clients} surveyors={surveyors} defaults={claim} />
          </ActionForm>
        </Card>
        <Card title="How it is saved">
          <p className="text-sm text-muted">
            One UPDATE changes the row. A MySQL trigger then copies the old and new values into audit_log, so
            nothing is lost.
          </p>
          <SqlPeek sql={UPDATE_SQL} label="View UPDATE statement" />
        </Card>
      </div>
    </>
  );
}
