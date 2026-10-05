import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { updateClaim } from "@/actions/claims";
import { ActionForm } from "@/components/ui/action-form";
import { ClaimFields } from "@/components/claims/claim-fields";
import { Card, PageHeader, linkClass } from "@/components/ui";
import { claimNo } from "@/lib/format";
import { getClaim, getClients, getInsurers, getSurveyors } from "@/lib/queries";

export const metadata: Metadata = { title: "Edit claim" };

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

      <div className="max-w-3xl">
        <Card title="Claim details">
          <ActionForm action={updateClaim} submitLabel="Save changes">
            <input type="hidden" name="claim_id" value={claimId} />
            <ClaimFields insurers={insurers} clients={clients} surveyors={surveyors} defaults={claim} />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
