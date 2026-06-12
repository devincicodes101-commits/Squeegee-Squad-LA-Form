/**
 * Per-service field configuration — which fields each service surfaces, in
 * order, for Quick mode (`quick`) and the extra reveals in Detailed mode
 * (`detailed`). Transcribed directly from the pricing sheet's "Quick Mode
 * Inputs" / "Detailed Mode Inputs" columns.
 *
 * This is the ONLY file you edit to add, remove, or reorder what a service
 * collects. The form renders whatever is listed here (resolved through
 * lib/fieldRegistry.ts); the n8n payload stays fixed regardless.
 *
 * Deliberately NOT listed here (handled globally for every service, so they're
 * never repeated per service): ZIP, Lead Source, Property Address, Property
 * Type, Urgency, LA Logistics, Recurring/Frequency, Photos. The approved
 * decision "frequency → Recurring" means the always-on global Recurring control
 * is the single source for cadence; per-service `frequency` would be a duplicate
 * control writing the same key, so it's intentionally omitted.
 *
 * `quantitySource` says where the engine Quantity comes from:
 *   - "feeder"  → the one quick field with feedsQuantity (its value is Quantity).
 *   - "spaces"  → Parking Garage: Quantity derived from spaces (or levels).
 *   - "floors"  → Trash Chute: Quantity derived from floors.
 *   - "one"     → project-based (no natural count): Quantity sent as 1.
 */

import type { Service } from "./constants";
import { getField, type FieldKey } from "./fieldRegistry";

export type QuantitySource = "feeder" | "spaces" | "floors" | "one";

export interface ServiceFieldConfig {
  quick: FieldKey[];
  detailed: FieldKey[];
  quantitySource: QuantitySource;
}

