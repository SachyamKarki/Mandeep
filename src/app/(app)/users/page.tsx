import type { Metadata } from "next";
import { Clock, KeyRound, Pencil, ShieldCheck, UserPlus, Users } from "lucide-react";
import { approveUser, createUser, declineUser, resetUserPassword, updateUser } from "@/app/auth-actions";
import { ActionForm } from "@/components/action-form";
import { SqlPeek } from "@/components/sql-block";
import { Card, PageHeader, inputClass, labelClass } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { USERS_SQL, getUsers } from "@/lib/queries";

export const metadata: Metadata = { title: "Users" };

const pill = "inline-flex items-center rounded-pill border px-2.5 py-0.5 text-xs font-bold whitespace-nowrap";
const summaryClass =
  "inline-flex cursor-pointer list-none items-center gap-1 rounded-sm px-2 py-1 text-sm font-semibold text-accent hover:bg-subtle hover:text-ink";

function TextInput({
  id,
  name,
  label,
  type = "text",
  defaultValue,
  autoComplete,
}: {
  id: string;
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        minLength={type === "password" ? MIN_PASSWORD_LENGTH : undefined}
        className={inputClass}
      />
    </div>
  );
}

function RoleSelect({ id, defaultValue = "staff" }: { id: string; defaultValue?: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        Role
      </label>
      <select id={id} name="role" defaultValue={defaultValue} className={inputClass}>
        <option value="staff">Staff: add and edit claims, visits, invoices and the directory</option>
        <option value="admin">Admin: everything staff can do, plus delete records and manage users</option>
      </select>
    </div>
  );
}

export default async function UsersPage() {
  const me = await requireAdmin();
  const all = await getUsers();
  const pending = all.filter((u) => u.pending);
  const users = all.filter((u) => !u.pending);

  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Users"
        description="Who can sign in. Passwords are stored as scrypt hashes, and every change here is written to the audit trail."
      />

      {pending.length > 0 && (
        <Card
          className="mb-6 border-warn-line"
          icon={Clock}
          title={`${pending.length} waiting for approval`}
          description="People who registered themselves. They cannot sign in until you approve them."
        >
          <ul className="-mx-4 -my-4 divide-y divide-border">
            {pending.map((u) => (
              <li key={u.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">{u.full_name}</p>
                  <p className="text-sm text-muted">
                    {u.email} · registered {u.created_at}
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <ActionForm action={approveUser} submitLabel="Approve" className="flex flex-col gap-2">
                    <input type="hidden" name="user_id" value={u.user_id} />
                  </ActionForm>
                  <ActionForm action={declineUser} submitLabel="Decline" className="flex flex-col gap-2" secondary>
                    <input type="hidden" name="user_id" value={u.user_id} />
                  </ActionForm>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2" icon={Users} title={`${users.length} accounts`}>
          <ul className="-mx-4 -my-4 divide-y divide-border">
            {users.map((u) => (
              <li key={u.user_id} className={cn("px-4 py-4", !u.is_active && "bg-canvas")}>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="font-semibold text-ink">{u.full_name}</span>
                  {u.user_id === me.user_id && <span className="text-xs text-muted">(you)</span>}
                  <span
                    className={cn(
                      pill,
                      u.role === "admin" ? "border-accent-deep bg-accent-deep text-white" : "border-border bg-subtle text-ink-soft",
                    )}
                  >
                    {u.role === "admin" && <ShieldCheck size={12} className="mr-1" />}
                    {u.role}
                  </span>
                  {!u.is_active && <span className={cn(pill, "border-danger-border bg-danger-soft text-danger")}>Switched off</span>}
                  {u.locked ? <span className={cn(pill, "border-warn-line bg-warn-soft text-warn")}>Locked</span> : null}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {u.email} · last sign-in {u.last_login_at ?? "never"} · {u.sessions} active{" "}
                  {u.sessions === 1 ? "session" : "sessions"}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">
                  <details className="w-full sm:w-auto sm:flex-1">
                    <summary className={summaryClass}>
                      <Pencil size={13} /> Edit
                    </summary>
                    <ActionForm action={updateUser} submitLabel="Save user" className="mt-3 space-y-3">
                      <input type="hidden" name="user_id" value={u.user_id} />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <TextInput id={`name_${u.user_id}`} name="full_name" label="Full name" defaultValue={u.full_name} />
                        <TextInput id={`email_${u.user_id}`} name="email" label="Email" type="email" defaultValue={u.email} />
                      </div>
                      <RoleSelect id={`role_${u.user_id}`} defaultValue={u.role} />
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        <input
                          type="checkbox"
                          name="is_active"
                          defaultChecked={!!u.is_active}
                          className="size-4 accent-ink"
                        />
                        Account can sign in
                      </label>
                    </ActionForm>
                  </details>
                  <details className="w-full sm:w-auto sm:flex-1">
                    <summary className={summaryClass}>
                      <KeyRound size={13} /> Reset password
                    </summary>
                    <ActionForm action={resetUserPassword} submitLabel="Set new password" className="mt-3 space-y-3">
                      <input type="hidden" name="user_id" value={u.user_id} />
                      <TextInput
                        id={`pw_${u.user_id}`}
                        name="password"
                        label={`New password (min ${MIN_PASSWORD_LENGTH})`}
                        type="password"
                        autoComplete="new-password"
                      />
                    </ActionForm>
                  </details>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <SqlPeek sql={USERS_SQL} />
          </div>
        </Card>

        <Card icon={UserPlus} title="Add a user" description="Give them the password; they can change it under My account.">
          <ActionForm action={createUser} submitLabel="Create account">
            <TextInput id="new_name" name="full_name" label="Full name" autoComplete="off" />
            <TextInput id="new_email" name="email" label="Email" type="email" autoComplete="off" />
            <RoleSelect id="new_role" />
            <TextInput
              id="new_password"
              name="password"
              label={`Starting password (min ${MIN_PASSWORD_LENGTH})`}
              type="password"
              autoComplete="new-password"
            />
          </ActionForm>
        </Card>
      </div>
    </>
  );
}
