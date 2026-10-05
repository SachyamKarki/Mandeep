"use client";

import { Loader2 } from "lucide-react";
import { setupFirstAdmin } from "@/app/auth-actions";
import { useFormAction } from "../use-form-action";
import { AuthAlert, AuthField, AuthHeading, authButtonClass } from "./auth-shell";

export function SetupForm({ minLength }: { minLength: number }) {
  const { state, pending, formProps } = useFormAction(setupFirstAdmin);

  return (
    <>
      <AuthHeading
        title="Set up your workspace"
        subtitle="No accounts exist yet. Create the first administrator. You can add the rest of the team after."
      />
      <AuthAlert>{state.error}</AuthAlert>

      <form {...formProps}>
        <AuthField label="Full name" name="full_name" placeholder="e.g. Office Administrator" autoComplete="name" autoFocus />
        <AuthField label="Email" name="email" type="email" placeholder="name@company.com" autoComplete="username" />
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          hint={`At least ${minLength} characters.`}
        />
        <AuthField label="Confirm password" name="confirm" type="password" autoComplete="new-password" />

        <button type="submit" disabled={pending} className={`${authButtonClass} mt-2`}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Creating account…" : "Create admin account"}
        </button>
      </form>
    </>
  );
}
