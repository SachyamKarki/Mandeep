"use client";

import Link from "next/link";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { login } from "@/app/auth-actions";
import { useFormAction } from "../use-form-action";
import { AuthAlert, AuthField, AuthHeading, authButtonClass } from "./auth-shell";

export function LoginForm({ next }: { next: string }) {
  const { state, pending, formProps } = useFormAction(login);
  const [forgot, setForgot] = useState(false);

  return (
    <>
      <AuthHeading title="Sign in" subtitle="Sign in to manage claims, site visits and survey fees." />

      <AuthAlert>{state.error}</AuthAlert>

      {forgot && (
        <div className="mb-5 rounded-md border border-border bg-subtle px-3.5 py-2.5 text-sm leading-relaxed text-ink-soft">
          Passwords are reset by an administrator. Ask them to set a new one for you from the Users page.
        </div>
      )}

      <form {...formProps}>
        <input type="hidden" name="next" value={next} />
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="name@company.com"
          autoComplete="username"
          autoFocus
        />
        <AuthField
          label="Password"
          name="password"
          type="password"
          placeholder="Your password"
          autoComplete="current-password"
          right={
            <button
              type="button"
              onClick={() => setForgot((s) => !s)}
              className="cursor-pointer text-sm text-muted transition-colors hover:text-ink hover:underline"
            >
              Forgot password?
            </button>
          }
        />

        <div className="mt-1.5 mb-6 flex items-center gap-2.5">
          <input
            id="remember"
            name="remember"
            type="checkbox"
            defaultChecked
            className="size-4 cursor-pointer rounded border-border accent-ink"
          />
          <label htmlFor="remember" className="cursor-pointer text-sm text-muted transition-colors select-none hover:text-ink">
            Remember this device for 30 days
          </label>
        </div>

        <button type="submit" disabled={pending} className={authButtonClass}>
          {pending && <Loader2 size={16} className="animate-spin" />}
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        New to the team?{" "}
        <Link href="/register" className="font-semibold text-ink hover:underline">
          Create an account
        </Link>
      </p>
    </>
  );
}
