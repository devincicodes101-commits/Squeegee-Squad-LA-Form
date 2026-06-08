# Squeegee Squad LA — Estimator

Internal estimating tool for **Squeegee Squad LA** (Los Angeles window &
pressure-washing). Reps use it while door-knocking or on calls to generate a
**preliminary estimate range — never a final quote**.

Single-page estimator form + results screen. Create-only: no saved-leads
dashboard, no reading past estimates.

## Architecture

```
Browser (form)
  → Next.js API route  (POST /api/estimate)
  → n8n webhook        (the pricing brain)
  → JSON result
  → Results screen
```

The browser **never** calls n8n directly. All webhook traffic is proxied
server-side through `/app/api/estimate/route.ts`, so the webhook URL stays out of
the client bundle and there are no CORS issues.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS v4 (theme tokens in `app/globals.css`)
- React Hook Form + Zod (`@hookform/resolvers`)

## Getting started

1. Configure the environment:

   ```bash
   cp .env.local.example .env.local
   # then set N8N_WEBHOOK_URL — live value:
   # https://hu6j4d9e.rcld.app/webhook/squeegee-estimate
   ```

   `N8N_WEBHOOK_URL` is read **server-side only** by the API route. Do not prefix
   it with `NEXT_PUBLIC_`.

2. Install and run:

   ```bash
   npm install
   npm run dev
   ```

   Open http://localhost:3000.

3. Build / lint / typecheck:

   ```bash
   npm run build
   npm run lint
   npx tsc --noEmit
   ```

## Branding

Theme colors live in `app/globals.css` (`@theme` block) — swap them in one place.
Defaults: primary `#0B6BCB`, accent `#19B5A6`. Drop a logo at `public/logo.png`;
until it exists the header shows a "Squeegee Squad LA" wordmark fallback.

## Code map

| File | Responsibility |
| --- | --- |
| `lib/constants.ts` | Wire-value option lists (the literal strings the engine matches on) |
| `lib/fieldRegistry.ts` | Canonical catalog of every dynamic field + how each maps onto the wire contract |
| `lib/serviceFieldConfig.ts` | Per-service quick/detailed field lists — **edit this to change what a service collects** |
| `lib/types.ts` | `FormState`, `N8nEstimatePayload`, `EstimateResult`, API envelope |
| `lib/schema.ts` | Zod schema (shared client + server validation, service-aware requiredness) |
| `lib/payload.ts` | `toN8nPayload` mapper + `unwrapEstimateResult` |
| `lib/format.ts` | Currency / range formatting |
| `app/api/estimate/route.ts` | Server proxy: validate → map → POST n8n → unwrap |
| `app/components/*` | Header, form, results, field primitives, markdown |

## Dynamic per-service fields

The form reconfigures its visible fields the moment a service is selected. This
is **visibility only** — the n8n payload always carries the exact same fixed key
set (see the table below); hidden fields are sent at their neutral default.

Two data files drive it:

- **`lib/fieldRegistry.ts`** — one entry per input the form can ever show. Each
  entry declares how its value reaches the wire contract:
  - `feedsQuantity` → the generic `Quantity (…)` key (one per service).
  - `formField` → binds a wire-backed field directly (`condition`, `access`,
    `floors`, `chutes`, `spaces`, `levels`, `debrisLevel`, `cleaningPhase`).
  - `mapsToConditionVia` → `severity` / `odor severity` selects translate onto
    the engine's `Condition` multiplier (an approved pricing decision); the
    original wording is also preserved in `Notes`.
  - `notesKey` → no engine key exists, so the value is folded as a labelled line
    into `Notes (optional)` (e.g. `Stories: 2; Interior / Exterior: Exterior only`).
- **`lib/serviceFieldConfig.ts`** — for each service, the ordered `quick` and
  `detailed` field lists plus where its `Quantity` comes from (`feeder`,
  `spaces`, `floors`, or `one` for project-based services with no count).

**To add, remove, or reorder what a service collects, edit
`serviceFieldConfig.ts` only** — no component changes. If you introduce a
brand-new input, add its entry to `fieldRegistry.ts` first. The form
(`EstimatorForm.tsx`) renders whatever these two files describe.

Globals (ZIP, Lead Source, Property Address, Property Type, Urgency, LA
Logistics, Recurring/Frequency, Photos) render for every service and are **not**
listed per service. Frequency maps onto the global `Recurring` key by decision,
so there is no duplicate per-service frequency control.

> ⚠️ The engine only understands its current keys. Never invent new payload
> keys for a sheet input — route it through `Condition`/`Recurring`/etc. or fold
> it into `Notes`. Getting this wrong silently changes pricing.

