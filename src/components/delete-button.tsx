"use client";

import { useActionState } from "react";
import { Trash2 } from "lucide-react";
import type { FormState } from "@/app/actions";
import { cn } from "@/lib/cn";

/** Asks for confirmation, then runs a delete server action and shows any error. */
export function DeleteButton({
  action,
  fields,
  confirm,
  label = "Delete",
  compact = false,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  fields: Record<string, string | number>;
  confirm: string;
  label?: string;
  compact?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        if (!window.confirm(confirm)) e.preventDefault();
      }}
      className="inline-flex flex-col items-start gap-2"
    >
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <button
        type="submit"
        disabled={pending}
        title={label}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1.5 rounded-sm border text-sm font-semibold transition-colors disabled:opacity-55",
          compact
            ? "border-transparent px-2 py-1 text-danger hover:bg-danger-soft"
            : "h-9 border-danger-border bg-surface px-3.5 text-danger hover:bg-danger-soft",
        )}
      >
        <Trash2 size={compact ? 14 : 15} />
        {compact ? <span className="sr-only">{label}</span> : pending ? "Deleting…" : label}
      </button>
      {state.error && (
        <p role="alert" className="rounded-sm bg-danger-soft px-3 py-2 text-sm text-danger">
          {state.error}
        </p>
      )}
    </form>
  );
}
