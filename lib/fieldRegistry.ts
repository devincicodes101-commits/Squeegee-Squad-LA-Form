/**
 * Field registry — the canonical catalog of every input the estimator form can
 * ever render, and exactly how each one maps onto the FIXED n8n wire contract.
 *
 * The contract (see lib/types.ts `N8nEstimatePayload`) never changes. "Dynamic
 * form" means dynamic VISIBILITY of these fields per service — not a different
 * payload. Every field here resolves to one of four routings:
 *
 *   1. feedsQuantity      → the generic `Quantity (...)` wire key. Exactly ONE
 *                           visible field per service may feed quantity.
 *   2. formField          → binds a real, wire-backed FormState field directly
 *                           (condition, access, debrisLevel, cleaningPhase,
 *                           floors, chutes, spaces, levels). The value rides its
 *                           own dedicated wire key, unchanged.
 *   3. mapsToConditionVia → severity / odor selects translate onto the engine's
 *                           Condition multiplier (a pricing decision, approved),
 *                           and the original wording is preserved in Notes.
 *   4. notesKey           → no engine key exists; the value is folded as a
 *                           labelled line into `Notes (optional)` so nothing the
 *                           rep enters is lost and the contract stays intact.
 *
 * To add or change what a service collects you edit lib/serviceFieldConfig.ts,
 * and (only if it's a brand-new input) add an entry here. No component changes.
 */

import { CONDITIONS, type Condition } from "./constants";
import type { FormState } from "./types";

/* ------------------------------------------------------------------ */
/* Field keys                                                         */
/* ------------------------------------------------------------------ */

export type FieldKey =
  // Quantity feeders (each is the `qty:` field for some service)
  | "windowCount"
  | "paneCount"
  | "storefrontSize"
  | "sqft"
  | "areaSize"
  | "buildingSize"
  | "approxSize"
  | "propertySize"
  | "padCountSize"
  | "panelCount"
  | "linearFeet"
  | "loadSize"
  | "estimatedLoads"
  | "dockCount"
  | "courtCount"
  | "enclosureCount"
  // Condition multiplier controls
  | "condition"
  | "severity"
  | "odorSeverity"
  // Other wire-backed dedicated keys
  | "access"
  | "debrisLevel"
  | "phase"
  | "floors"
  | "chutes"
  | "spaces"
  | "levels"
  // Notes-folded extras (quick)
  | "stories"
  | "interiorExterior"
  | "surfaceType"
  | "material"
  | "height"
  | "heavyItems"
  | "hoodSize"
  // Notes-folded extras (detailed adds)
  | "screens"
  | "tracks"
  | "hardWater"
  | "frenchPanes"
  | "gatedSecurity"
  | "staining"
  | "algae"
  | "grease"
  | "gum"
  | "waterAccess"
  | "drainage"
  | "nightWork"
  | "roofAccess"
  | "pitch"
  | "dust"
  | "oilStains"
  | "dumpFees"
  | "stairs"
  | "elevator"
  | "appliances"
  | "bioConcerns"
  | "odorSource"
  | "treatmentType"
  | "buildup"
  | "complianceNeeds"
  | "systemType"
  | "parking"
  | "surfaceSensitivity"
  | "paintType"
  | "petWasteLevel"
  | "recurringNeed";

export type FieldControl = "number" | "select" | "text";

/**
 * A FormState field that a registry field can bind directly. These are the
 * wire-backed inputs — their value flows to a dedicated n8n key untouched.
 */
export type DirectFormField =
  | "quantity"
  | "condition"
  | "access"
  | "debrisLevel"
  | "cleaningPhase"
  | "floors"
  | "chutes"
  | "spaces"
  | "levels";

export interface FieldDef {
  key: FieldKey;
  label: string;
  control: FieldControl;
  options?: readonly string[];
  placeholder?: string;
  hint?: string;

  /** Routing — exactly one of the following applies. */
  /** This field's numeric value becomes the engine Quantity. */
  feedsQuantity?: boolean;
  /** Binds a wire-backed FormState field directly (rides its own key). */
  formField?: DirectFormField;
  /** Translates this select onto the Condition multiplier (severity/odor). */
  mapsToConditionVia?: Record<string, Condition>;
  /**
   * Folded into `Notes (optional)` as `"<label>: <value>"`. Set for every
   * field with no dedicated engine key. severity/odor set BOTH this and
   * mapsToConditionVia (mapped for price, original wording kept in Notes).
   */
  notesKey?: boolean;
}

