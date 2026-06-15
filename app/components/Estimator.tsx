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
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Hero title block — serif, centered, editorial */}
      <div className="text-center sm:text-left">
        <span className="tracked text-[10px] font-medium text-primary sm:text-xs">
          Preliminary Estimate
        </span>
        <h1 className="heading-rule heading-rule-center mt-2 font-serif text-3xl font-light tracking-tight text-ink sm:heading-rule sm:text-4xl">
          New&nbsp;Estimate
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-muted sm:mx-0 sm:text-[15px]">
          Generate a preliminary range while door-knocking or on a call.
          <span className="hidden sm:inline">
            {" "}
            This is never a final quote — final pricing is confirmed after site
            review.
          </span>
        </p>
      </div>

      <EstimatorForm onSuccess={setResult} />
    </div>
  );
}
