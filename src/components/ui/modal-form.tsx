"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Plus, X } from "lucide-react";
import type { FormState } from "@/lib/form-state";
import { cn } from "@/lib/cn";
import { ActionForm } from "@/components/ui/action-form";
import { buttonClass, rowActionClass, secondaryButtonClass } from "@/components/ui";

const triggerClass = {
  primary: buttonClass,
  secondary: secondaryButtonClass,
  link: rowActionClass,
};

const sizeClass = { md: "max-w-lg", lg: "max-w-2xl" };

/**
 * A button that opens a form in a modal dialog: header, scrolling body, fixed footer.
 * It closes on success, Esc, the × button or Cancel. A click outside does not close it,
 * so a stray click never throws away what was typed. Redirecting actions (New claim)
 * simply navigate away.
 */
export function ModalForm({
  trigger,
  title,
  description,
  action,
  submitLabel,
  children,
  variant = "primary",
  icon = <Plus size={15} />,
  size = "md",
}: {
  trigger: string;
  title: string;
  description?: string;
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  submitLabel: string;
  children: ReactNode;
  /** "link" is a small text button for table rows. */
  variant?: "primary" | "secondary" | "link";
  /** Replaces the default plus icon; pass null for none. */
  icon?: ReactNode;
  /** "lg" for two-column forms such as a claim. */
  size?: "md" | "lg";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descId = useId();
  // Remounting the form on each open clears values and messages from last time.
  const [session, setSession] = useState(0);

  const open = () => {
    setSession((n) => n + 1);
    ref.current?.showModal();
    document.documentElement.style.overflow = "hidden"; // no page scrolling behind the dialog
  };
  // Give the page its scrollbar back. Called directly on every way of closing, because the
  // dialog's own "close" event is not delivered reliably in every browser.
  const unlock = () => (document.documentElement.style.overflow = "");
  const close = useCallback(() => {
    ref.current?.close();
    unlock();
  }, []);

  // Leaving the page while the dialog is open (e.g. New claim redirects) also unlocks.
  useEffect(() => {
    const dialog = ref.current;
    return () => {
      if (dialog?.open) unlock();
    };
  }, []);

  // Put the cursor in the first field (not on the × button) once the new form is mounted.
  useEffect(() => {
    if (!session) return;
    ref.current?.querySelector<HTMLElement>("form input:not([type=hidden]), form select, form textarea")?.focus();
  }, [session]);

  return (
    <>
      <button type="button" onClick={open} className={triggerClass[variant]}>
        {icon} {trigger}
      </button>

      <dialog
        ref={ref}
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        onCancel={unlock} // Esc
        className={cn(
          "modal-in m-auto max-h-[min(90dvh,760px)] w-[calc(100%-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-surface p-0 text-left text-ink shadow-[0_24px_60px_rgba(15,23,42,0.28)] open:flex",
          "backdrop:bg-slate-900/45 backdrop:backdrop-blur-[3px]",
          sizeClass[size],
        )}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0">
            <h2 id={titleId} className="text-lg font-bold tracking-tight text-ink">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-relaxed text-muted">
                {description}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            title="Close (Esc)"
            className="-mt-1 -mr-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-sm text-muted transition-colors hover:bg-subtle hover:text-ink"
          >
            <X size={18} />
          </button>
        </header>

        <ActionForm
          key={session}
          layout="dialog"
          action={action}
          submitLabel={submitLabel}
          onSuccess={close}
          footer={
            <button type="button" onClick={close} className={secondaryButtonClass}>
              Cancel
            </button>
          }
        >
          {children}
        </ActionForm>
      </dialog>
    </>
  );
}
