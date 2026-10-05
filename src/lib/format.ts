const nprFormat = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

/** Nepali rupees, grouped the South Asian way: Rs 18,50,000 */
export function npr(value: number | null | undefined): string {
  if (value == null) return "—";
  return `Rs ${nprFormat.format(value)}`;
}

/** '2026-06-04' -> '4 Jun 2026' */
export function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const [y, m, d] = value.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function claimNo(id: number): string {
  return `CLM-${String(id).padStart(4, "0")}`;
}
