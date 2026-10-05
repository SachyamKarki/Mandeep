"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, Circle, Clock, Loader2 } from "lucide-react";
import { register } from "@/app/auth-actions";
import { useFormAction } from "../use-form-action";
import { AuthAlert, AuthField, AuthHeading, authButtonClass } from "./auth-shell";

export function RegisterForm({ minLength }: { minLength: number }) {
  const { state, pending, formProps } = useFormAction(register);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Shown as you type, so the rules are clear before you submit. The server checks again.
  const checks = [
    { label: `At least ${minLength} characters`, ok: password.length >= minLength },
    { label: "Both passwords match", ok: password.length > 0 && password === confirm },
  ];

  if (state.success) {
    return (
      <>
        <AuthHeading title="Request sent" />
        <div className="flex gap-2.5 rounded-md border border-border bg-subtle px-3.5 py-3 text-sm leading-relaxed text-ink-soft">
          <Clock size={16} className="mt-0.5 shrink-0 text-muted" />
          <span>{state.success}</span>
        </div>
        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/login" className="font-semibold text-ink hover:underline">
            Back to sign in
          </Link>
        </p>
      </>
    );
  }

  return (
    <>
      <AuthHeading
        title="Create an account"
        subtitle="Your name, work email and a password. An administrator approves new accounts before they can sign in."
      />
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
          {pending ? "Sending request…" : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
