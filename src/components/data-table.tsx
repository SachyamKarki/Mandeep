import type { ReactNode } from "react";
import { EmptyState } from "./ui";

export type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
  align?: "left" | "right";
};

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

  return (
    <div className="-mx-4 -mt-4 overflow-x-auto">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-canvas text-xs font-semibold tracking-wide text-muted uppercase">
            {columns.map((col) => (
              <th key={col.header} className={`px-4 py-2.5 ${col.align === "right" ? "text-right" : ""}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-subtle/60">
              {columns.map((col) => (
                <td
                  key={col.header}
                  className={`px-4 py-3 text-ink-soft ${col.align === "right" ? "text-right tabular-nums" : ""}`}
                >
                  {col.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
