/**
 * Premium header — deep teal band with crisp white wordmark.
 *
 * Aesthetic: high-end professional services (think SaaS for trades).
 * Subtle architectural-glass photo blended underneath with multiply, so it
 * reads as depth rather than busy imagery.
 */
export function Header() {
  return (
    <header className="relative overflow-hidden bg-primary text-surface">
      {/* Layer 1 — crisp gradient base */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-primary-dark via-primary to-accent-dark"
        aria-hidden
      />

      {/* Layer 2 — radial highlight (subtle depth, top-left) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(circle at 15% 30%, rgba(6, 182, 212, 0.25) 0%, transparent 50%)",
        }}
        aria-hidden
      />

      {/* Layer 3 — fine grid pattern (premium SaaS feel) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.08]"
        aria-hidden
      >
        <defs>
          <pattern
            id="header-grid"
            width="32"
            height="32"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 32 0 L 0 0 0 32"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#header-grid)" />
      </svg>

      {/* Header content */}
      <div className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 sm:py-6">
        {/* Left — brand mark */}
        <div className="flex items-center gap-3">
          {/* Logo squeegee glyph */}
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface/15 backdrop-blur-sm ring-1 ring-surface/25 sm:h-11 sm:w-11">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5 text-surface sm:h-6 sm:w-6"
              aria-hidden
            >
              <path
                d="M3 7h18M5 7v10a2 2 0 002 2h10a2 2 0 002-2V7"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 11l1.5 6M16 11l-1.5 6M12 11v6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-base font-bold tracking-tight text-surface sm:text-lg">
              Squeegee Squad
            </span>
            <span className="tracked text-[9px] font-semibold text-accent-light sm:text-[10px]">
              Los Angeles · Estimator
            </span>
          </div>
        </div>

        {/* Right — status pill */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden text-[11px] font-medium text-surface/70 sm:inline">
            Internal use only
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-surface/25 bg-surface/10 px-2.5 py-1 text-[10px] font-semibold text-surface backdrop-blur-md sm:px-3 sm:py-1.5 sm:text-xs">
            <span
              className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent"
              aria-hidden
            />
            Live
          </span>
        </div>
      </div>

      {/* Bottom accent line */}
      <div className="relative h-px w-full bg-gradient-to-r from-transparent via-accent/60 to-transparent" />
    </header>
  );
}
