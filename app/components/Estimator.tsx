"use client";

import { useState } from "react";

import type { Service } from "@/lib/constants";
import type { EstimateResult } from "@/lib/types";
import { EstimatorForm } from "./EstimatorForm";
import { ResultsScreen } from "./ResultsScreen";
import { ServiceHero } from "./ServiceHero";

/**
 * Top-level layout: split-screen on desktop (hero left, form right),
 * stacked on mobile (hero on top, form below).
 *
 * State machine: form ↔ results. The form unmounts when results show, so
 * "New Estimate" remounts a clean form. The selected service bubbles up so
 * the hero panel can swap imagery when the rep switches services.
 */
export function Estimator() {
  const [result, setResult] = useState<EstimateResult | null>(null);
  const [activeService, setActiveService] = useState<Service>(
    "Residential Window Cleaning"
  );

  if (result) {
    return (
      <ResultsScreen result={result} onNewEstimate={() => setResult(null)} />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_minmax(320px,420px)] lg:gap-10">
      {/* LEFT — form column (mobile: appears second; desktop: first) */}
      <div className="order-2 flex min-w-0 flex-col gap-6 lg:order-1 lg:gap-8">
        {/* Hero title block */}
        <div className="flex flex-col gap-3">
          <span className="tracked inline-flex w-fit items-center gap-2 rounded-full bg-primary-light px-3 py-1 text-[10px] font-bold text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Preliminary Estimate
          </span>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Build your estimate
          </h1>
          <p className="max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Generate a preliminary range while door-knocking or on a call. This
            is never a final quote — final pricing is confirmed after a site
            review.
          </p>
        </div>

        <EstimatorForm
          onSuccess={setResult}
          onServiceChange={setActiveService}
        />
      </div>

      {/* RIGHT — service hero (mobile: appears first; desktop: sticky right) */}
      <div className="order-1 lg:order-2">
        <ServiceHero service={activeService} />
      </div>
    </div>
  );
}
