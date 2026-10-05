"use client";

import { useEffect, type ReactNode } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { buttonClass, secondaryButtonClass } from "@/components/ui";
import { useFormAction } from "@/hooks/use-form-action";

function ErrorBox({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-sm border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger"
    >
      <AlertCircle size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </p>
  );
}

/**
 * A form wired to a server action, with a pending button and an error message.
 * `layout="dialog"` gives a scrolling body and a fixed footer bar for use inside a modal.
 */
export function ActionForm({
  action,
  submitLabel,
  children,
  className = "space-y-4",
  secondary = false,
  onSuccess,
  footer,
  layout = "inline",
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  className?: string;
  secondary?: boolean;
  /** Called after the action reports success (used by modals to close). */
  onSuccess?: () => void;
  /** Extra buttons placed before the submit button, such as Cancel. */
  footer?: ReactNode;
  layout?: "inline" | "dialog";
}) {
  const { state, pending, formProps } = useFormAction(action);

  useEffect(() => {
    if (state.success) onSuccess?.();
  }, [state, onSuccess]);

  const submit = (
    <button type="submit" disabled={pending} className={secondary ? secondaryButtonClass : buttonClass}>
      {pending && <Loader2 size={15} className="animate-spin" />}
      {pending ? "Saving…" : submitLabel}
    </button>
  );

  if (layout === "dialog") {
    return (
      <form {...formProps} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          {state.error && <ErrorBox message={state.error} />}
          {children}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-border bg-canvas px-6 py-3.5">
          {footer}
          {submit}
        </div>
      </form>
    );
  }

  return (
    <form {...formProps} className={className}>
      {children}
      {state.error && <ErrorBox message={state.error} />}
      {footer ? (
        <div className="flex flex-wrap justify-end gap-2 pt-2">
          {footer}
          {submit}
        </div>
      ) : (
        submit
      )}
    </form>
  );
}
