import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ClaimStatus } from "@/lib/queries";

// Patterns follow the scrapper app's shared/ui/Tw.jsx and dashboardUI.jsx.

export const panelClass =
  "overflow-hidden rounded-md border border-border-strong/80 bg-surface shadow-[0_1px_2px_rgba(15,23,42,0.035)]";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className="mb-1 text-xs font-bold tracking-[0.08em] text-muted uppercase">{eyebrow}</p>}
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p>}
      </div>
      {action}
    </header>
  );
}

export function Card({
  title,
  description,
  action,
  icon: Icon,
  children,
  className,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn(panelClass, className)}>
      {title && (
        <div className="flex min-h-12 items-center justify-between gap-4 border-b border-border px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-base font-bold tracking-tight text-ink">
              {Icon && <Icon size={17} strokeWidth={1.8} className="text-accent" />}
              {title}
            </h2>
            {description && <p className="mt-0.5 text-xs text-muted">{description}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  );
}

export type Stat = { label: string; value: string; hint?: string; icon?: LucideIcon };

/** A row of numbers sharing one hairline grid. */
export function StatRow({ items }: { items: Stat[] }) {
  return (
    <div className={panelClass}>
      <div className="grid gap-px bg-border" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))" }}>
        {items.map(({ label, value, hint, icon: Icon }) => (
          <div key={label} className="min-w-0 bg-surface px-5 py-5">
            <div className="mb-3 flex items-center gap-2 text-ink">
              {Icon && <Icon size={16} strokeWidth={1.8} className="shrink-0" />}
              <span className="truncate text-sm font-semibold">{label}</span>
            </div>
            <span className="block text-xl leading-none font-bold tracking-tight whitespace-nowrap text-ink 2xl:text-2xl">
              {value}
            </span>
            {hint && <span className="mt-2 block text-xs text-muted">{hint}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// Status is plain coloured text: green = done, amber = in progress, red = not started / unpaid.
const statusText = "font-semibold whitespace-nowrap";

const statusTone: Record<ClaimStatus, string> = {
  Open: "text-danger",
  Surveyed: "text-warn",
  Closed: "text-ok-fill",
};

export function StatusBadge({ status }: { status: ClaimStatus }) {
  return <span className={cn(statusText, statusTone[status])}>{status}</span>;
}

export function PaymentBadge({ fee, paid }: { fee: number; paid: number }) {
  const [label, tone] = paid >= fee ? ["Paid", "text-ok-fill"] : paid > 0 ? ["Part paid", "text-warn"] : ["Unpaid", "text-danger"];
  return <span className={cn(statusText, tone)}>{label}</span>;
}

export function Bar({ pct }: { pct: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-pill bg-border">
      <div className="h-full rounded-pill bg-accent transition-[width] duration-200" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return <p className="rounded-sm bg-subtle px-4 py-6 text-center text-sm text-muted">{children}</p>;
}

// ---------- Buttons: every button in the app uses one of these four styles ----------
const baseBtn =
  "inline-flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-sm border px-3.5 text-sm font-semibold whitespace-nowrap transition-colors disabled:cursor-not-allowed disabled:opacity-55";

export const buttonClass = cn(baseBtn, "border-accent-deep bg-accent-deep text-surface hover:border-accent hover:bg-accent");
export const secondaryButtonClass = cn(baseBtn, "border-border bg-surface text-ink hover:bg-subtle");
export const dangerButtonClass = cn(baseBtn, "border-danger-border bg-surface text-danger hover:bg-danger-soft");
/** Small text action inside a table row or list item (Edit, Reset password, …). */
export const rowActionClass =
  "inline-flex h-8 cursor-pointer list-none items-center gap-1 rounded-sm px-2 text-sm font-semibold whitespace-nowrap text-accent transition-colors hover:bg-subtle hover:text-ink disabled:cursor-not-allowed disabled:opacity-55";
export const linkClass = "inline-flex items-center gap-1 text-sm font-semibold text-accent hover:text-ink";

export const labelClass = "mb-1.5 block text-sm font-semibold text-ink-soft";
export const inputClass =
  "block h-10 w-full rounded-sm border border-border bg-surface px-3 text-sm text-ink outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-subtle";
export const textareaClass =
  "block w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm text-ink outline-none transition-colors focus:border-border-strong focus:ring-2 focus:ring-subtle";
