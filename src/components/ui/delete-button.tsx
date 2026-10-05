"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/cn";
import { dangerButtonClass, rowActionClass } from "@/components/ui";
import { toast } from "@/components/ui/toast";

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

  useEffect(() => {
    if (state.success) toast(state.success);
    if (state.error) toast(state.error, "error");
  }, [state]);

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
        className={compact ? cn(rowActionClass, "text-danger hover:bg-danger-soft hover:text-danger") : dangerButtonClass}
      >
        <Trash2 size={compact ? 14 : 15} />
        {compact ? <span className="sr-only">{label}</span> : pending ? "Deleting…" : label}
      </button>
    </form>
  );
}