/* ------------------------------------------------------------------ */
/* Shared option lists / builders                                     */
/* ------------------------------------------------------------------ */

/** Sheet severity scale → engine Condition values (approved mapping). */
const SEVERITY_TO_CONDITION: Record<string, Condition> = {
  Light: "Standard",
  Moderate: "Moderate buildup/staining",
  Heavy: "Heavy buildup/staining",
  Severe: "Severe/restoration",
};
const SEVERITY_OPTIONS = ["Light", "Moderate", "Heavy", "Severe"] as const;

/** A numeric quantity-feeder field. */
function qty(
  key: FieldKey,
  label: string,
  hint: string
): FieldDef {
  return { key, label, control: "number", hint, feedsQuantity: true };
}

/** A simple Notes-folded select (default "" = not provided → not appended). */
function noteSelect(
  key: FieldKey,
  label: string,
  options: readonly string[]
): FieldDef {
  return { key, label, control: "select", options, notesKey: true };
}

/** A simple Notes-folded yes/no concern. */
function noteYesNo(key: FieldKey, label: string): FieldDef {
  return noteSelect(key, label, ["Yes", "No"]);
}

/** A free-text Notes-folded field. */
function noteText(
  key: FieldKey,
  label: string,
  placeholder?: string
): FieldDef {
  return { key, label, control: "text", placeholder, notesKey: true };
}

/* ------------------------------------------------------------------ */
/* The registry                                                       */
/* ------------------------------------------------------------------ */

