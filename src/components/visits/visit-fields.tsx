import { inputClass, labelClass, textareaClass } from "@/components/ui";
import { claimNo } from "@/lib/format";
import { FINDINGS_MAX, FINDINGS_MIN, MIN_VISIT_DATE, localToday } from "@/lib/validation";

/**
 * Inputs for a site visit.
 * - New visit: pass `claimId` to fix the claim, or `claims` to choose one.
 * - Editing: pass `edit` with the visit's current values.
 * `idPrefix` keeps ids unique when several of these forms are on one page.
 */
export function VisitFields({
  claimId,
  claims = [],
  edit,
  idPrefix = "visit",
}: {
  claimId?: number;
  claims?: { claim_id: number; client_name: string }[];
  edit?: { visitId: number; date: string; findings: string };
  idPrefix?: string;
}) {
  const today = localToday();

  return (
    <>
      {edit ? (
        <input type="hidden" name="visit_id" value={edit.visitId} />
      ) : claimId ? (
        <input type="hidden" name="claim_id" value={claimId} />
      ) : (
        <div>
          <label htmlFor={`${idPrefix}_claim_id`} className={labelClass}>
            Claim
          </label>
          <select id={`${idPrefix}_claim_id`} name="claim_id" required defaultValue="" className={inputClass}>
            <option value="" disabled>
              Choose claim
            </option>
            {claims.map((c) => (
              <option key={c.claim_id} value={c.claim_id}>
                {claimNo(c.claim_id)} · {c.client_name}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label htmlFor={`${idPrefix}_date`} className={labelClass}>
          Visit date
        </label>
        <input
          id={`${idPrefix}_date`}
          name="visit_date"
          type="date"
          required
          min={MIN_VISIT_DATE}
          max={today}
          defaultValue={edit?.date ?? today}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted">Cannot be in the future.</p>
      </div>
      <div>
        <label htmlFor={`${idPrefix}_findings`} className={labelClass}>
          Findings
        </label>
        <textarea
          id={`${idPrefix}_findings`}
          name="findings"
          rows={4}
          required
          minLength={FINDINGS_MIN}
          maxLength={FINDINGS_MAX}
          defaultValue={edit?.findings}
          placeholder={`What the surveyor found on site (at least ${FINDINGS_MIN} characters)`}
          className={textareaClass}
        />
      </div>
    </>
  );
}