export const SERVICE_FIELD_CONFIG: Record<Service, ServiceFieldConfig> = {
  "Residential Window Cleaning": {
    quick: ["windowCount", "stories", "interiorExterior", "condition", "access"],
    detailed: ["screens", "tracks", "hardWater", "frenchPanes", "height"],
    quantitySource: "feeder",
  },
  "Large/Luxury Residential Windows": {
    quick: ["windowCount", "stories", "condition", "access"],
    detailed: ["screens", "tracks", "hardWater", "frenchPanes", "gatedSecurity"],
    quantitySource: "feeder",
  },
  "Commercial Window Cleaning": {
    quick: ["paneCount", "stories", "condition", "access"],
    detailed: ["interiorExterior", "height"],
    quantitySource: "feeder",
  },
  "High-Access/Lift Window Cleaning": {
    quick: ["stories", "access", "condition"],
    detailed: ["height", "complianceNeeds"],
    quantitySource: "one",
  },
  "Storefront Glass Cleaning": {
    quick: ["storefrontSize", "interiorExterior"],
    detailed: ["access", "parking"],
    quantitySource: "feeder",
  },
  "Recurring Storefront Glass": {
    quick: ["storefrontSize"],
    detailed: ["interiorExterior"],
    quantitySource: "feeder",
  },
  "Residential Pressure Washing": {
    quick: ["sqft", "surfaceType", "condition"],
    detailed: ["staining", "algae", "waterAccess", "drainage"],
    quantitySource: "feeder",
  },
  "Commercial Pressure Washing": {
    quick: ["sqft", "condition"],
    detailed: ["grease", "gum", "waterAccess", "drainage", "nightWork"],
    quantitySource: "feeder",
  },
  "Common Area Pressure Washing": {
    quick: ["areaSize", "condition"],
    detailed: ["stairs", "access", "waterAccess"],
    quantitySource: "feeder",
  },
  "Building Washing / Soft Washing": {
    quick: ["buildingSize", "stories", "material"],
    detailed: ["height", "staining", "waterAccess"],
    quantitySource: "feeder",
  },
  "Sidewalks / Lots / Walkways": {
    quick: ["sqft", "condition"],
    detailed: ["gum", "grease", "algae", "drainage"],
    quantitySource: "feeder",
  },
  "Oil Stain Removal / Degreasing": {
    quick: ["sqft", "severity"],
    detailed: ["surfaceType", "drainage"],
    quantitySource: "feeder",
  },
  "Graffiti Removal": {
    quick: ["approxSize", "surfaceType"],
    detailed: ["paintType", "surfaceSensitivity"],
    quantitySource: "feeder",
  },
  "Slip Hazard Removal": {
    quick: ["areaSize", "severity"],
    detailed: ["surfaceType", "algae"],
    quantitySource: "feeder",
  },
  "Awning Cleaning": {
    quick: ["linearFeet", "height", "condition", "access"],
    detailed: ["material", "staining"],
    quantitySource: "feeder",
  },
  "Solar Panel Cleaning": {
    quick: ["panelCount", "stories", "condition", "access"],
    detailed: ["roofAccess", "pitch", "waterAccess"],
    quantitySource: "feeder",
  },
  "Gutter Cleaning": {
    // propertySize is the sole quantity feeder; gutter debris is captured as a
    // Notes line (`buildup`), NOT the engine's Cleanouts-only Debris Level key.
    quick: ["stories", "propertySize", "condition", "access"],
    detailed: ["buildup", "roofAccess"],
    quantitySource: "feeder",
  },
  "Loading Dock Cleaning": {
    quick: ["dockCount", "condition"],
    detailed: ["grease", "access", "drainage"],
    quantitySource: "feeder",
  },
  "Warehouse Cleaning": {
    quick: ["sqft", "condition", "access"],
    detailed: ["dust", "grease"],
    quantitySource: "feeder",
  },
  "Tennis / Specialty Surface Cleaning": {
    quick: ["surfaceType", "courtCount"],
    detailed: ["surfaceSensitivity", "algae", "access"],
    quantitySource: "feeder",
  },
  "Kitchen Hood Cleaning": {
    quick: ["hoodSize"],
    detailed: ["systemType", "complianceNeeds", "access"],
    quantitySource: "one",
  },
  "Dog Park / Turf Cleaning": {
    quick: ["sqft", "odorSeverity"],
    detailed: ["petWasteLevel", "treatmentType"],
    quantitySource: "feeder",
  },
  "Parking Garage Deep Cleaning": {
    quick: ["levels", "spaces", "condition", "access"],
    detailed: ["oilStains", "drainage", "waterAccess", "nightWork"],
    quantitySource: "spaces",
  },
  "Junk Removal": {
    quick: ["loadSize", "heavyItems"],
    detailed: ["stairs", "elevator", "dumpFees"],
    quantitySource: "feeder",
  },
  "Large Junk Removal": {
    quick: ["estimatedLoads", "access", "condition"],
    detailed: ["dumpFees", "appliances", "stairs", "elevator"],
    quantitySource: "feeder",
  },
  "Eviction / Turnover Cleanouts": {
    quick: ["propertySize", "debrisLevel", "condition", "access"],
    detailed: ["odorSource", "bioConcerns", "stairs", "dumpFees"],
    quantitySource: "feeder",
  },
  "Property Cleanouts": {
    quick: ["propertySize", "debrisLevel", "condition", "access"],
    detailed: ["dumpFees", "odorSource"],
    quantitySource: "feeder",
  },
  "Post-Construction Cleanup": {
    quick: ["sqft", "phase", "condition", "access"],
    detailed: ["dust", "interiorExterior"],
    quantitySource: "feeder",
  },
  "Dumpster Pad Sanitization": {
    quick: ["padCountSize", "condition"],
    detailed: ["grease", "odorSource", "waterAccess"],
    quantitySource: "feeder",
  },
  "Trash Area Cleaning": {
    quick: ["enclosureCount", "condition"],
    detailed: ["odorSource", "buildup", "waterAccess"],
    quantitySource: "feeder",
  },
  "Trash Chute Cleaning": {
    quick: ["floors", "chutes", "odorSeverity", "access"],
    detailed: ["buildup", "treatmentType"],
    quantitySource: "floors",
  },
  "Odor / Bacteria Treatment": {
    quick: ["areaSize", "severity"],
    detailed: ["treatmentType", "odorSource", "recurringNeed"],
    quantitySource: "feeder",
  },
};

/* ------------------------------------------------------------------ */
/* Derived helpers                                                    */
/* ------------------------------------------------------------------ */

/** All field keys a service shows in a given mode. */
export function fieldsForService(
  service: Service,
  detailed: boolean
): FieldKey[] {
  const cfg = SERVICE_FIELD_CONFIG[service];
  const all = detailed ? [...cfg.quick, ...cfg.detailed] : cfg.quick;
  // Defensive dedupe — quick/detailed should be disjoint, but never render the
  // same field twice (and never two quantity feeders bound to one state field).
  return [...new Set(all)];
}

/** The single quantity-feeder field key for a service, or null if none. */
export function quantityFeeder(service: Service): FieldKey | null {
  const cfg = SERVICE_FIELD_CONFIG[service];
  if (cfg.quantitySource !== "feeder") return null;
  return cfg.quick.find((k) => getField(k).feedsQuantity) ?? null;
}

/**
 * Which field drives the Condition multiplier for a service:
 *  - a severity/odor field (mapped onto Condition), or
 *  - the plain `condition` field, or
 *  - null → Condition keeps its own default.
 */
export function conditionSource(service: Service): FieldKey | null {
  const quick = SERVICE_FIELD_CONFIG[service].quick;
  return (
    quick.find((k) => getField(k).mapsToConditionVia) ??
    quick.find((k) => getField(k).formField === "condition") ??
    null
  );
}

/** True when the service collects no countable quantity (project-based). */
export function isProjectBased(service: Service): boolean {
  return SERVICE_FIELD_CONFIG[service].quantitySource === "one";
}
