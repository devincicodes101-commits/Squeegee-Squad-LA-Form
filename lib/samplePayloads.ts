/**
 * Dev-only sanity script — NOT imported by the app.
 *
 * Runs toN8nPayload for a spread of representative services so the quantity
 * routing and Condition canonicalization can be eyeballed against the engine
 * contract. Run with:
 *
 *   npx tsx lib/samplePayloads.ts
 *
 * For each service it prints the generic Quantity, the canonical Condition, and
 * the service-specific dedicated keys (floors/chutes/spaces/levels/phase/debris).
 */

import type { Service } from "./constants";
import { toN8nPayload } from "./payload";
import type { FormState } from "./types";

const QTY_KEY =
  "Quantity (panes / sq ft / linear ft / panels / loads — depends on service)";

/** A neutral FormState for `service`, with `over` applied on top. */
function form(service: Service, over: Partial<FormState>): FormState {
  return {
    estimateMode: "Detailed",
    leadSource: "phone",
    zip: 90046,
    address: "  123 Main St  ",
    propertyType: "Commercial",
    service,
    quantity: 0,
    condition: "Standard",
    access: "Easy",
    urgency: "Standard",
    laLogistics: "None/Route-friendly",
    recurring: "One-Time",
    additionalServices: [],
    passThroughType: "None / Not applicable",
    passThroughCost: 0,
    passThroughCoveredBy: "Sub covers (default)",
    logisticsAddon: "None / Route-friendly",
    crewHours: 0,
    notes: "",
    floors: 0,
    chutes: 0,
    spaces: 0,
    levels: 0,
    cleaningPhase: "",
    debrisLevel: "",
    extras: {},
    photos: false,
    ...over,
  };
}

const SAMPLES: FormState[] = [
  // sq ft + severity → Quantity 800, Condition "Heavy buildup/staining" (NOT "Heavy")
  form("Oil Stain Removal / Degreasing", {
    quantity: 800,
    extras: { severity: "Heavy", surfaceType: "concrete" },
  }),
  // window count + property type → Quantity 50
  form("Large/Luxury Residential Windows", {
    quantity: 50,
    propertyType: "HOA/Multi-Unit",
    extras: { stories: "2" },
  }),
  // stories + property size — the "Detailed-only quantity" suspect. In QUICK
  // mode here, propertySize is a Quick feeder, so Quantity is still populated.
  form("Gutter Cleaning", {
    estimateMode: "Quick",
    quantity: 2200,
    extras: { stories: "2" },
  }),
  // floors + chutes → dedicated keys; generic Quantity must be 0
  form("Trash Chute Cleaning", {
    floors: 10,
    chutes: 2,
    extras: { odorSeverity: "Moderate" },
  }),
  // spaces + levels → dedicated keys; generic Quantity must be 0
  form("Parking Garage Deep Cleaning", {
    spaces: 200,
    levels: 3,
    condition: "Moderate buildup/staining",
  }),
  // sq ft + phase → Quantity 5000, Cleaning Phase "Final"
  form("Post-Construction Cleanup", {
    quantity: 5000,
    cleaningPhase: "Final",
  }),
  // property size + debris level → Quantity 1500, Debris "Heavy" (NOT in Condition)
  form("Eviction / Turnover Cleanouts", {
    quantity: 1500,
    debrisLevel: "Heavy",
  }),
];

for (const f of SAMPLES) {
  const p = toN8nPayload(f);
  console.log(`\n=== ${f.service} (${f.estimateMode}) ===`);
  console.log(`  Quantity : ${p[QTY_KEY]}`);
  console.log(`  Condition: ${JSON.stringify(p.Condition)}`);
  console.log(
    `  Floors=${p["Floors (Trash Chute Cleaning only)"]} ` +
      `Chutes=${p["Number of Chutes (Trash Chute Cleaning only)"]} ` +
      `Spaces=${p["Spaces (Parking Garage only)"]} ` +
      `Levels=${p["Levels (Parking Garage only)"]}`
  );
  console.log(
    `  Phase=${JSON.stringify(p["Cleaning Phase (Post-Construction only)"])} ` +
      `Debris=${JSON.stringify(p["Debris Level (Cleanouts only)"])}`
  );
  console.log(`  Notes    : ${JSON.stringify(p["Notes (optional)"])}`);
}
