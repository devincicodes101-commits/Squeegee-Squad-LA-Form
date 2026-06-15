/**
 * The contract boundary: FormState -> wire payload, and raw response -> EstimateResult.
 *
 * These two functions are the only place that knows about the n8n label keys and
 * the response-wrapping quirks. Keep all that knowledge here.
 */

import type { Condition } from "./constants";
import { getField } from "./fieldRegistry";
import {
  SERVICE_FIELD_CONFIG,
  conditionSource,
  fieldsForService,
} from "./serviceFieldConfig";
import type { EstimateResult, FormState, N8nEstimatePayload } from "./types";

/**
 * Canonical-Condition map. The engine's Condition multiplier lookup is an exact
 * string match: any non-canonical value (e.g. a raw severity scale "Heavy", or a
 * stray-cased/whitespaced string) silently returns a 1× multiplier, so a real
 * severity gets priced as Standard. This map normalizes every value the form can
 * produce — raw severity scale AND the canonical strings themselves — onto the
 * four engine-canonical Condition values, keyed lowercase/trimmed.
 */
const CONDITION_CANON: Record<string, Condition> = {
  light: "Standard",
  none: "Standard",
  standard: "Standard",
  moderate: "Moderate buildup/staining",
  "moderate buildup/staining": "Moderate buildup/staining",
  heavy: "Heavy buildup/staining",
  "heavy buildup/staining": "Heavy buildup/staining",
  severe: "Severe/restoration",
  "severe/restoration": "Severe/restoration",
};

/**
 * Force any value onto a canonical engine Condition. Unknown/empty input falls
 * back to "Standard" (neutral) — never "", which the engine treats as a missing
 * input and docks confidence for.
 */
function toCanonicalCondition(raw: string): Condition {
  return CONDITION_CANON[String(raw ?? "").trim().toLowerCase()] ?? "Standard";
}

/**
 * Resolve the engine Condition for a service. Most services either show the
 * plain Condition select (value used as-is) or none at all (default kept). A
 * few show a severity/odor select that maps ONTO Condition (approved pricing
 * decision); the original wording still rides along in Notes. The returned
 * value is canonicalized at the payload boundary via toCanonicalCondition.
 */
function resolveCondition(form: FormState): string {
  const srcKey = conditionSource(form.service);
  if (!srcKey) return form.condition;
  const def = getField(srcKey);
  // Severity/odor select: its raw scale value drives Condition (canonicalized
  // at the boundary). Falls back to the plain Condition default when unset.
  if (def.mapsToConditionVia) {
    return form.extras?.[srcKey] || form.condition;
  }
  return form.condition;
}

/**
 * Resolve the generic engine Quantity:
 *  - feeder services      → the entered count (coerced; 0 if blank).
 *  - "one" (project-based) → 1, so the engine prices off minimum × multipliers
 *                            rather than flooring a 0 quantity.
 *  - "floors"/"spaces"    → 0. Trash Chute and Parking Garage carry their count
 *                            in dedicated wire keys (Floors/Chutes, Spaces/
 *                            Levels); the engine reads those, so the generic
 *                            Quantity must NOT also be populated.
 */
function resolveQuantity(form: FormState): number {
  switch (SERVICE_FIELD_CONFIG[form.service].quantitySource) {
    case "spaces": // Parking Garage Deep Cleaning
      return 0;
    case "floors": // Trash Chute Cleaning
      return 0;
    case "one": // High-Access/Lift Windows, Kitchen Hood
      return 1;
    default:
      return Number(form.quantity) || 0;
  }
}

/**
 * Fold every visible, no-engine-key field for the active service into a single
 * Notes block as `"<label>: <value>"` lines, prepended with the rep's own notes
 * (Detailed mode). Quick extras always fold; detailed adds only when Detailed.
 * Empty values and "No" answers are skipped to keep the block readable.
 */
function buildNotes(form: FormState, detailed: boolean): string {
  const lines: string[] = [];
  for (const key of fieldsForService(form.service, detailed)) {
    const def = getField(key);
    if (!def.notesKey) continue;
    const val = (form.extras?.[key] ?? "").trim();
    if (!val || val === "No") continue;
    lines.push(`${def.label}: ${val}`);
  }
  const repNotes = detailed ? (form.notes ?? "").trim() : "";
  return [repNotes, lines.join("; ")].filter(Boolean).join("\n");
}

