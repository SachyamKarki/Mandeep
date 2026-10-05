"use client";

import { useState } from "react";
import { Check, Circle, Loader2 } from "lucide-react";
import { setupFirstAdmin } from "@/actions/auth";
import { useFormAction } from "@/hooks/use-form-action";
import { AuthAlert, AuthField, AuthHeading, authButtonClass } from "@/components/auth/auth-shell";

/** First run only: creates the single administrator account and signs them in. */
export function RegisterForm({ minLength }: { minLength: number }) {
  const { state, pending, formProps } = useFormAction(setupFirstAdmin);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Shown as you type, so the rules are clear before you submit. The server checks again.
  const checks = [
    { label: `At least ${minLength} characters`, ok: password.length >= minLength },
    { label: "Both passwords match", ok: password.length > 0 && password === confirm },
  ];


  return (
    <>
      <AuthHeading title="Create the administrator account" subtitle="Other users are added later from the Users page." />
      <AuthAlert>{state.error}</AuthAlert>

      <form {...formProps}>
        <AuthField label="Full name" name="full_name" placeholder="e.g. Sita Sharma" autoComplete="name" autoFocus />
        <AuthField label="Email" name="email" type="email" placeholder="name@company.com" autoComplete="username" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder={`At least ${minLength} characters`}
          autoComplete="new-password"
          onChange={setPassword}
        />
        <AuthField
          label="Confirm password"
          name="confirm"
          type="password"
          placeholder="Repeat password"
          autoComplete="new-password"
          onChange={setConfirm}
        />

        <ul className="mb-6 space-y-1.5">
          {checks.map((c) => (
            <li key={c.label} className={`flex items-center gap-2 text-sm ${c.ok ? "text-ok" : "text-muted"}`}>
              {c.ok ? <Check size={15} /> : <Circle size={15} />}
              {c.label}
            </li>
          ))}
        </ul>

        <button type="submit" disabled={pending} className={authButtonClass}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Creating account…" : "Create account"}
        </button>
      </form>
    </>
  );
}