const FIELDS: FieldDef[] = [
  /* --- Quantity feeders --------------------------------------------- */
  qty("windowCount", "Window panes", "Number of window panes"),
  qty("paneCount", "Pane count", "Number of panes"),
  qty("storefrontSize", "Storefront size", "Total storefront square footage"),
  qty("sqft", "Square footage", "Total square feet to clean"),
  qty("areaSize", "Area size", "Total square footage of the area"),
  qty("buildingSize", "Building size", "Building square footage"),
  qty("approxSize", "Approx. size", "Approximate square footage"),
  qty("propertySize", "Property size", "Property square footage"),
  qty("padCountSize", "Pad size", "Pad square footage (or number of pads)"),
  qty("panelCount", "Panel count", "Number of solar panels"),
  qty("linearFeet", "Linear feet", "Linear feet"),
  qty("loadSize", "Load size", "Truckload fraction or count"),
  qty("estimatedLoads", "Estimated loads", "Number of loads"),
  qty("dockCount", "Dock count", "Number of loading docks"),
  qty("courtCount", "Court count", "Number of courts"),
  qty("enclosureCount", "Enclosure count", "Number of enclosures"),

  /* --- Condition multiplier controls -------------------------------- */
  {
    key: "condition",
    label: "Condition",
    control: "select",
    options: CONDITIONS,
    formField: "condition",
  },
  {
    key: "severity",
    label: "Severity",
    control: "select",
    options: SEVERITY_OPTIONS,
    mapsToConditionVia: SEVERITY_TO_CONDITION,
    notesKey: true,
  },
  {
    key: "odorSeverity",
    label: "Odor severity",
    control: "select",
    options: SEVERITY_OPTIONS,
    mapsToConditionVia: SEVERITY_TO_CONDITION,
    notesKey: true,
  },

  /* --- Other wire-backed dedicated keys ----------------------------- */
  {
    key: "access",
    label: "Access",
    control: "select",
    options: ["Easy", "Moderate", "Difficult", "Height/Lift/Rope"],
    formField: "access",
  },
  {
    key: "debrisLevel",
    label: "Debris level",
    control: "select",
    options: ["Not applicable", "Light", "Moderate", "Heavy"],
    placeholder: "Select debris level",
    formField: "debrisLevel",
  },
  {
    key: "phase",
    label: "Cleaning phase",
    control: "select",
    options: ["Not applicable", "Rough", "Final", "Detail"],
    placeholder: "Select phase",
    formField: "cleaningPhase",
  },
  { key: "floors", label: "Floors", control: "number", formField: "floors" },
  {
    key: "chutes",
    label: "Number of chutes",
    control: "number",
    formField: "chutes",
  },
  { key: "spaces", label: "Spaces", control: "number", formField: "spaces" },
  { key: "levels", label: "Levels", control: "number", formField: "levels" },

  /* --- Notes-folded extras (quick) ---------------------------------- */
  noteSelect("stories", "Stories", ["1", "2", "3", "4+"]),
  noteSelect("interiorExterior", "Interior / Exterior", [
    "Exterior only",
    "Interior only",
    "Both (int + ext)",
  ]),
  noteText("surfaceType", "Surface type", "e.g. concrete, brick, stucco"),
  noteText("material", "Material", "e.g. stucco, brick, wood, metal"),
  noteText("height", "Height / access notes", "e.g. 2 stories, needs lift"),
  noteSelect("heavyItems", "Heavy items", ["No", "Some", "A lot"]),
  noteText("hoodSize", "Hood / system size", "e.g. single hood, full system"),

  /* --- Notes-folded extras (detailed adds) -------------------------- */
  noteYesNo("screens", "Screens"),
  noteYesNo("tracks", "Tracks"),
  noteYesNo("hardWater", "Hard-water stains"),
  noteYesNo("frenchPanes", "French panes"),
  noteYesNo("gatedSecurity", "Gated / security access"),
  noteYesNo("staining", "Staining"),
  noteYesNo("algae", "Algae / mildew"),
  noteYesNo("grease", "Grease"),
  noteYesNo("gum", "Gum"),
  noteSelect("waterAccess", "Water access", ["On-site", "Limited", "None"]),
  noteYesNo("drainage", "Drainage concerns"),
  noteYesNo("nightWork", "Night / weekend work"),
  noteSelect("roofAccess", "Roof access", ["Easy", "Moderate", "Difficult"]),
  noteText("pitch", "Roof pitch", "e.g. low, steep"),
  noteYesNo("dust", "Heavy dust"),
  noteYesNo("oilStains", "Oil stains"),
  noteYesNo("dumpFees", "Dump / disposal fees expected"),
  noteYesNo("stairs", "Stairs"),
  noteYesNo("elevator", "Elevator available"),
  noteYesNo("appliances", "Appliances"),
  noteYesNo("bioConcerns", "Biohazard concerns"),
  noteText("odorSource", "Odor source", "e.g. pet, smoke, organic"),
  noteText("treatmentType", "Treatment type", "e.g. enzyme, ozone"),
  noteSelect("buildup", "Buildup", ["Light", "Moderate", "Heavy"]),
  noteYesNo("complianceNeeds", "Compliance / certification needed"),
  noteText("systemType", "System type", "e.g. Type I hood"),
  noteSelect("parking", "Parking", ["Free", "Paid", "Difficult"]),
  noteSelect("surfaceSensitivity", "Surface sensitivity", [
    "Low",
    "Medium",
    "High",
  ]),
  noteText("paintType", "Paint type", "e.g. spray, marker"),
  noteSelect("petWasteLevel", "Pet waste level", ["Light", "Moderate", "Heavy"]),
  noteSelect("recurringNeed", "Recurring need", ["One-time", "Recurring"]),
];

export const FIELD_REGISTRY: Record<FieldKey, FieldDef> = Object.fromEntries(
  FIELDS.map((f) => [f.key, f])
) as Record<FieldKey, FieldDef>;

export function getField(key: FieldKey): FieldDef {
  const def = FIELD_REGISTRY[key];
  if (!def) throw new Error(`Unknown field key: ${key}`);
  return def;
}

/** Compile-time guard: every FormField a registry field binds is real. */
const _formFieldCheck: Record<DirectFormField, true> = {
  quantity: true,
  condition: true,
  access: true,
  debrisLevel: true,
  cleaningPhase: true,
  floors: true,
  chutes: true,
  spaces: true,
  levels: true,
};
// Ensure each DirectFormField names an actual key of FormState.
const _formStateKeys: { [K in DirectFormField]: FormState[K] } =
  null as unknown as { [K in DirectFormField]: FormState[K] };
void _formFieldCheck;
void _formStateKeys;