/**
 * Assemble the exact-label wire payload from internal form state.
 *
 * Notes on the contract:
 *  - Send "" for unfilled text, 0 for unfilled numbers, [] for no add-ons —
 *    the engine treats those as neutral/defaulted.
 *  - Conditional service-specific fields are sent regardless; they're 0/""
 *    unless the relevant service surfaced them in the UI.
 *  - In Quick mode we still send the Detailed/conditional fields at their
 *    neutral defaults so the body shape is always complete.
 */
export function toN8nPayload(form: FormState): N8nEstimatePayload {
  const detailed = form.estimateMode === "Detailed";

  // All number keys are coerced with `Number(...) || fallback` so the wire body
  // can never carry NaN or a numeric string; all string keys are trimmed.
  const payload: N8nEstimatePayload = {
    "Estimate Mode (Quick or Detailed)": form.estimateMode,
    // Detailed-only fields collapse to neutral defaults in Quick mode.
    "Additional Services (optional, brief §15)": detailed
      ? Array.isArray(form.additionalServices)
        ? form.additionalServices
        : []
      : [],
    "Lead Source": form.leadSource,
    "ZIP Code": Number(form.zip) || 0,
    "Property Address (optional)": (form.address ?? "").trim(),
    "Property Type": form.propertyType,
    Service: form.service,
    "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)":
      resolveQuantity(form),
    Condition: toCanonicalCondition(resolveCondition(form)),
    Access: form.access,
    Urgency: form.urgency,
    "LA Logistics": form.laLogistics,
    Recurring: form.recurring,
    "Pass-through Type": detailed
      ? form.passThroughType
      : "None / Not applicable",
    "Pass-through costs ($) — disposal, rental, chemicals, etc.": detailed
      ? Number(form.passThroughCost) || 0
      : 0,
    "Who covers pass-through costs?": detailed
      ? form.passThroughCoveredBy
      : "Sub covers (default)",
    "Logistics Add-On (primary factor)": detailed
      ? form.logisticsAddon
      : "None / Route-friendly",
    // Presence-only for v1: engine checks truthiness only.
    "Photos (optional, multiple allowed)": Boolean(form.photos),
    "Floors (Trash Chute Cleaning only)": Number(form.floors) || 0,
    "Number of Chutes (Trash Chute Cleaning only)": Number(form.chutes) || 0,
    "Spaces (Parking Garage only)": Number(form.spaces) || 0,
    "Levels (Parking Garage only)": Number(form.levels) || 0,
    // Dedicated keys, passed through unchanged ("" when the service didn't
    // surface them). Never folded into Condition.
    "Cleaning Phase (Post-Construction only)": (form.cleaningPhase ?? "").trim(),
    "Debris Level (Cleanouts only)": (form.debrisLevel ?? "").trim(),
    "Estimated Crew Hours (internal sanity check)": detailed
      ? Number(form.crewHours) || 0
      : 0,
    // Notes always carries the folded service extras (stories, interior/ext,
    // severity wording, …); the rep's free-text notes ride along in Detailed.
    "Notes (optional)": buildNotes(form, detailed),

    // === Christiana §13 — Fixed Subcontractor Quote (internal-only) ===
    // Sent only in Detailed mode. Engine treats blanks/zeros as "not set".
    "Fixed Sub Quote — Has? (internal §13)": detailed
      ? (form.hasFixedSubQuote ?? "")
      : "",
    "Fixed Sub Quote — Amount ($) (internal §13)": detailed
      ? Number(form.fixedSubQuoteAmount) || 0
      : 0,
    "Fixed Sub Quote — Includes pass-through? (internal §13)": detailed
      ? (form.fixedSubQuoteIncludesPassThrough ?? "")
      : "",

    // === Christiana §16 — Manual Overrides (internal-only) ===
    "Override — Low Estimate ($) (internal §16)": detailed
      ? Number(form.overrideLow) || 0
      : 0,
    "Override — High Estimate ($) (internal §16)": detailed
      ? Number(form.overrideHigh) || 0
      : 0,
    "Override — Confidence (internal §16)": detailed
      ? (form.overrideConfidence ?? "")
      : "",
    "Override — Review Required (internal §16)": detailed
      ? (form.overrideReviewRequired ?? "")
      : "",
    "Override — Review Reason (internal §16)": detailed
      ? (form.overrideReviewReason ?? "").trim()
      : "",
    "Override — Sub Payout ($) (internal §16)": detailed
      ? Number(form.overrideSubPayout) || 0
      : 0,
    "Override — Pass-through ($) (internal §16)": detailed
      ? Number(form.overridePassThrough) || 0
      : 0,
    "Override — Customer Message (internal §16)": detailed
      ? (form.overrideCustomerMessage ?? "").trim()
      : "",
  };

  // Dev-only contract invariant: a future change can't silently drop a key or
  // let a numeric key go non-numeric. Stripped in production builds.
  if (process.env.NODE_ENV !== "production") {
    assertWireContract(payload);
  }

  return payload;
}

