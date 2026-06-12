"use client";

import { useState } from "react";

/**
 * Editorial header — sage band on cream, centered tracked wordmark.
 * Inspired by florist/wellness order-form aesthetics: the brand should feel
 * tactile and premium, not SaaS.
 */
export function Header() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header className="bg-primary text-surface">
      {/* The sage band itself */}
      <div className="relative mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex items-center justify-between gap-4">
          {/* Left rule — thin cream line, editorial accent */}
          <span
            aria-hidden
            className="hidden h-px flex-1 bg-surface/40 sm:block"
          />

          {/* Center wordmark */}
          {logoOk ? (
            // eslint-disable-next-line @next/next/no-img-element -- swappable asset; native onError fallback is intentional
            <img
              src="/logo.png"
              alt="Squeegee Squad LA"
              className="h-12 w-auto brightness-0 invert"
              onError={() => setLogoOk(false)}
            />
          ) : (
            <div className="flex flex-col items-center text-center">
              <span className="tracked text-[10px] font-medium text-surface/70 sm:text-xs">
                Squeegee Squad
              </span>
              <span className="mt-1 text-xl font-serif font-light tracking-[0.18em] sm:text-2xl">
                LOS&nbsp;ANGELES
              </span>
              <span className="tracked mt-1 text-[9px] font-medium text-surface/60 sm:text-[10px]">
                Window · Pressure · Specialty
              </span>
            </div>
          )}

          {/* Right rule */}
          <span
            aria-hidden
            className="hidden h-px flex-1 bg-surface/40 sm:block"
          />
        </div>

        {/* Status pill — floats top-right, subtle */}
        <span className="tracked absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-surface/30 bg-surface/10 px-2.5 py-1 text-[9px] font-medium text-surface backdrop-blur-sm sm:right-6 sm:top-6 sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-surface" aria-hidden />
          Internal
        </span>
      </div>

      {/* Thin cream accent strip — between band and content, paper-fold feel */}
      <div className="h-px w-full bg-surface/20" />
    </header>
  );
}
