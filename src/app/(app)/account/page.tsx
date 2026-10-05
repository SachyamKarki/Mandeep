import type { Metadata } from "next";
import { KeyRound, Laptop, UserRound } from "lucide-react";
import { changeOwnPassword, signOutOtherDevices } from "@/actions/account";
import { ActionForm } from "@/components/ui/action-form";
import { Card, PageHeader, inputClass, labelClass } from "@/components/ui";
import { MIN_PASSWORD_LENGTH, currentTokenHash, requireUser } from "@/lib/auth";
import { getSessionsFor } from "@/lib/queries";

export const metadata: Metadata = { title: "My account" };

function browserName(ua: string | null) {
  if (!ua) return "Unknown browser";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Mac OS X/.test(ua) ? "macOS" : /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Linux/.test(ua) ? "Linux" : "";
  return os ? `${browser} on ${os}` : browser;
}

function PasswordInput({ id, name, label, autoComplete }: { id: string; name: string; label: string; autoComplete: string }) {
  return (
    <div>
      <label htmlFor={id} className={labelClass}>
        {label}
      </label>
      <input id={id} name={name} type="password" required autoComplete={autoComplete} className={inputClass} />
    </div>
  );
}

export default async function AccountPage() {
  const me = await requireUser();
  const [sessions, current] = await Promise.all([getSessionsFor(me.user_id), currentTokenHash()]);

  return (
    <>
      <PageHeader title="My account" description="Your profile, password and signed-in devices." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 [&>*]:min-w-0">
        <Card icon={UserRound} title="Profile">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">Name</dt>
              <dd className="font-medium text-ink">{me.full_name}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="font-medium text-ink">{me.email}</dd>
            </div>
            <div>
              <dt className="text-muted">Role</dt>
              <dd className="font-medium text-ink capitalize">{me.role}</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs text-muted">Ask an administrator to change your name, email or role.</p>
        </Card>

        <Card icon={KeyRound} title="Change password">
          <ActionForm action={changeOwnPassword} submitLabel="Change password">
            <PasswordInput id="current" name="current" label="Current password" autoComplete="current-password" />
            <PasswordInput
              id="password"
              name="password"
              label={`New password (min ${MIN_PASSWORD_LENGTH})`}
              autoComplete="new-password"
            />
            <PasswordInput id="confirm" name="confirm" label="Confirm new password" autoComplete="new-password" />
          </ActionForm>
        </Card>

        <Card icon={Laptop} title="Signed-in devices" description={`${sessions.length} active`}>
          <ul className="space-y-3 text-sm">
            {sessions.map((s) => (
              <li key={s.token_hash} className="rounded-sm border border-border px-3 py-2">
                <p className="font-medium text-ink">
                  {browserName(s.user_agent)}
                  {s.token_hash === current && <span className="ml-2 text-xs font-normal text-ok">this device</span>}
                </p>
                <p className="text-xs text-muted">
                  Signed in {s.created_at} · expires {s.expires_at}
                </p>
              </li>
            ))}
          </ul>
          {sessions.length > 1 && (
            <div className="mt-4">
              <ActionForm action={signOutOtherDevices} submitLabel="Sign out other devices">
                {null}
              </ActionForm>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