/**
 * Dev-only guard: every wire key is present, and every numeric key is a real
 * (non-NaN) number. Throws loudly so contract drift is caught at the boundary.
 */
function assertWireContract(payload: N8nEstimatePayload): void {
  const REQUIRED_KEYS: (keyof N8nEstimatePayload)[] = [
    "Estimate Mode (Quick or Detailed)",
    "Additional Services (optional, brief §15)",
    "Lead Source",
    "ZIP Code",
    "Property Address (optional)",
    "Property Type",
    "Service",
    "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)",
    "Condition",
    "Access",
    "Urgency",
    "LA Logistics",
    "Recurring",
    "Pass-through Type",
    "Pass-through costs ($) — disposal, rental, chemicals, etc.",
    "Who covers pass-through costs?",
    "Logistics Add-On (primary factor)",
    "Photos (optional, multiple allowed)",
    "Floors (Trash Chute Cleaning only)",
    "Number of Chutes (Trash Chute Cleaning only)",
    "Spaces (Parking Garage only)",
    "Levels (Parking Garage only)",
    "Cleaning Phase (Post-Construction only)",
    "Debris Level (Cleanouts only)",
    "Estimated Crew Hours (internal sanity check)",
    "Notes (optional)",
    "Fixed Sub Quote — Has? (internal §13)",
    "Fixed Sub Quote — Amount ($) (internal §13)",
    "Fixed Sub Quote — Includes pass-through? (internal §13)",
    "Override — Low Estimate ($) (internal §16)",
    "Override — High Estimate ($) (internal §16)",
    "Override — Confidence (internal §16)",
    "Override — Review Required (internal §16)",
    "Override — Review Reason (internal §16)",
    "Override — Sub Payout ($) (internal §16)",
    "Override — Pass-through ($) (internal §16)",
    "Override — Customer Message (internal §16)",
  ];
  for (const k of REQUIRED_KEYS) {
    if (!(k in payload)) throw new Error(`toN8nPayload missing key: ${k}`);
  }

  const NUMBER_KEYS: (keyof N8nEstimatePayload)[] = [
    "ZIP Code",
    "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)",
    "Pass-through costs ($) — disposal, rental, chemicals, etc.",
    "Floors (Trash Chute Cleaning only)",
    "Number of Chutes (Trash Chute Cleaning only)",
    "Spaces (Parking Garage only)",
    "Levels (Parking Garage only)",
    "Estimated Crew Hours (internal sanity check)",
    "Fixed Sub Quote — Amount ($) (internal §13)",
    "Override — Low Estimate ($) (internal §16)",
    "Override — High Estimate ($) (internal §16)",
    "Override — Sub Payout ($) (internal §16)",
    "Override — Pass-through ($) (internal §16)",
  ];
  for (const k of NUMBER_KEYS) {
    const v = payload[k];
    if (typeof v !== "number" || Number.isNaN(v)) {
      throw new Error(`toN8nPayload: ${k} must be a number, got ${String(v)}`);
    }
  }
}

/**
 * The webhook may return the result as a bare object, wrapped in an array
 * `[ {...} ]`, or under a `.json` key. Unwrap all three to a single object.
 */
export function unwrapEstimateResult(raw: unknown): EstimateResult {
  let obj = raw;

  // [ {...} ] -> {...}
  if (Array.isArray(obj)) {
    obj = obj[0];
  }

  // { json: {...} } -> {...}
  if (
    obj &&
    typeof obj === "object" &&
    "json" in obj &&
    (obj as { json?: unknown }).json &&
    typeof (obj as { json?: unknown }).json === "object"
  ) {
    obj = (obj as { json: unknown }).json;
  }

  if (!obj || typeof obj !== "object") {
    throw new Error("Webhook returned an unexpected response shape.");
  }

  const result = obj as Partial<EstimateResult>;

  // Minimal sanity check on the fields the whole UI depends on.
  if (
    typeof result.estimate_low !== "number" ||
    typeof result.estimate_high !== "number"
  ) {
    throw new Error("Webhook response is missing the estimate range.");
  }

  return result as EstimateResult;
}
