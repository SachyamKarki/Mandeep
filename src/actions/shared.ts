// Helpers shared by the server actions in this folder: reading and checking form
// fields, turning errors into messages, and finding out who is making a change.
// (Not a "use server" file: those may only export actions.)
import "server-only";
import { unstable_rethrow } from "next/navigation";
import { revalidatePath } from "next/cache";
import { passwordProblem, requireUser } from "@/lib/auth";
import { localToday, matches, MAX_FEE, MIN_VISIT_DATE } from "@/lib/validation";
import { npr } from "@/lib/format";
import type { FormState } from "@/lib/form-state";
import type { DirectoryField } from "@/lib/directory";

// ---------- records: validation helpers ----------

/** A problem the person can fix; its message is shown in the form. */
export class FormError extends Error {}

export function text(fd: FormData, name: string, label: string, max = 120, min = 1): string {
  const value = String(fd.get(name) ?? "").trim().replace(/\s+/g, " ");
  if (!value) throw new FormError(`${label} is required.`);
  if (value.length < min) throw new FormError(`${label} must be at least ${min} characters.`);
  if (value.length > max) throw new FormError(`${label} must be ${max} characters or fewer.`);
  return value;
}

/** A directory field (name, phone or licence), checked against the same pattern the form uses. */
export function directoryValue(fd: FormData, f: DirectoryField): string {
  let value = text(fd, f.name, f.label, f.max, f.min ?? 1);
  if (f.name === "licence_no") value = value.toUpperCase();
  if (!matches(f.pattern, value)) throw new FormError(f.hint ? `${f.label}: ${f.hint}.` : `Enter a valid ${f.label.toLowerCase()}.`);
  return value;
}

export function id(fd: FormData, name: string, label: string): number {
  const value = Number(fd.get(name));
  if (!Number.isInteger(value) || value <= 0) throw new FormError(`Choose a ${label}.`);
  return value;
}

export function amount(fd: FormData, name: string, label: string, { allowZero = false, max = MAX_FEE } = {}): number {
  const raw = String(fd.get(name) ?? "").trim();
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < 0 || (!allowZero && value === 0)) {
    throw new FormError(`${label} must be ${allowZero ? "0 or more" : "more than 0"}.`);
  }
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) throw new FormError(`${label} can have at most 2 decimal places.`);
  if (value > max) throw new FormError(`${label} cannot be more than ${npr(max)}.`);
  return value;
}

export function date(fd: FormData, name: string, label: string): string {
  const value = text(fd, name, label, 10);
  const parsed = new Date(`${value}T00:00:00Z`);
  // The round trip rejects dates like 2026-02-30 that Date.parse would roll over.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new FormError(`Enter a valid ${label.toLowerCase()}.`);
  }
  if (value > localToday()) throw new FormError(`${label} cannot be in the future.`);
  if (value < MIN_VISIT_DATE) throw new FormError(`${label} is too far in the past.`);
  return value;
}

/** Site visits and invoices can only be added to claims that are still in progress. */
export async function assertClaimNotClosed(tx: { select<T>(sql: string, params?: (string | number)[]): Promise<T[]> }, claimId: number) {
  const [claim] = await tx.select<{ status: string }>(`SELECT status FROM claim WHERE claim_id = ?`, [claimId]);
  if (!claim) throw new FormError("That claim no longer exists.");
  if (claim.status === "Closed") throw new FormError("This claim is closed. Reopen it before adding to it.");
}

export function oneOf<T extends string>(fd: FormData, name: string, options: readonly T[], label: string): T {
  const value = String(fd.get(name) ?? "") as T;
  if (!options.includes(value)) throw new FormError(`Choose a valid ${label}.`);
  return value;
}

export function assertFound(affectedRows: number, what: string) {
  if (affectedRows === 0) throw new FormError(`That ${what} no longer exists.`);
}

/** The signed-in user's name, written to audit_log.changed_by. Sends signed-out visitors to /login. */
export async function getActor(): Promise<string> {
  return (await requireUser()).full_name;
}

/** Deleting is limited to administrators. */
export async function getAdminActor(): Promise<string> {
  const user = await requireUser();
  if (user.role !== "admin") throw new FormError("Only an administrator can delete records.");
  return user.full_name;
}

/** Turns validation and MySQL errors into a message the form can show. */
export function toFormState(err: unknown): FormState {
  unstable_rethrow(err); // let redirect() through
  if (err instanceof FormError) return { error: err.message };
  const code = (err as { code?: string }).code;
  if (code === "ER_DUP_ENTRY") {
    const msg = String((err as { message?: string }).message);
    if (msg.includes("uq_insurer_name")) return { error: "An insurer with this name already exists." };
    if (msg.includes("uq_surveyor_licence")) return { error: "A surveyor with this licence number already exists." };
    return { error: "That record already exists." };
  }
  if (code === "ER_NO_REFERENCED_ROW_2") return { error: "A linked record no longer exists." };
  if (code === "ER_ROW_IS_REFERENCED_2") {
    return { error: "Claims still use this record. Move or delete those claims first." };
  }
  if (code === "ER_CHECK_CONSTRAINT_VIOLATED") return { error: "That value breaks a database rule." };
  console.error(err);
  return { error: "Something went wrong saving to the database." };
}

export function refresh() {
  revalidatePath("/", "layout");
}

// ---------- accounts: validation helpers ----------


export function field(fd: FormData, name: string, label: string, max = 120): string {
  const value = String(fd.get(name) ?? "").trim();
  if (!value) throw new FormError(`${label} is required.`);
  if (value.length < 2) throw new FormError(`${label} must be at least 2 characters.`);
  if (value.length > max) throw new FormError(`${label} is too long.`);
  return value;
}

export function email(fd: FormData): string {
  const value = field(fd, "email", "Email", 190).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) throw new FormError("Enter a valid email address.");
  return value;
}

export function newPassword(fd: FormData, name = "password", confirmName = "confirm"): string {
  const password = String(fd.get(name) ?? "");
  const problem = passwordProblem(password);
  if (problem) throw new FormError(problem);
  if (fd.has(confirmName) && fd.get(confirmName) !== password) throw new FormError("The two passwords do not match.");
  return password;
}

export function fail(err: unknown): FormState {
  unstable_rethrow(err); // let redirect() and notFound() through
  if (err instanceof FormError) return { error: err.message };
  if ((err as { code?: string }).code === "ER_DUP_ENTRY") return { error: "An account with that email already exists." };
  console.error(err);
  return { error: "Something went wrong. Please try again." };
}

export async function requireAdminForm() {
  const user = await requireUser();
  if (user.role !== "admin") throw new FormError("Only an administrator can do that.");
  return user;
}
