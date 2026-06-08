/**
 * Type contracts for the estimator.
 *
 * Three distinct shapes, kept deliberately separate:
 *  - FormState          — the internal, friendly-keyed shape the UI works with.
 *  - N8nEstimatePayload — the exact wire shape POSTed to n8n (literal label keys).
 *  - EstimateResult     — the unwrapped response from n8n.
 *
 * The mapping from FormState -> N8nEstimatePayload happens only at send time in
 * `toN8nPayload` (see ./payload.ts), so the exact-label keys live in exactly one
 * place.
 */

import type {
  Access,
  CleaningPhase,
  Condition,
  DebrisLevel,
  EstimateMode,
  LaLogistics,
  LeadSource,
  LogisticsAddon,
  PassThroughCoveredBy,
  PassThroughType,
  PropertyType,
  Recurring,
  Service,
  Urgency,
} from "./constants";

/* ------------------------------------------------------------------ */
/* Internal form state                                                */
/* ------------------------------------------------------------------ */

/**
 * What the form holds. Friendly field names, real JS types. This is the source
 * of truth for the UI and what the API route validates against.
 *
 * Numbers are stored as numbers (RHF `valueAsNumber`). Optional text fields are
 * empty strings rather than undefined to keep the controlled-input story simple.
 */
export interface FormState {
  estimateMode: EstimateMode;

  // Core (always visible)
  leadSource: LeadSource;
  zip: number;
  address: string;
  propertyType: PropertyType;
  service: Service;
  quantity: number;
  condition: Condition;
  access: Access;
  urgency: Urgency;
  laLogistics: LaLogistics;
  recurring: Recurring;

  // Detailed mode only
  additionalServices: Service[];
  passThroughType: PassThroughType;
  passThroughCost: number;
  passThroughCoveredBy: PassThroughCoveredBy;
  logisticsAddon: LogisticsAddon;
  crewHours: number;
  notes: string;

  // Conditional, service-specific
  floors: number; // Trash Chute Cleaning
  chutes: number; // Trash Chute Cleaning
  spaces: number; // Parking Garage Deep Cleaning
  levels: number; // Parking Garage Deep Cleaning
  cleaningPhase: CleaningPhase | ""; // Post-Construction Cleanup
  debrisLevel: DebrisLevel | ""; // Cleanouts

  // Dynamic, no-engine-key field values keyed by FieldKey (e.g. severity,
  // stories, screens). Folded into the Notes wire field at send time — these
  // are never sent under their own keys. Validated as a string record by the
  // zod schema; the keys are FieldKeys but typed loosely here.
  extras: Record<string, string>;

  // Presence-only for v1. See the upload seam in the form component.
  photos: boolean;
}

/* ------------------------------------------------------------------ */
/* Wire payload (request)                                             */
/* ------------------------------------------------------------------ */

/**
 * The EXACT body POSTed to n8n. Keys are literal label strings the engine
 * matches on — three contain special characters (two em-dashes U+2014, one
 * section sign U+00A7). Do not edit these key strings.
 */
export interface N8nEstimatePayload {
  "Estimate Mode (Quick or Detailed)": EstimateMode;
  "Additional Services (optional, brief §15)": string[];
  "Lead Source": LeadSource;
  "ZIP Code": number;
  "Property Address (optional)": string;
  "Property Type": PropertyType;
  Service: Service;
  "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)": number;
  Condition: Condition;
  Access: Access;
  Urgency: Urgency;
  "LA Logistics": LaLogistics;
  Recurring: Recurring;
  "Pass-through Type": PassThroughType;
  "Pass-through costs ($) — disposal, rental, chemicals, etc.": number;
  "Who covers pass-through costs?": PassThroughCoveredBy;
  "Logistics Add-On (primary factor)": LogisticsAddon;
  "Photos (optional, multiple allowed)": boolean;
  "Floors (Trash Chute Cleaning only)": number;
  "Number of Chutes (Trash Chute Cleaning only)": number;
  "Spaces (Parking Garage only)": number;
  "Levels (Parking Garage only)": number;
  "Cleaning Phase (Post-Construction only)": string;
  "Debris Level (Cleanouts only)": string;
  "Estimated Crew Hours (internal sanity check)": number;
  "Notes (optional)": string;
}

/* ------------------------------------------------------------------ */
/* Wire response                                                      */
/* ------------------------------------------------------------------ */

export type Confidence = "High" | "Medium" | "Low";
export type PriorityLabel =
  | "Low Priority"
  | "Standard"
  | "Good"
  | "High Value"
  | "Priority";
export type YesNo = "YES" | "NO";
export type RecurringScore = "Low" | "Medium" | "High" | "Very High";

/**
 * The unwrapped n8n response. Computed fields are typed strictly; echo fields
 * come back as "" or numbers depending on input, so they're typed loosely.
 */
export interface EstimateResult {
  leadId: string;
  timestamp: string;
  mode: string;

  // input echoes (loosely typed — may be "" or numbers)
  lead_source: string;
  zip: string | number;
  address: string;
  property_type: string;
  service: string;
  quantity: string | number;
  condition: string;
  access: string;
  urgency: string;
  la_logistics: string;
  recurring: string;
  pass_through: string | number;
  logistics_factor: string;
  estimate_mode: string;
  additional_services: string;
  additional_services_min_sum: string | number;
  additional_services_breakdown: string;
  crew_hours: string | number;
  implied_rate_low: string | number;
  implied_rate_high: string | number;
  low_hourly_rate: string;
  floors: string | number;
  chutes: string | number;
  spaces: string | number;
  levels: string | number;
  cleaning_phase: string;
  debris_level: string;
  pass_through_type: string;
  pass_through_category: string;
  pass_through_treatment: string;
  logistics_addon_low: string | number;
  logistics_addon_high: string | number;
  pass_through_covered_by: string;
  photos_uploaded: string;
  notes_provided: string;
  notes: string;

  // computed — the important ones (strict)
  estimate_low: number;
  estimate_high: number;
  sub_payout_low: number;
  sub_payout_high: number;
  gross_low: number;
  gross_high: number;
  confidence: Confidence;
  priority_label: PriorityLabel;
  strategic_account: YesNo;
  recurring_score: RecurringScore;
  review_flag: YesNo;
  review_logic: string;
  defaulted_fields: string;
  defaulted_count: number;
  customer_copy: string;
  bundle_recommendation: string;
  range_math: string;
}

/* ------------------------------------------------------------------ */
/* API route envelope                                                 */
/* ------------------------------------------------------------------ */

export type EstimateApiResponse =
  | { ok: true; data: EstimateResult }
  | { ok: false; error: string };

  