/**
 * Editorial header — sage band with subtle hero imagery underneath.
 * Cleaning-service appropriate visual (modern glass / architecture) blurred
 * and overlaid with a sage wash, so it adds texture without competing with
 * the wordmark. Mobile-first responsive sizing.
 */
export function Header() {
  return (
    <header className="relative overflow-hidden bg-primary text-surface">
      {/* Hero background — modern glass architecture from Unsplash, with a heavy
          sage overlay so it reads as texture, not photography. CSS-only fade. */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-overlay"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1545486332-9e0999c535b2?auto=format&fit=crop&w=1600&q=70')",
        }}
        aria-hidden
      />
      {/* Sage gradient overlay — keeps text readable, adds depth */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-primary-dark"
        style={{ mixBlendMode: "multiply" }}
        aria-hidden
      />

      {/* Subtle water-droplet sparkle accents — pure SVG, no asset */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-20"
        viewBox="0 0 1200 200"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <defs>
          <radialGradient id="droplet" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="white" stopOpacity="0.8" />
            <stop offset="60%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
        </defs>
        {/* A few scattered droplets/sparkles */}
        <circle cx="120" cy="48" r="3" fill="url(#droplet)" />
        <circle cx="280" cy="120" r="2" fill="url(#droplet)" />
        <circle cx="1050" cy="60" r="4" fill="url(#droplet)" />
        <circle cx="950" cy="140" r="2.5" fill="url(#droplet)" />
        <circle cx="200" cy="170" r="2" fill="url(#droplet)" />
        <circle cx="800" cy="40" r="2" fill="url(#droplet)" />
      </svg>

      {/* The sage band content */}
      <div className="relative mx-auto w-full max-w-4xl px-4 py-7 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          {/* Left rule */}
          <span
            aria-hidden
            className="hidden h-px flex-1 bg-surface/40 sm:block"
          />

          {/* Center wordmark */}
          <div className="flex flex-col items-center text-center">
            <span className="tracked text-[10px] font-medium text-surface/75 sm:text-xs">
              Squeegee Squad
            </span>
            <span className="font-serif mt-1.5 text-2xl font-light tracking-[0.22em] sm:text-3xl">
              LOS&nbsp;ANGELES
            </span>
            <span className="tracked mt-1.5 text-[9px] font-medium text-surface/65 sm:text-[10px]">
              Window · Pressure · Specialty
            </span>
          </div>

          {/* Right rule */}
          <span
            aria-hidden
            className="hidden h-px flex-1 bg-surface/40 sm:block"
          />
        </div>

        {/* Status pill — floats top-right, smaller on mobile */}
        <span className="tracked absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-surface/30 bg-surface/10 px-2 py-0.5 text-[8px] font-medium text-surface backdrop-blur-sm sm:right-6 sm:top-6 sm:px-2.5 sm:py-1 sm:text-[10px]">
          <span className="h-1.5 w-1.5 rounded-full bg-surface" aria-hidden />
          Internal
        </span>
      </div>

      {/* Thin cream accent strip */}
      <div className="relative h-px w-full bg-surface/20" />
    </header>
  );
}
