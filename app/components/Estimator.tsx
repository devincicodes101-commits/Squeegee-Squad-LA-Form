"use client";

import { useState } from "react";
import type { EstimateResult } from "@/lib/types";
import { EstimatorForm } from "./EstimatorForm";
import { ResultsScreen } from "./ResultsScreen";

/**
 * Top-level state machine: form ↔ results.
 *
 * The form unmounts when results show, so "New Estimate" remounts a clean form.
 * Retry (on a failed submit) happens inside the form while it's still mounted,
 * preserving every entered value.
 */
export function Estimator() {
  const [result, setResult] = useState<EstimateResult | null>(null);

  if (result) {
    return (
      <ResultsScreen result={result} onNewEstimate={() => setResult(null)} />
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">
          New Estimate
        </h1>
        <p className="mt-1 text-sm text-muted">
          Generate a preliminary range while door-knocking or on a call. This is
          never a final quote.
        </p>
      </div>
      <EstimatorForm onSuccess={setResult} />
    </div>
  );
}
