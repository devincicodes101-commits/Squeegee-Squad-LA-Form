"use client";

import { useState } from "react";

import type { Service } from "@/lib/constants";
import { imageForService, metaForService } from "@/lib/serviceImages";

/**
 * Service-aware hero panel.
 *
 * Layout:
 *   - Desktop: tall sticky panel beside the form (split-screen).
 *   - Mobile: short banner above the form.
 *
 * Visual: a full-bleed photo for the current service category, with a
 * deep-teal gradient overlay + the category label + tagline. When the rep
 * changes service, the photo fades in over the gradient (via a CSS keyframe
 * keyed on the src). The underlying photos live in /public/services/{cat}.jpg
 * — if one is missing or fails to load, the gradient + label still look
 * polished on their own, AND other categories remain functional (per-src
 * failure tracking, not a global flag).
 */
export function ServiceHero({ service }: { service: Service }) {
  const meta = metaForService(service);
  const imgSrc = imageForService(service);
  // Per-src failure map so one bad file doesn't break every other category.
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  return (
    <aside
      className="relative isolate w-full overflow-hidden rounded-2xl border border-line/60 bg-primary shadow-xl shadow-primary/10 sm:rounded-3xl sm:shadow-2xl lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]"
      aria-label={`${meta.label} hero panel`}
    >
      {/* Layer 1 — category gradient (always present; visible behind any image) */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`}
        aria-hidden
      />

      {/* Layer 2 — the photo. `key={imgSrc}` remounts on swap so React mounts
          a fresh <img> and the heroFade keyframe restarts. Skipped entirely
          when (a) the service is in the photoless "general" category or
          (b) we've recorded a load failure for that specific src. */}
      {imgSrc && !failed[imgSrc] && (
        <img
          key={imgSrc}
          src={imgSrc}
          alt=""
          className="animate-heroFade absolute inset-0 h-full w-full object-cover"
          onError={() => setFailed((m) => ({ ...m, [imgSrc]: true }))}
          aria-hidden
        />
      )}

      {/* Layer 3 — readability overlay (deep teal at bottom → clear at top) */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-primary-dark/10"
        aria-hidden
      />

      {/* Layer 4 — subtle sparkles for depth */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-30"
        viewBox="0 0 400 600"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="hero-spark" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="80" cy="60" r="2.5" fill="url(#hero-spark)" />
        <circle cx="320" cy="120" r="3" fill="url(#hero-spark)" />
        <circle cx="200" cy="220" r="1.8" fill="url(#hero-spark)" />
        <circle cx="60" cy="380" r="2" fill="url(#hero-spark)" />
        <circle cx="340" cy="480" r="2.5" fill="url(#hero-spark)" />
      </svg>

      {/* Foreground content — compact on phone, full on tablet+, lush on desktop */}
      <div className="relative flex h-full min-h-[140px] flex-col justify-between p-4 text-surface sm:min-h-[220px] sm:p-7 lg:p-8">
        <div className="flex items-center justify-between gap-2">
          <span className="tracked inline-flex items-center gap-1.5 rounded-full border border-surface/30 bg-surface/10 px-2 py-0.5 text-[9px] font-semibold backdrop-blur-sm sm:gap-2 sm:px-2.5 sm:py-1 sm:text-[10px]">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Quoting Now
          </span>
          <span className="tracked hidden text-[10px] font-semibold text-surface/70 lg:inline">
            Squeegee Squad LA
          </span>
        </div>

        <div className="flex flex-col gap-1.5 sm:gap-2">
          <span className="tracked text-[9px] font-semibold text-accent-light sm:text-[10px]">
            Service category
          </span>
          <h2 className="text-lg font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {meta.label}
          </h2>
          <p className="max-w-xs text-xs font-medium text-surface/85 sm:text-base">
            {meta.tagline}
          </p>
          {/* Service name + disclaimer — hide disclaimer on phone (saves vertical) */}
          <p className="mt-1 max-w-xs text-[11px] text-surface/85 sm:mt-3 sm:text-sm">
            <span className="font-semibold text-surface/95">{service}</span>
            <span className="mt-1 hidden text-surface/60 sm:block">
              Premium service-grade estimate. Final pricing confirmed after site
              review.
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
