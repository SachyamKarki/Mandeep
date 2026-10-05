import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AlertTriangle, History, Pencil } from "lucide-react";
import { deleteClaim, updateClaimStatus } from "@/actions/claims";
import { createInvoice, deleteInvoice, recordPayment, updateInvoice } from "@/actions/invoices";
import { addSiteVisit, deleteSiteVisit, updateSiteVisit } from "@/actions/visits";
import { ActionForm } from "@/components/ui/action-form";
import { AuditList } from "@/components/audit/audit-list";
import { DeleteButton } from "@/components/ui/delete-button";
import { ModalForm } from "@/components/ui/modal-form";
import { VisitFields } from "@/components/visits/visit-fields";
import {
  Card,
  EmptyState,
  PageHeader,
  PaymentBadge,
  StatusBadge,
  inputClass,
  labelClass,
  linkClass,
  rowActionClass,
  secondaryButtonClass,
  textareaClass,
} from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { claimNo, formatDate, npr } from "@/lib/format";
import { STATUSES, getClaim, getClaimHistory, getDuplicateMap, getVisitsForClaim } from "@/lib/queries";
import { FINDINGS_MAX, FINDINGS_MIN, MAX_FEE, MIN_VISIT_DATE, localToday } from "@/lib/validation";

async function loadClaim(params: Promise<{ id: string }>) {
  const { id } = await params;
  const claimId = Number(id);
  if (!Number.isInteger(claimId) || claimId <= 0) notFound();
  const claim = await getClaim(claimId);
  if (!claim) notFound();
  return claim;
}

export async function generateMetadata({ params }: PageProps<"/claims/[id]">): Promise<Metadata> {
  const claim = await loadClaim(params);
  return { title: claimNo(claim.claim_id) };
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="mt-0.5 text-base font-medium text-ink">{children}</dd>
    </div>
  );
}

const summaryClass = rowActionClass;

