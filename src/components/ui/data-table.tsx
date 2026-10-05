import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui";

/** Each row is drawn twice (phone cards and the desktop table); only one is visible at a time. */
export type TableView = "card" | "table";

export type Column<T> = {
  header: string;
  /** `view` says whether the row is drawn as a phone card or a table row, so form ids stay unique. */
  cell: (row: T, view: TableView) => ReactNode;
  align?: "left" | "right";
  /** Hide this column in the table view on screens narrower than the breakpoint (still shown on cards). */
  hideBelow?: "xl" | "2xl";
  /** Let long text wrap instead of keeping the cell on one line. */
  wrap?: boolean;
};

// Full class names so Tailwind picks them up.
const hideClass = { xl: "hidden xl:table-cell", "2xl": "hidden 2xl:table-cell" };

export function DataTable<T>({
  rows,
  columns,
  rowKey,
  empty = "No records found.",
}: {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string | number;
  empty?: string;
}) {
  if (rows.length === 0) return <EmptyState>{empty}</EmptyState>;

  const cellClass = (col: Column<T>) =>
    cn(
      // A hairline between columns; the last visible column has none.
      "border-r border-border px-4 align-middle last:border-r-0",
      col.align === "right" ? "text-right tabular-nums" : "text-left",
      col.wrap ? "min-w-40 whitespace-normal" : "whitespace-nowrap",
      col.hideBelow && hideClass[col.hideBelow],
    );

  const [first, ...rest] = columns;

  return (
    <>
      {/* Phones and tablets: one card per row, every value labelled, so nothing scrolls sideways. */}
      <ul className="-mx-4 -mt-4 divide-y divide-border lg:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="px-4 py-3">
            <div className="mb-2 text-sm font-semibold text-ink">{first.cell(row, "card")}</div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {rest.map((col) => (
                <div key={col.header} className="contents">
                  <dt className="text-xs leading-5 text-muted">{col.header}</dt>
                  <dd className={cn("min-w-0 text-right text-ink-soft", col.align === "right" && "tabular-nums")}>
                    {col.cell(row, "card")}
                  </dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>

      <div className="-mx-4 -mt-4 hidden overflow-x-auto lg:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
              {columns.map((col) => (
                <th key={col.header} scope="col" className={cn(cellClass(col), "py-2.5 whitespace-nowrap")}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={rowKey(row)} className="hover:bg-subtle/60">
                {columns.map((col) => (
                  <td key={col.header} className={cn(cellClass(col), "py-3 text-ink-soft")}>
                    {col.cell(row, "table")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
