import type { Metadata } from "next";
import { KeyRound, Pencil } from "lucide-react";
import { createUser, resetUserPassword, updateUser } from "@/actions/users";
import { DataTable } from "@/components/ui/data-table";
import { Pagination, paginate } from "@/components/ui/pagination";
import { TableToolbar } from "@/components/ui/table-toolbar";
import { ModalForm } from "@/components/ui/modal-form";
import { Card, PageHeader, inputClass, labelClass } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, requireAdmin } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";
import { getUsers, type AppUser } from "@/lib/queries";

export const metadata: Metadata = { title: "Users" };

// Inputs sit inside their labels, so no ids are needed (the tables render each row twice: cards and rows).
function TextInput({
  name,
  label,
  type = "text",
  defaultValue,
  autoComplete,
}: {
  name: string;
  label: string;
  type?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className={labelClass}>{label}</span>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        autoComplete={autoComplete}
        minLength={type === "password" ? MIN_PASSWORD_LENGTH : name === "full_name" ? 2 : undefined}
        maxLength={name === "full_name" ? 100 : name === "email" ? 190 : undefined}
        className={inputClass}
      />
    </label>
  );
}

/** '2026-10-05 13:45:45' -> '5 Oct 2026' */
const day = (value: string | null) => (value ? formatDate(value.slice(0, 10)) : "Never");

function AccountStatus({ u }: { u: AppUser }) {
  const [label, tone] = !u.is_active
    ? ["Switched off", "text-danger"]
    : u.locked
      ? ["Locked", "text-warn"]
      : ["Active", "text-ok-fill"];
  return <span className={cn("font-semibold", tone)}>{label}</span>;
}

export default async function UsersPage({ searchParams }: PageProps<"/users">) {
  const me = await requireAdmin();
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.trim().slice(0, 60) || undefined;
  const all = await getUsers();
  const users = q
    ? all.filter((u) => `${u.full_name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
    : all;
  const { page, rows } = paginate(users, sp);

  return (
    <>
      <PageHeader
        title="Users"
        description="One administrator manages the system. Everyone else is staff: they can add and edit records but not delete them."
        action={
          <ModalForm
            trigger="Add staff"
            title="Add a staff member"
            description="Share the starting password with them. They can change it under My account."
            action={createUser}
            submitLabel="Create account"
          >
            <TextInput name="full_name" label="Full name" autoComplete="off" />
            <TextInput name="email" label="Email" type="email" autoComplete="off" />
            <TextInput
              name="password"
              label={`Starting password (at least ${MIN_PASSWORD_LENGTH} characters)`}
              type="password"
              autoComplete="new-password"
            />
          </ModalForm>
        }
      />

      <Card title={`Accounts (${all.length})`}>
        <TableToolbar basePath="/users" values={{ q }} search={{ name: "q", placeholder: "Search name or email" }} />
        <DataTable
          rows={rows}
          rowKey={(u) => u.user_id}
          columns={[
            {
              header: "Name",
              cell: (u) => (
                <span className="font-semibold text-ink">
                  {u.full_name}
                  {u.user_id === me.user_id && <span className="ml-1.5 font-normal text-muted">(you)</span>}
                </span>
              ),
            },
            { header: "Email", cell: (u) => u.email },
            { header: "Role", cell: (u) => (u.role === "admin" ? "Admin" : "Staff"), hideBelow: "xl" },
            { header: "Status", cell: (u) => <AccountStatus u={u} /> },
            { header: "Last sign-in", cell: (u) => day(u.last_login_at), hideBelow: "xl" },
            {
              header: "Actions",
              cell: (u) => (
                <div className="flex justify-end gap-1 lg:justify-start">
                  <ModalForm
                    trigger="Edit"
                    icon={<Pencil size={13} />}
                    variant="link"
                    title={`Edit ${u.full_name}`}
                    action={updateUser}
                    submitLabel="Save user"
                  >
                    <input type="hidden" name="user_id" value={u.user_id} />
                    <TextInput name="full_name" label="Full name" defaultValue={u.full_name} />
                    <TextInput name="email" label="Email" type="email" defaultValue={u.email} />
                    {u.role === "staff" && (
                      <label className="flex items-center gap-2 text-sm text-ink-soft">
                        <input type="checkbox" name="is_active" defaultChecked={!!u.is_active} className="size-4 accent-ink" />
                        Account can sign in
                      </label>
                    )}
                  </ModalForm>
                  <ModalForm
                    trigger="Reset password"
                    icon={<KeyRound size={13} />}
                    variant="link"
                    title={`Reset password for ${u.full_name}`}
                    description="They will be signed out of every device."
                    action={resetUserPassword}
                    submitLabel="Set new password"
                  >
                    <input type="hidden" name="user_id" value={u.user_id} />
                    <TextInput
                      name="password"
                      label={`New password (at least ${MIN_PASSWORD_LENGTH} characters)`}
                      type="password"
                      autoComplete="new-password"
                    />
                    <Pagination total={users.length} page={page} params={sp} basePath="/users" />
                  </ModalForm>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </>
  );
}
