"use client";

import { useState } from "react";

/**
 * App header — wordmark on the left, internal-tool badge on the right.
 * Premium navy + champagne gold treatment. Drops `/public/logo.png` in if
 * the asset exists; otherwise falls back to a tasteful wordmark.
 */
export function Header() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header className="border-b border-line bg-surface/80 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element -- swappable asset that may be absent; native onError fallback is intentional.
          <img
            src="/logo.png"
            alt="Squeegee Squad LA"
            className="h-10 w-auto"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-base font-bold text-white shadow-sm"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%)",
              }}
            >
              SS
            </span>
            <div className="flex flex-col leading-none">
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
                Squeegee Squad
              </span>
              <span className="mt-0.5 text-lg font-semibold tracking-tight text-ink">
                Los Angeles
              </span>
            </div>
          </div>
        )}
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-light px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-accent-dark">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          Internal Estimator
        </span>
      </div>
    </header>
  );
}