export default async function ClaimPage({ params }: PageProps<"/claims/[id]">) {
  const claim = await loadClaim(params);
  const [visits, history, user, duplicates] = await Promise.all([
    getVisitsForClaim(claim.claim_id),
    getClaimHistory(claim.claim_id),
    getCurrentUser(),
    getDuplicateMap(),
  ]);
  const sameAs = duplicates.get(claim.claim_id) ?? [];
  const isAdmin = user?.role === "admin";
  const isClosed = claim.status === "Closed";

  return (
    <>
      <Link href="/claims" className={`mb-4 ${linkClass}`}>
        ← All claims
      </Link>
      <PageHeader
        title={`${claimNo(claim.claim_id)} · ${claim.client_name}`}
        description={`${claim.loss_type} claim with ${claim.insurer_name}`}
        action={
          <div className="flex flex-wrap items-start gap-2">
            <span className="flex h-9 items-center">
              <StatusBadge status={claim.status} />
            </span>
            <Link href={`/claims/${claim.claim_id}/edit`} className={secondaryButtonClass}>
              <Pencil size={15} /> Edit claim
            </Link>
            {isAdmin && (
              <DeleteButton
                action={deleteClaim}
                fields={{ claim_id: claim.claim_id }}
                label="Delete claim"
                confirm={`Delete ${claimNo(claim.claim_id)} with its ${visits.length} site visits and invoice? The audit trail keeps a copy.`}
              />
            )}
          </div>
        }
      />

      {sameAs.length > 0 && (
        <div
          role="note"
          className="mb-6 flex items-start gap-2.5 rounded-md border border-warn-line bg-warn-soft px-4 py-3 text-sm text-warn"
        >
          <AlertTriangle size={17} className="mt-0.5 shrink-0" />
          <p>
            <strong>Possible duplicate.</strong> {sameAs.length === 1 ? "Another claim has" : "Other claims have"} the
            same client, insurer and loss type:{" "}
            {sameAs.map((id, i) => (
              <span key={id}>
                {i > 0 && ", "}
                <Link href={`/claims/${id}`} className="font-semibold underline">
                  {claimNo(id)}
                </Link>
              </span>
            ))}
            . Check it is not the same loss entered twice.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <div className="space-y-6 lg:col-span-2">
          <Card title="Claim">
            <dl className="grid gap-5 sm:grid-cols-3">
              <Detail label="Insurer">
                <Link href={`/directory/insurer/${claim.insurer_id}`} className="hover:underline">
                  {claim.insurer_name}
                </Link>
              </Detail>
              <Detail label="Client">
                <Link href={`/directory/client/${claim.client_id}`} className="hover:underline">
                  {claim.client_name}
                </Link>
              </Detail>
              <Detail label="Surveyor">
                <Link href={`/directory/surveyor/${claim.surveyor_id}`} className="hover:underline">
                  {claim.surveyor_name}
                </Link>
              </Detail>
              <Detail label="Loss type">{claim.loss_type}</Detail>
              <Detail label="Claimed amount">{npr(claim.claimed_amount)}</Detail>
              <Detail label="Site visits">{claim.visit_count}</Detail>
            </dl>
          </Card>

          <Card
            title="Site visits"
            action={
              !isClosed && (
                <ModalForm
                  trigger="Add visit"
                  title={`Record a site visit · ${claimNo(claim.claim_id)}`}
                  action={addSiteVisit}
                  submitLabel="Add visit"
                >
                  <VisitFields claimId={claim.claim_id} />
                </ModalForm>
              )
            }
          >
            {visits.length === 0 ? (
              <EmptyState>No site visits recorded yet.</EmptyState>
            ) : (
              <ol className="space-y-5 border-l-2 border-border pl-5">
                {visits.map((v) => (
                  <li key={v.visit_id} className="relative">
                    <span className="absolute top-1.5 -left-[27px] size-3 rounded-full border-2 border-white bg-accent" />
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{formatDate(v.visit_date)}</p>
                        <p className="mt-0.5 text-base text-ink-soft">{v.findings}</p>
                      </div>
                      {isAdmin && (
                        <DeleteButton
                          compact
                          action={deleteSiteVisit}
                          fields={{ visit_id: v.visit_id }}
                          label="Delete visit"
                          confirm={`Delete the site visit on ${formatDate(v.visit_date)}?`}
                        />
                      )}
                    </div>
                    <details className="mt-1">
                      <summary className={summaryClass}>
                        <Pencil size={13} /> Edit
                      </summary>
                      <ActionForm action={updateSiteVisit} submitLabel="Save visit" className="mt-3 space-y-3">
                        <input type="hidden" name="visit_id" value={v.visit_id} />
                        <div>
                          <label htmlFor={`visit_date_${v.visit_id}`} className={labelClass}>
                            Visit date
                          </label>
                          <input
                            id={`visit_date_${v.visit_id}`}
                            name="visit_date"
                            type="date"
                            required
                            min={MIN_VISIT_DATE}
                            max={localToday()}
                            defaultValue={v.visit_date}
                            className={`${inputClass} sm:max-w-xs`}
                          />
                        </div>
                        <div>
                          <label htmlFor={`findings_${v.visit_id}`} className={labelClass}>
                            Findings
                          </label>
                          <textarea
                            id={`findings_${v.visit_id}`}
                            name="findings"
                            rows={3}
                            required
                            minLength={FINDINGS_MIN}
                            maxLength={FINDINGS_MAX}
                            defaultValue={v.findings}
                            className={textareaClass}
                          />
                        </div>
                      </ActionForm>
                    </details>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Status">
            <ActionForm action={updateClaimStatus} submitLabel="Update status">
              <input type="hidden" name="claim_id" value={claim.claim_id} />
              <div>
                <label htmlFor="status" className={labelClass}>
                  Claim status
                </label>
                <select id="status" name="status" defaultValue={claim.status} key={claim.status} className={inputClass}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </div>
            </ActionForm>
          </Card>

          <Card title="Invoice" description="One invoice per claim">
            {claim.invoice_id == null ? (
              <div className="space-y-3">
                <p className="text-sm text-muted">
                  {isClosed ? "No invoice. Reopen the claim to bill it." : "No invoice yet."}
                </p>
                {!isClosed && (
                  <ModalForm
                    trigger="Create invoice"
                    title={`Create invoice · ${claimNo(claim.claim_id)}`}
                    action={createInvoice}
                    submitLabel="Create invoice"
                  >
                    <input type="hidden" name="claim_id" value={claim.claim_id} />
                    <div>
                      <label htmlFor="fee_amount" className={labelClass}>
                        Survey fee (Rs)
                      </label>
                      <input
                        id="fee_amount"
                        name="fee_amount"
                        type="number"
                        min="0.01"
                        max={MAX_FEE}
                        step="0.01"
                        required
                        className={inputClass}
                      />
                    </div>
                  </ModalForm>
                )}
              </div>
            ) : (
              <>
                <dl className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted">Invoice</dt>
                    <dd className="font-medium">INV-{String(claim.invoice_id).padStart(4, "0")}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Fee</dt>
                    <dd className="tabular-nums">{npr(claim.fee_amount)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted">Paid</dt>
                    <dd className="tabular-nums">{npr(claim.amount_paid)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-border pt-3 text-base">
                    <dt className="font-medium text-ink-soft">Balance due</dt>
                    <dd className="font-semibold tabular-nums text-ink">{npr(claim.balance_due)}</dd>
                  </div>
                </dl>
                <div className="mt-3">
                  <PaymentBadge fee={claim.fee_amount ?? 0} paid={claim.amount_paid ?? 0} />
                </div>

                {(claim.balance_due ?? 0) > 0 && (
                  <div className="mt-5 border-t border-border pt-5">
                    <ModalForm
                      trigger="Record payment"
                      title={`Record payment · ${claimNo(claim.claim_id)}`}
                      description={`Balance due: ${npr(claim.balance_due)}`}
                      action={recordPayment}
                      submitLabel="Record payment"
                    >
                      <input type="hidden" name="invoice_id" value={claim.invoice_id} />
                      <div>
                        <label htmlFor="payment" className={labelClass}>
                          Payment received (Rs)
                        </label>
                        <input
                          id="payment"
                          name="payment"
                          type="number"
                          min="0.01"
                          step="0.01"
                          max={claim.balance_due ?? undefined}
                          required
                          className={inputClass}
                        />
                      </div>
                    </ModalForm>
                  </div>
                )}

                <div className="mt-5 space-y-3 border-t border-border pt-4">
                  <details>
                    <summary className={summaryClass}>
                      <Pencil size={13} /> Correct invoice
                    </summary>
                    <ActionForm action={updateInvoice} submitLabel="Save invoice" className="mt-3 space-y-3">
                      <input type="hidden" name="invoice_id" value={claim.invoice_id} />
                      <div>
                        <label htmlFor="edit_fee" className={labelClass}>
                          Fee (Rs)
                        </label>
                        <input
                          id="edit_fee"
                          name="fee_amount"
                          type="number"
                          min="0.01"
                          max={MAX_FEE}
                          step="0.01"
                          required
                          defaultValue={claim.fee_amount ?? undefined}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label htmlFor="edit_paid" className={labelClass}>
                          Total paid (Rs)
                        </label>
                        <input
                          id="edit_paid"
                          name="amount_paid"
                          type="number"
                          min="0"
                          max={MAX_FEE}
                          step="0.01"
                          required
                          defaultValue={claim.amount_paid ?? undefined}
                          className={inputClass}
                        />
                      </div>
                    </ActionForm>
                  </details>
                  {isAdmin && (
                    <DeleteButton
                      action={deleteInvoice}
                      fields={{ invoice_id: claim.invoice_id }}
                      label="Delete invoice"
                      confirm="Delete this invoice and its payment record?"
                    />
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <Card
        className="mt-6"
        icon={History}
        title="Change history"
        description="Every change to this claim, its site visits and its invoice"
      >
        <AuditList entries={history} empty="No changes since the data was loaded." />
      </Card>
    </>
  );
}
