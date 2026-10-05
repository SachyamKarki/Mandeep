import Link from "next/link";
import { cn } from "@/lib/cn";
import { claimNo, npr } from "@/lib/format";
import type { AuditEntry } from "@/lib/queries";
import { EmptyState } from "@/components/ui";

export const actionTone = {
  INSERT: "text-ok-fill",
  UPDATE: "text-warn",
  DELETE: "text-danger",
};

export const actionWord = { INSERT: "Added", UPDATE: "Edited", DELETE: "Deleted" };

export const tableLabel: Record<AuditEntry["table_name"], string> = {
  insurer: "Insurer",
  client: "Client",
  surveyor: "Surveyor",
  claim: "Claim",
  site_visit: "Site visit",
  invoice: "Invoice",
  app_user: "User",
};

const MONEY = /amount|fee|paid/;

const label = (key: string) => key.replace(/_/g, " ");

const HIDDEN_FIELD = /(_id|_at)$|^password|^is_active$/;

function show(key: string, value: unknown) {
  if (value == null) return "NULL";
  if (typeof value === "number" && MONEY.test(key)) return npr(value);
  const s = String(value);
  return s.length > 80 ? `${s.slice(0, 80)}…` : s;
}

export function recordLink(e: AuditEntry) {
  const data = e.new_data ?? e.old_data ?? {};
  const claimId = e.table_name === "claim" ? e.record_id : (data.claim_id as number | undefined);
  if (claimId && e.action !== "DELETE") return `/claims/${claimId}`;
  if (e.table_name === "app_user") return "/users";
  if (["insurer", "client", "surveyor"].includes(e.table_name) && e.action !== "DELETE") {
    return `/directory/${e.table_name}/${e.record_id}`;
  }
  return null;
}

export function Changes({ entry }: { entry: AuditEntry }) {
  const { action, old_data: before, new_data: after } = entry;

  if (action === "UPDATE" && before && after) {
    const changed = Object.keys(after).filter((k) => JSON.stringify(before[k]) !== JSON.stringify(after[k]));
    return (
      <ul className="space-y-1">
        {changed.map((k) => (
          <li key={k} className="text-sm">
            <span className="text-xs text-muted">{label(k)}</span>{" "}
            <span className="text-danger line-through decoration-danger/50">{show(k, before[k])}</span>
            <span className="mx-1.5 text-faint">→</span>
            <span className="font-medium text-ok">{show(k, after[k])}</span>
          </li>
        ))}
      </ul>
    );
  }

  // Added / deleted rows: the few fields a person cares about, not ids or timestamps.
  const data = Object.entries(after ?? before ?? {})
    .filter(([k]) => !HIDDEN_FIELD.test(k))
    .slice(0, 4);
  return (
    <p className="text-sm text-ink-soft">
      {data.map(([k, v], i) => (
        <span key={k}>
          {i > 0 && <span className="text-faint"> · </span>}
          <span className="text-xs text-muted">{label(k)}</span> {show(k, v)}
        </span>
      ))}
    </p>
  );
}

export function AuditList({ entries, empty = "No changes recorded yet." }: { entries: AuditEntry[]; empty?: string }) {
  if (entries.length === 0) return <EmptyState>{empty}</EmptyState>;

  return (
    <ol className="-mx-4 -my-4 divide-y divide-border">
      {entries.map((e) => {
        const href = recordLink(e);
        const name =
          e.table_name === "claim" ? claimNo(e.record_id) : `${tableLabel[e.table_name]} #${e.record_id}`;
        return (
          <li key={e.audit_id} className="px-4 py-3">
            <div className="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span
                className={cn("font-semibold", actionTone[e.action])}
              >
                {actionWord[e.action]}
              </span>
              <span className="font-semibold text-ink">
                {href ? (
                  <Link href={href} className="hover:underline">
                    {name}
                  </Link>
                ) : (
                  name
                )}
              </span>
              {e.table_name !== "claim" && <span className="text-muted">({tableLabel[e.table_name]})</span>}
              <span className="ml-auto text-xs text-muted">
                {e.changed_by} · {e.changed_at}
              </span>
            </div>
            <Changes entry={e} />
          </li>
        );
      })}
    </ol>
  );
}

/** "CLM-0003" for claims, "Site visit #12" for everything else. */
export function recordName(e: AuditEntry) {
  return e.table_name === "claim" ? claimNo(e.record_id) : `${tableLabel[e.table_name]} #${e.record_id}`;
}
