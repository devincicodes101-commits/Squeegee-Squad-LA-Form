"use client";

import { useState } from "react";
import type { Confidence, EstimateResult } from "@/lib/types";
import { formatRange, formatUSD, toNumber } from "@/lib/format";
import { Markdown } from "./Markdown";

const CONFIDENCE_STYLES: Record<Confidence, string> = {
  High: "bg-green-100 text-green-800 border-green-300",
  Medium: "bg-amber-100 text-amber-800 border-amber-300",
  Low: "bg-red-100 text-red-800 border-red-300",
};

function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

/** Renders an implied-rate range like "$42 – $63/hr" when numbers are present. */
function impliedRate(result: EstimateResult): string | null {
  const low = toNumber(result.implied_rate_low);
  const high = toNumber(result.implied_rate_high);
  if (low === null && high === null) return null;
  if (low !== null && high !== null) return `${formatUSD(low)} – ${formatUSD(high)}/hr`;
  const one = (low ?? high) as number;
  return `${formatUSD(one)}/hr`;
}

function InternalRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-1.5">
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="text-right text-sm font-semibold text-ink">{value}</dd>
    </div>
  );
}

export function ResultsScreen({
  result,
  onNewEstimate,
}: {
  result: EstimateResult;
  onNewEstimate: () => void;
}) {
  const [showInternal, setShowInternal] = useState(false);
  const [copied, setCopied] = useState(false);

  const confidence: Confidence =
    result.confidence in CONFIDENCE_STYLES ? result.confidence : "Medium";

  const rate = impliedRate(result);
  const lowHourly = String(result.low_hourly_rate).toUpperCase() === "YES";

  const copyCustomerText = async () => {
    const text = `${result.customer_copy}\n${formatRange(
      result.estimate_low,
      result.estimate_high
    )}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (insecure context). Surface nothing destructive.
      setCopied(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Review banner (internal only) — hides margin/gross financial details from view. */}
      {result.review_flag === "YES" && (() => {
        // Strip anything that mentions margins, gross, RED APPROVAL, dollar amounts,
        // or below-minimum floor. Show only the customer-safe review criteria.
        const safeReviewCriteria = (result.review_logic || "")
          .split(/;\s*/)
          .filter((part) => !/YELLOW MARGIN|RED APPROVAL|gross \$|raw \$|floor applied|LOW HOURLY RATE|FIXED SUB QUOTE|OVERRIDE REASON/i.test(part))
          .join("; ")
          .trim();
        const bannerMessage =
          result.internal_review_message ||
          "This estimate needs manager review before quoting the customer.";
        return (
          <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">
              ⚠ Needs review · internal only
            </p>
            <p className="mt-1 text-sm font-medium text-amber-900">
              {bannerMessage}
            </p>
            {safeReviewCriteria && (
              <p className="mt-1 text-xs text-amber-800/80">
                Watch for: {safeReviewCriteria}
              </p>
            )}
          </div>
        );
      })()}

      {/* Hero */}
      <section className="rounded-2xl border border-line bg-surface p-6 text-center shadow-sm sm:p-10">
        <p className="text-sm font-semibold uppercase tracking-wide text-primary">
          Preliminary Estimate Range
        </p>
        <p className="mt-2 text-4xl font-extrabold tracking-tight text-ink sm:text-6xl">
          {formatRange(result.estimate_low, result.estimate_high)}
        </p>
        {result.customer_copy && (
          <p className="mx-auto mt-3 max-w-xl text-base text-muted">
            {result.customer_copy}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
          <Badge className={CONFIDENCE_STYLES[confidence]}>
            {confidence} confidence
          </Badge>
          <Badge className="border-line bg-canvas text-ink">
            {result.priority_label}
          </Badge>
        </div>

        <p className="mt-5 rounded-lg bg-canvas px-3 py-2 text-xs font-medium text-muted">
          Preliminary estimate — not a final quote.
        </p>
      </section>

      {/* Recommended packages */}
      {result.bundle_recommendation?.trim() && (
        <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-6">
          <h2 className="text-base font-bold text-ink">Recommended Packages</h2>
          <Markdown source={result.bundle_recommendation} />
        </section>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={copyCustomerText}
          className="flex-1 rounded-xl bg-accent px-5 py-3 text-base font-bold text-white shadow-sm transition hover:bg-accent-dark"
        >
          {copied ? "Copied ✓" : "Copy customer text"}
        </button>
        <button
          type="button"
          onClick={onNewEstimate}
          className="flex-1 rounded-xl border border-line bg-surface px-5 py-3 text-base font-bold text-ink transition hover:bg-canvas"
        >
          New Estimate
        </button>
      </div>

      {/* Internal breakdown (collapsible) */}
      <section className="overflow-hidden rounded-2xl border border-dashed border-line bg-surface shadow-sm">
        <button
          type="button"
          onClick={() => setShowInternal((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left sm:px-6"
          aria-expanded={showInternal}
        >
          <span className="flex flex-col">
            <span className="text-sm font-bold text-ink">Internal breakdown</span>
            <span className="text-xs text-muted">
              Not for the customer&apos;s eyes — tap to {showInternal ? "hide" : "show"}.
            </span>
          </span>
          <span
            className={`transition-transform ${showInternal ? "rotate-180" : ""}`}
            aria-hidden
          >
            ▾
          </span>
        </button>

        {showInternal && (
          <div className="border-t border-line px-4 py-4 sm:px-6">
            <dl className="divide-y divide-line">
              <InternalRow
                label="Sub payout (45%)"
                value={formatRange(result.sub_payout_low, result.sub_payout_high)}
              />
              <InternalRow
                label="Company gross (55%)"
                value={formatRange(result.gross_low, result.gross_high)}
              />
              <InternalRow
                label="Implied hourly"
                value={
                  <span className={lowHourly ? "text-red-600" : undefined}>
                    {rate ?? "—"}
                    {lowHourly && " ⚠ low"}
                  </span>
                }
              />
              <InternalRow
                label="Strategic account"
                value={result.strategic_account}
              />
              <InternalRow label="Recurring score" value={result.recurring_score} />
              <InternalRow
                label="Defaulted fields"
                value={`${result.defaulted_fields} (${result.defaulted_count})`}
              />
              <InternalRow label="Lead ID" value={result.leadId} />
            </dl>

            {result.range_math && (
              <div className="mt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                  Range math
                </p>
                <pre className="overflow-x-auto rounded-lg bg-canvas p-3 font-mono text-xs text-ink">
                  {result.range_math}
                </pre>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
