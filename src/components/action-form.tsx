"use client";

import type { ReactNode } from "react";
import type { FormState } from "@/app/actions";
import { buttonClass, secondaryButtonClass } from "./ui";
import { useFormAction } from "./use-form-action";

/** A form wired to a server action, with a pending button and an error/success message. */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
  secondary = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  secondary?: boolean;
}) {
  const { state, pending, formProps } = useFormAction(action);

  return (
    <form {...formProps} className={className}>
      {children}
      {state.error && (
        <p role="alert" className="rounded-sm border border-danger-border bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.success && (
        <p role="status" className="rounded-sm border border-ok/30 bg-ok-soft px-3 py-2 text-sm text-ok">
          {state.success}
        </p>
      )}
      <button type="submit" disabled={pending} className={secondary ? secondaryButtonClass : buttonClass}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
