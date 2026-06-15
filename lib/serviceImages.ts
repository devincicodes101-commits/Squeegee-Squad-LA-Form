/**
 * Maps each of the 36 services to one of 10 visual categories. The hero panel
 * uses this to swap its background image when the rep selects a service, so the
 * visual reinforces what's being quoted without the user uploading 36 separate
 * photos.
 *
 * Drop your category photos at:
 *   public/services/window.jpg
 *   public/services/pressure.jpg
 *   public/services/solar.jpg
 *   public/services/specialty.jpg
 *   public/services/industrial.jpg
 *   public/services/restaurant.jpg
 *   public/services/garage.jpg
 *   public/services/cleanouts.jpg
 *   public/services/construction.jpg
 *   public/services/trash.jpg
 *
 * Recommended specs: 1600×1200 jpg, ≤ 300 KB each, optimized for the web.
 */

import type { Service } from "./constants";

export type ServiceCategory =
  | "window"
  | "pressure"
  | "solar"
  | "specialty"
  | "industrial"
  | "restaurant"
  | "garage"
  | "cleanouts"
  | "construction"
  | "trash";

export const CATEGORY_META: Record<
  ServiceCategory,
  { label: string; tagline: string; gradient: string }
> = {
  window: {
    label: "Window Cleaning",
    tagline: "Streak-free clarity, every pane",
    gradient: "from-sky-700 to-cyan-900",
  },
  pressure: {
    label: "Pressure Washing",
    tagline: "Surface restoration done right",
    gradient: "from-cyan-700 to-teal-900",
  },
  solar: {
    label: "Solar Panel Cleaning",
    tagline: "Maximum output, minimum dust",
    gradient: "from-amber-600 to-orange-900",
  },
  specialty: {
    label: "Specialty Services",
    tagline: "The jobs nobody else takes",
    gradient: "from-violet-700 to-fuchsia-900",
  },
  industrial: {
    label: "Industrial Cleaning",
    tagline: "Warehouses, docks, scale",
    gradient: "from-slate-700 to-slate-900",
  },
  restaurant: {
    label: "Restaurant Sanitation",
    tagline: "Health-code clean, every visit",
    gradient: "from-rose-700 to-red-900",
  },
  garage: {
    label: "Parking Garage Deep Clean",
    tagline: "Concrete, oil, scale — handled",
    gradient: "from-zinc-700 to-zinc-900",
  },
  cleanouts: {
    label: "Junk Removal & Cleanouts",
    tagline: "Haul it, sweep it, done",
    gradient: "from-amber-700 to-yellow-900",
  },
  construction: {
    label: "Post-Construction Clean",
    tagline: "Site to spotless, turnkey",
    gradient: "from-blue-700 to-indigo-900",
  },
  trash: {
    label: "Trash & Dumpster Sanitation",
    tagline: "Pressure, sanitize, deodorize",
    gradient: "from-emerald-700 to-emerald-900",
  },
};

export const SERVICE_TO_CATEGORY: Record<Service, ServiceCategory> = {
  // ---- Window category ----
  "Residential Window Cleaning": "window",
  "Large/Luxury Residential Windows": "window",
  "Commercial Window Cleaning": "window",
  "High-Access/Lift Window Cleaning": "window",
  "Storefront Glass Cleaning": "window",
  "Recurring Storefront Glass": "window",
  // ---- Pressure / Soft Wash / Gutters ----
  "Residential Pressure Washing": "pressure",
  "Commercial Pressure Washing": "pressure",
  "Common Area Pressure Washing": "pressure",
  "Building Washing / Soft Washing": "pressure",
  "Sidewalks / Lots / Walkways": "pressure",
  "Slip Hazard Removal": "pressure",
  "Gutter Cleaning": "pressure",
  "Commercial Gutter Cleaning": "pressure",
  "Awning Cleaning": "pressure",
  // ---- Solar ----
  "Solar Panel Cleaning": "solar",
  "Commercial Solar Panel Cleaning": "solar",
  // ---- Specialty ----
  "Graffiti Removal": "specialty",
  "Oil Stain Removal / Degreasing": "specialty",
  "Tennis / Specialty Surface Cleaning": "specialty",
  "Dog Park / Turf Cleaning": "specialty",
  "Odor / Bacteria Treatment": "specialty",
  // ---- Industrial ----
  "Warehouse Cleaning": "industrial",
  "Loading Dock Cleaning": "industrial",
  // ---- Restaurant ----
  "Restaurant Exterior Sanitation": "restaurant",
  "Kitchen Hood Cleaning": "restaurant",
  // ---- Garage ----
  "Parking Garage Deep Cleaning": "garage",
  // ---- Cleanouts ----
  "Junk Removal": "cleanouts",
  "Large Junk Removal": "cleanouts",
  "Eviction / Turnover Cleanouts": "cleanouts",
  "Property Cleanouts": "cleanouts",
  // ---- Construction ----
  "Post-Construction Cleanup": "construction",
  "Commercial Post-Construction Cleanup": "construction",
  // ---- Trash / Dumpster ----
  "Trash Chute Cleaning": "trash",
  "Dumpster Pad Sanitization": "trash",
  "Trash Area Cleaning": "trash",
};

/** Image path for a service's category — drops the photo from /public/services/. */
export function imageForService(service: Service): string {
  const cat = SERVICE_TO_CATEGORY[service];
  return `/services/${cat}.jpg`;
}

export function metaForService(service: Service) {
  const cat = SERVICE_TO_CATEGORY[service];
  return { category: cat, ...CATEGORY_META[cat] };
}
