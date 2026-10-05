import { createClaim } from "@/actions/claims";
import { ClaimFields } from "@/components/claims/claim-fields";
import { ModalForm } from "@/components/ui/modal-form";
import { getClients, getInsurers, getSurveyors } from "@/lib/queries";

/** "New claim" button that opens the claim form in a modal. Saving opens the new claim. */
export async function NewClaimButton() {
  const [insurers, clients, surveyors] = await Promise.all([getInsurers(), getClients(), getSurveyors()]);

  return (
    <ModalForm
      trigger="New claim"
      title="New claim"
      description="New claims start as Open. Missing someone? Add them in the Directory first."
      action={createClaim}
      submitLabel="Save claim"
      size="lg"
    >
      <ClaimFields insurers={insurers} clients={clients} surveyors={surveyors} />
    </ModalForm>
  );
}
