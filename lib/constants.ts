/**
 * Option lists and labels for the estimator.
 *
 * IMPORTANT: every string in the `*_OPTIONS` arrays below is a WIRE VALUE — the
 * literal text the n8n pricing engine matches on. Do not "clean up" these
 * strings (spacing, slashes, em-dashes, the § sign). Any deviation silently
 * breaks a lookup in the engine and you get a wrong / minimum-only price.
 *
 * Friendly UI labels live in the form components; these are what gets sent.
 */

export const ESTIMATE_MODES = ["Quick", "Detailed"] as const;
export type EstimateMode = (typeof ESTIMATE_MODES)[number];

export const LEAD_SOURCES = [
  "door knocking",
  "phone",
  "referral",
  "repeat customer",
  "Google Ads",
  "website",
  "postcard",
  "flyer",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const PROPERTY_TYPES = [
  "Residential",
  "Commercial",
  "HOA/Multi-Unit",
  "Premium/Luxury",
] as const;
export type PropertyType = (typeof PROPERTY_TYPES)[number];

/** The 36 services — verbatim. Order preserved from the spec. */
export const SERVICES = [
  "Residential Window Cleaning",
  "Large/Luxury Residential Windows",
  "Commercial Window Cleaning",
  "High-Access/Lift Window Cleaning",
  "Storefront Glass Cleaning",
  "Recurring Storefront Glass",
  "Residential Pressure Washing",
  "Commercial Pressure Washing",
  "Common Area Pressure Washing",
  "Building Washing / Soft Washing",
  "Sidewalks / Lots / Walkways",
  "Oil Stain Removal / Degreasing",
  "Graffiti Removal",
  "Slip Hazard Removal",
  "Awning Cleaning",
  "Solar Panel Cleaning",
  "Commercial Solar Panel Cleaning",
  "Gutter Cleaning",
  "Commercial Gutter Cleaning",
  "Loading Dock Cleaning",
  "Warehouse Cleaning",
  "Tennis / Specialty Surface Cleaning",
  "Kitchen Hood Cleaning",
  "Dog Park / Turf Cleaning",
  "Parking Garage Deep Cleaning",
  "Junk Removal",
  "Large Junk Removal",
  "Eviction / Turnover Cleanouts",
  "Property Cleanouts",
  "Post-Construction Cleanup",
  "Commercial Post-Construction Cleanup",
  "Dumpster Pad Sanitization",
  "Trash Area Cleaning",
  "Restaurant Exterior Sanitation",
  "Trash Chute Cleaning",
  "Odor / Bacteria Treatment",
] as const;
export type Service = (typeof SERVICES)[number];

export const CONDITIONS = [
  "Standard",
  "Moderate buildup/staining",
  "Heavy buildup/staining",
  "Severe/restoration",
] as const;
export type Condition = (typeof CONDITIONS)[number];

export const ACCESS_OPTIONS = [
  "Easy",
  "Moderate",
  "Difficult",
  "Height/Lift/Rope",
] as const;
export type Access = (typeof ACCESS_OPTIONS)[number];

export const URGENCY_OPTIONS = [
  "Standard",
  "Same-week/Rush",
  "Night/Weekend",
] as const;
export type Urgency = (typeof URGENCY_OPTIONS)[number];

export const LA_LOGISTICS_OPTIONS = [
  "None/Route-friendly",
  "Paid Parking/Loading",
  "DTLA/Dense Access",
  "Water Runoff/Containment",
  "Special Handling",
] as const;
export type LaLogistics = (typeof LA_LOGISTICS_OPTIONS)[number];

export const RECURRING_OPTIONS = [
  "One-Time",
  "Monthly After First Clean",
  "Quarterly After First Clean",
] as const;
export type Recurring = (typeof RECURRING_OPTIONS)[number];

export const PASS_THROUGH_TYPES = [
  "None / Not applicable",
  "Dump/disposal fees",
  "Chemicals/degreaser",
  "Equipment rental/lift",
  "Parking fees",
  "Night/weekend labor premium",
  "Extra crew needed",
  "Water reclamation/containment",
] as const;
export type PassThroughType = (typeof PASS_THROUGH_TYPES)[number];

export const PASS_THROUGH_COVERED_BY = [
  "Sub covers (default)",
  "Company covers",
] as const;
export type PassThroughCoveredBy = (typeof PASS_THROUGH_COVERED_BY)[number];

export const LOGISTICS_ADDON_OPTIONS = [
  "None / Route-friendly",
  "10-15 miles from base",
  "15-25 miles or difficult routing",
  "Parking / loading constraints",
  "Downtown / high-congestion access",
  "Multi-crew coordination",
] as const;
export type LogisticsAddon = (typeof LOGISTICS_ADDON_OPTIONS)[number];

export const CLEANING_PHASES = [
  "Not applicable",
  "Rough",
  "Final",
  "Detail",
] as const;
export type CleaningPhase = (typeof CLEANING_PHASES)[number];

export const DEBRIS_LEVELS = [
  "Not applicable",
  "Light",
  "Moderate",
  "Heavy",
] as const;
export type DebrisLevel = (typeof DEBRIS_LEVELS)[number];

/*
 * Per-service field visibility, quantity unit hints, and the
 * floors/chutes/spaces/levels/phase/debris reveals now live in the field
 * registry + per-service config (lib/fieldRegistry.ts, lib/serviceFieldConfig.ts),
 * which drive the dynamic form. This file is purely the wire-value catalog.
 */