## Friendly label → wire key mapping

The form uses friendly labels; `toN8nPayload` assembles the **exact** literal
keys the n8n engine matches on at send time. Three keys contain special
characters — **two em-dashes (—, U+2014) and one section sign (§, U+00A7)** —
copied verbatim. Any deviation silently breaks an engine lookup.

| UI field | Wire key | Type |
| --- | --- | --- |
| Estimate Mode | `Estimate Mode (Quick or Detailed)` | `"Quick"` \| `"Detailed"` |
| Additional Services | `Additional Services (optional, brief §15)` | `string[]` |
| Lead Source | `Lead Source` | string |
| ZIP Code | `ZIP Code` | number |
| Property Address | `Property Address (optional)` | string |
| Property Type | `Property Type` | string |
| Service | `Service` | string |
| Quantity | `Quantity (panes / sq ft / linear ft / panels / loads — depends on service)` | number |
| Condition | `Condition` | string |
| Access | `Access` | string |
| Urgency | `Urgency` | string |
| LA Logistics | `LA Logistics` | string |
| Recurring | `Recurring` | string |
| Pass-through Type | `Pass-through Type` | string |
| Pass-through Costs | `Pass-through costs ($) — disposal, rental, chemicals, etc.` | number |
| Who Covers Pass-through | `Who covers pass-through costs?` | string |
| Logistics Add-On | `Logistics Add-On (primary factor)` | string |
| Photos | `Photos (optional, multiple allowed)` | boolean (presence-only) |
| Floors | `Floors (Trash Chute Cleaning only)` | number |
| Number of Chutes | `Number of Chutes (Trash Chute Cleaning only)` | number |
| Spaces | `Spaces (Parking Garage only)` | number |
| Levels | `Levels (Parking Garage only)` | number |
| Cleaning Phase | `Cleaning Phase (Post-Construction only)` | string |
| Debris Level | `Debris Level (Cleanouts only)` | string |
| Estimated Crew Hours | `Estimated Crew Hours (internal sanity check)` | number |
| Notes | `Notes (optional)` | string |

Unfilled fields are sent as `""` (text), `0` (numbers), or `[]` (Additional
Services). In **Quick** mode the Detailed/conditional fields collapse to their
neutral defaults. `Photos` is presence-only for v1 — the engine checks
truthiness only; there is a clearly-commented upload seam in `EstimatorForm.tsx`.

## Response handling

The webhook may return a bare object, an array `[ {...} ]`, or `{ json: {...} }`.
`unwrapEstimateResult` normalizes all three to a single `EstimateResult` and
asserts `estimate_low` / `estimate_high` are present.

## Testing the round trip independently

Hit the webhook directly with the minimal body (bypasses the app entirely). Note
the special characters in the `Quantity` key:

```bash
curl -X POST 'https://hu6j4d9e.rcld.app/webhook/squeegee-estimate' \
  -H 'Content-Type: application/json' \
  --data-binary @- <<'JSON'
{
  "Estimate Mode (Quick or Detailed)": "Quick",
  "Lead Source": "door knocking",
  "ZIP Code": 90046,
  "Property Type": "Residential",
  "Service": "Residential Window Cleaning",
  "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)": 40,
  "Condition": "Standard",
  "Access": "Easy",
  "Urgency": "Standard",
  "LA Logistics": "None/Route-friendly",
  "Recurring": "One-Time"
}
JSON
```

A healthy response includes integer `estimate_low` / `estimate_high`. If you get
`{"code":404,"message":"... webhook ... is not registered"}`, the **n8n workflow
is not active** — toggle it on in the n8n editor (top-right) and retry.

You can also exercise the app's proxy (send the internal form shape, friendly
keys) once the dev server is running:

```bash
curl -X POST http://localhost:3000/api/estimate \
  -H 'Content-Type: application/json' \
  -d '{"estimateMode":"Quick","leadSource":"door knocking","zip":90046,"address":"","propertyType":"Residential","service":"Residential Window Cleaning","quantity":40,"condition":"Standard","access":"Easy","urgency":"Standard","laLogistics":"None/Route-friendly","recurring":"One-Time","additionalServices":[],"passThroughType":"None / Not applicable","passThroughCost":0,"passThroughCoveredBy":"Sub covers (default)","logisticsAddon":"None / Route-friendly","crewHours":0,"notes":"","floors":0,"chutes":0,"spaces":0,"levels":0,"cleaningPhase":"","debrisLevel":"","photos":false}'
```

Returns `{ "ok": true, "data": { ... } }` on success, or
`{ "ok": false, "error": "..." }` with a friendly message on any failure.
