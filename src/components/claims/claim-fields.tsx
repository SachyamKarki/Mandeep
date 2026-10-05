import { inputClass, labelClass } from "@/components/ui";
import { LOSS_TYPES, STATUSES, type Client, type Insurer, type Surveyor } from "@/lib/queries";
import { MAX_CLAIM } from "@/lib/validation";

type Defaults = {
  insurer_id: number;
  client_id: number;
  surveyor_id: number;
  loss_type: string;
  claimed_amount: number;
  status: string;
};

/** Inputs shared by the New claim and Edit claim forms. */
export function ClaimFields({
  insurers,
  clients,
  surveyors,
  defaults,
}: {
  insurers: Insurer[];
  clients: Client[];
  surveyors: Surveyor[];
  defaults?: Defaults;
}) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div>
        <label htmlFor="insurer_id" className={labelClass}>
          Insurer
        </label>
        <select id="insurer_id" name="insurer_id" required defaultValue={defaults?.insurer_id ?? ""} className={inputClass}>
          <option value="" disabled>
            Choose insurer
          </option>
          {insurers.map((i) => (
            <option key={i.insurer_id} value={i.insurer_id}>
              {i.insurer_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="client_id" className={labelClass}>
          Client (insured)
        </label>
        <select id="client_id" name="client_id" required defaultValue={defaults?.client_id ?? ""} className={inputClass}>
          <option value="" disabled>
            Choose client
          </option>
          {clients.map((c) => (
            <option key={c.client_id} value={c.client_id}>
              {c.client_name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="surveyor_id" className={labelClass}>
          Surveyor
        </label>
        <select
          id="surveyor_id"
          name="surveyor_id"
          required
          defaultValue={defaults?.surveyor_id ?? ""}
          className={inputClass}
        >
          <option value="" disabled>
            Choose surveyor
          </option>
          {surveyors.map((s) => (
            <option key={s.surveyor_id} value={s.surveyor_id}>
              {s.surveyor_name} ({s.licence_no})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="loss_type" className={labelClass}>
          Loss type
        </label>
        <select id="loss_type" name="loss_type" required defaultValue={defaults?.loss_type ?? ""} className={inputClass}>
          <option value="" disabled>
            Choose loss type
          </option>
          {LOSS_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="claimed_amount" className={labelClass}>
          Claimed amount (Rs)
        </label>
        <input
          id="claimed_amount"
          name="claimed_amount"
          type="number"
          min="0.01"
          max={MAX_CLAIM}
          step="0.01"
          required
          defaultValue={defaults?.claimed_amount}
          placeholder="e.g. 450000"
          className={inputClass}
        />
      </div>
      {defaults && (
        <div>
          <label htmlFor="status" className={labelClass}>
            Status
          </label>
          <select id="status" name="status" defaultValue={defaults.status} className={inputClass}>
            {STATUSES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
