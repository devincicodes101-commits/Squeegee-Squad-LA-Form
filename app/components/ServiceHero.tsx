"use client";

import { useEffect, useRef, useState } from "react";

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
 * changes service, the image cross-fades into the next one (200 ms). The
 * underlying photos live in /public/services/{category}.jpg — if a photo is
 * missing the gradient + label still look polished on its own.
 */
export function ServiceHero({ service }: { service: Service }) {
  const meta = metaForService(service);
  const imgSrc = imageForService(service);

  // Cross-fade state — `current` is the visible image, `incoming` swaps in over it.
  const [current, setCurrent] = useState(imgSrc);
  const [incoming, setIncoming] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(true);
  const lastSrcRef = useRef(imgSrc);

  useEffect(() => {
    if (imgSrc === lastSrcRef.current) return;
    lastSrcRef.current = imgSrc;
    setIncoming(imgSrc);
    setHasImage(true);
  }, [imgSrc]);

  return (
    <aside
      className="relative isolate w-full overflow-hidden rounded-3xl border border-line/60 bg-primary shadow-2xl shadow-primary/10 lg:sticky lg:top-6 lg:h-[calc(100vh-3rem)]"
      aria-label={`${meta.label} hero panel`}
    >
      {/* Layer 1 — gradient fallback (always present; visible if image missing) */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${meta.gradient}`}
        aria-hidden
      />

      {/* Layer 2 — current image (fades out as `incoming` arrives) */}
      {hasImage && (
        <img
          key={`current-${current}`}
          src={current}
          alt=""
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: incoming ? 0 : 1 }}
          onError={() => setHasImage(false)}
          aria-hidden
        />
      )}

      {/* Layer 3 — incoming image (fades in, then promoted to current) */}
      {hasImage && incoming && (
        <img
          key={`incoming-${incoming}`}
          src={incoming}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 ease-out"
          onLoad={(e) => {
            requestAnimationFrame(() => {
              (e.currentTarget as HTMLImageElement).style.opacity = "1";
              setTimeout(() => {
                setCurrent(incoming);
                setIncoming(null);
              }, 520);
            });
          }}
          onError={() => {
            setHasImage(false);
            setIncoming(null);
          }}
          aria-hidden
        />
      )}

      {/* Layer 4 — readability gradient (deep teal → clear) */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-primary-dark/20"
        aria-hidden
      />

      {/* Layer 5 — subtle sparkle / depth */}
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

      {/* Foreground content */}
      <div className="relative flex h-full min-h-[180px] flex-col justify-between p-5 text-surface sm:min-h-[220px] sm:p-7 lg:p-8">
        <div className="flex items-center justify-between gap-3">
          <span className="tracked inline-flex items-center gap-2 rounded-full border border-surface/30 bg-surface/10 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
            Quoting Now
          </span>
          <span className="tracked hidden text-[10px] font-semibold text-surface/70 lg:inline">
            Squeegee Squad LA
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="tracked text-[10px] font-semibold text-accent-light">
            Service category
          </span>
          <h2 className="text-2xl font-bold leading-tight tracking-tight sm:text-3xl lg:text-4xl">
            {meta.label}
          </h2>
          <p className="max-w-xs text-sm font-medium text-surface/85 sm:text-base">
            {meta.tagline}
          </p>
          <p className="mt-3 max-w-xs text-xs text-surface/75 sm:text-sm">
            <span className="font-semibold text-surface/95">{service}</span>
            <span className="block mt-1 text-surface/60">
              Premium service-grade estimate. Final pricing confirmed after site review.
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}
