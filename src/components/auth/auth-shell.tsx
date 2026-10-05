"use client";

import { useState, type ReactNode } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Background3D } from "./background-3d";

// Sign-in chrome, following the scrapper app's features/auth/components/AuthShell.jsx.

export function AuthShell({ children, tracedBorder = false }: { children: ReactNode; tracedBorder?: boolean }) {
  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-canvas px-4 py-10">
      <Background3D />

      <div className="relative z-10 w-full max-w-[480px]">
        {tracedBorder && <div aria-hidden="true" className="auth-trace-glow" />}
        <div
          className={`relative rounded-2xl border border-border bg-surface/95 p-8 shadow-[0_16px_44px_rgba(15,23,42,0.08)] backdrop-blur-md sm:p-10 ${
            tracedBorder ? "auth-trace" : ""
          }`}
        >
          <div className="flex flex-col items-center text-center select-none">
            <div className="inline-flex items-baseline gap-1.5">
              <span className="text-[26px] font-bold tracking-tight text-ink">Mangaldeep</span>
              <span className="text-[22px] font-light text-muted">Claims</span>
            </div>
            <p className="mt-1 text-xs tracking-[0.08em] text-faint uppercase">Claim Survey Management</p>
          </div>

          <div className="my-6 flex items-center justify-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-border to-border/40" />
            <span className="size-[3px] rounded-full bg-border-strong" />
            <div className="h-px flex-1 bg-gradient-to-l from-transparent via-border to-border/40" />
          </div>

          {children}
        </div>
        <p className="relative mt-5 text-center text-xs text-muted">Mangaldeep Consulting Pvt. Ltd. · Bagbazar, Kathmandu</p>
      </div>
    </div>
  );
}

export function AuthHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-ink">{title}</h1>
      {subtitle && <p className="mx-auto mt-2 max-w-[390px] text-sm leading-relaxed text-muted">{subtitle}</p>}
    </div>
  );
}

export function AuthField({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  autoFocus,
  defaultValue,
  hint,
  right,
  onChange,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  autoFocus?: boolean;
  defaultValue?: string;
  hint?: string;
  right?: ReactNode;
  onChange?: (value: string) => void;
}) {
  const [shown, setShown] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={name} className="text-sm font-medium text-ink-soft">
          {label}
        </label>
        {right}
      </div>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={isPassword && shown ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          defaultValue={defaultValue}
          onChange={onChange ? (e) => onChange(e.target.value) : undefined}
          required
          className={`h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors placeholder:text-faint focus:border-border-strong focus:ring-2 focus:ring-subtle ${
            isPassword ? "pr-10" : ""
          }`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? "Hide password" : "Show password"}
            title={shown ? "Hide password" : "Show password"}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-10 cursor-pointer items-center justify-center text-faint transition-colors hover:text-ink"
          >
            {shown ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
      {hint && <p className="mt-1.5 text-xs leading-relaxed text-muted">{hint}</p>}
    </div>
  );
}

export function AuthAlert({ children, tone = "error" }: { children?: ReactNode; tone?: "error" | "success" }) {
  if (!children) return null;
  const ok = tone === "success";
  return (
    <div
      role={ok ? "status" : "alert"}
      className={`mb-5 flex items-start gap-2 rounded-md border px-3 py-2.5 text-sm leading-relaxed ${
        ok ? "border-ok/30 bg-ok-soft text-ok" : "border-danger-border bg-danger-soft text-danger"
      }`}
    >
      {ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
      <span>{children}</span>
    </div>
  );
}

export const authButtonClass =
  "inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-ink bg-ink px-4 text-sm font-semibold tracking-tight text-surface transition-all hover:border-ink-soft hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50";
