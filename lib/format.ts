/** Currency + range formatting. All money goes through here — no float artifacts. */

const USD = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Coerce loose wire values (string | number | "") to a finite number or null. */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

/** "$276" */
export function formatUSD(value: number): string {
  return USD.format(value);
}

/** "$276 – $552" (en-dash) */
export function formatRange(low: number, high: number): string {
  return `${USD.format(low)} – ${USD.format(high)}`;
}
