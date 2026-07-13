/**
 * Zod schema for the internal FormState.
 *
 * Used in two places:
 *  - client: via @hookform/resolvers/zod for inline field errors.
 *  - server: in the API route to re-validate before touching n8n.
 *
 * The inferred type is structurally the FormState in ./types.ts; we assert that
 * with a type-level check at the bottom so the two can't silently drift.
 */

import { z } from "zod";
import {
  ACCESS_OPTIONS,
  CLEANING_PHASES,
  CONDITIONS,
  CONFIDENCE_OVERRIDE,
  DEBRIS_LEVELS,
  ESTIMATE_MODES,
  LA_LOGISTICS_OPTIONS,
  LEAD_SOURCES,
  LOGISTICS_ADDON_OPTIONS,
  PASS_THROUGH_COVERED_BY,
  PASS_THROUGH_TYPES,
  PROPERTY_TYPES,
  RECURRING_OPTIONS,
  REVIEW_OVERRIDE,
  SERVICES,
  URGENCY_OPTIONS,
  YES_NO_BLANK,
} from "./constants";
import type { FormState } from "./types";
import { quantityFeeder } from "./serviceFieldConfig";

const nonNegInt = z
  .number({ message: "Enter a number" })
  .int("Must be a whole number")
  .min(0, "Cannot be negative");

export const formSchema = z.object({
  estimateMode: z.enum(ESTIMATE_MODES),

  // Customer contact info — collected in-field by the rep
  customerName: z.string().min(1, "Enter the customer's name").max(120, "Too long"),
  customerEmail: z
    .string()
    .min(1, "Enter the customer's email")
    .email("Enter a valid email"),
  customerPhone: z
    .string()
    .min(7, "Enter the customer's phone")
    .max(30, "Too long"),

  // Core
  leadSource: z.enum(LEAD_SOURCES, { message: "Select a lead source" }),
  zip: z
    .number({ message: "Enter a ZIP code" })
    .int("ZIP must be a whole number")
    .refine((n) => n >= 10000 && n <= 99999, "Enter a valid 5-digit ZIP"),
  address: z.string(),
  propertyType: z.enum(PROPERTY_TYPES, { message: "Select a property type" }),
  service: z.enum(SERVICES, { message: "Select a service" }),
  // Base rule is lenient (≥ 0); whether a quantity is actually REQUIRED is
  // service-aware and enforced in the superRefine below — project-based and
  // dedicated-key services (garage, chute) don't surface a quantity field.
  quantity: z.number({ message: "Enter a quantity" }).min(0, "Cannot be negative"),
  condition: z.enum(CONDITIONS, { message: "Select a condition" }),
  access: z.enum(ACCESS_OPTIONS, { message: "Select an access level" }),
  urgency: z.enum(URGENCY_OPTIONS, { message: "Select urgency" }),
  laLogistics: z.enum(LA_LOGISTICS_OPTIONS, { message: "Select LA logistics" }),
  recurring: z.enum(RECURRING_OPTIONS, { message: "Select a frequency" }),

  // Detailed mode. Defaults are supplied via RHF defaultValues (not here) so the
  // schema's input and output types stay identical — keeps RHF typing simple.
  additionalServices: z.array(z.enum(SERVICES)),
  passThroughType: z.enum(PASS_THROUGH_TYPES),
  passThroughCost: nonNegInt,
  passThroughCoveredBy: z.enum(PASS_THROUGH_COVERED_BY),
  logisticsAddon: z.enum(LOGISTICS_ADDON_OPTIONS),
  crewHours: nonNegInt,
  notes: z.string(),

  // Conditional, service-specific
  floors: nonNegInt,
  chutes: nonNegInt,
  spaces: nonNegInt,
  levels: nonNegInt,
  cleaningPhase: z.enum(CLEANING_PHASES).or(z.literal("")),
  debrisLevel: z.enum(DEBRIS_LEVELS).or(z.literal("")),

  // Notes-folded dynamic extras, keyed by FieldKey. Free-form strings; folded
  // into the Notes wire field at send time, never validated for shape.
  extras: z.record(z.string(), z.string()),

  photos: z.boolean(),

  // Christiana §13 — Fixed Subcontractor Quote (internal only)
  hasFixedSubQuote: z.enum(YES_NO_BLANK),
  fixedSubQuoteAmount: nonNegInt,
  fixedSubQuoteIncludesPassThrough: z.enum(YES_NO_BLANK),

  // Christiana §16 — Manual Override Fields (internal only)
  overrideLow: nonNegInt,
  overrideHigh: nonNegInt,
  overrideConfidence: z.enum(CONFIDENCE_OVERRIDE),
  overrideReviewRequired: z.enum(REVIEW_OVERRIDE),
  overrideReviewReason: z.string(),
  overrideSubPayout: nonNegInt,
  overridePassThrough: nonNegInt,
  overrideCustomerMessage: z.string(),
}).superRefine((data, ctx) => {
  // Service-aware requiredness: a field is required only when the active
  // service surfaces it as a core input. Hidden fields are never required.
  const service = data.service;

  if (quantityFeeder(service) && !(data.quantity >= 1)) {
    ctx.addIssue({
      code: "custom",
      message: "Enter a quantity (at least 1)",
      path: ["quantity"],
    });
  }

  if (service === "Trash Chute Cleaning") {
    if (!(data.floors >= 1))
      ctx.addIssue({ code: "custom", message: "Enter the number of floors", path: ["floors"] });
    if (!(data.chutes >= 1))
      ctx.addIssue({ code: "custom", message: "Enter the number of chutes", path: ["chutes"] });
  }

  if (service === "Parking Garage Deep Cleaning" && !(data.spaces >= 1) && !(data.levels >= 1)) {
    ctx.addIssue({ code: "custom", message: "Enter spaces or levels", path: ["spaces"] });
  }

  if (service === "Post-Construction Cleanup" && !data.cleaningPhase) {
    ctx.addIssue({ code: "custom", message: "Select a cleaning phase", path: ["cleaningPhase"] });
  }

  if (
    (service === "Eviction / Turnover Cleanouts" || service === "Property Cleanouts") &&
    !data.debrisLevel
  ) {
    ctx.addIssue({ code: "custom", message: "Select a debris level", path: ["debrisLevel"] });
  }
});

/** Inferred FormState shape. */
export type FormSchema = z.infer<typeof formSchema>;

// Compile-time guarantee that the schema and the hand-written FormState agree.
// If these drift, one of the two assignments below stops type-checking.
const _formStateMatches: FormState = {} as FormSchema;
const _schemaMatches: FormSchema = {} as FormState;
void _formStateMatches;
void _schemaMatches;
