"use client";

import { useState } from "react";

/**
 * App header with a logo slot wired to /public/logo.png. Until that asset
 * exists the image fails to load and we fall back to the wordmark.
 */
export function Header() {
  const [logoOk, setLogoOk] = useState(true);

  return (
    <header className="border-b border-line bg-surface">
      <div className="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3 sm:px-6">
        {logoOk ? (
          // eslint-disable-next-line @next/next/no-img-element -- swappable asset that may be absent; native onError fallback is intentional.
          <img
            src="/logo.png"
            alt="Squeegee Squad LA"
            className="h-9 w-auto"
            onError={() => setLogoOk(false)}
          />
        ) : (
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-base font-bold text-white"
            >
              SS
            </span>
            <span className="text-lg font-bold tracking-tight text-ink">
              Squeegee Squad <span className="text-primary">LA</span>
            </span>
          </div>
        )}
        <span className="ml-auto rounded-full bg-accent-light px-3 py-1 text-xs font-semibold text-accent-dark">
          Internal Estimator
        </span>
      </div>
    </header>
  );
}
