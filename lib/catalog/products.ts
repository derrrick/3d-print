export interface CatalogMaterial {
  blurb: string;
  delta: number;
  name: string;
}

export interface CatalogColor {
  hex: string;
  name: string;
}

export interface CatalogBranding {
  blurb: string;
  delta: number;
  name: string;
}

export interface CatalogProduct {
  basePrice: number;
  category: string;
  description: string;
  handle: string;
  materials: string[];
  tagline: string;
  title: string;
}

export const CATALOG_MATERIALS: CatalogMaterial[] = [
  {
    blurb: "Full-color rigid prints, the everyday workhorse.",
    delta: 0,
    name: "PLA Multi-Color",
  },
  {
    blurb: "Genuinely soft and flexible. Straps, pouches, grips.",
    delta: 8,
    name: "Soft TPU 75A",
  },
  {
    blurb: "Tough, weather-resistant carbon-fiber blend for parts that work outdoors.",
    delta: 12,
    name: "PET-CF Tough",
  },
  {
    blurb: "Engineering-grade carbon-fiber nylon. Strongest, stiffest, heat-resistant.",
    delta: 18,
    name: "PA-CF Engineering",
  },
];

export const CATALOG_COLORS: CatalogColor[] = [
  { hex: "#222222", name: "Jet Black" },
  { hex: "#f2f0eb", name: "Arctic White" },
  { hex: "#a3b18a", name: "Sage" },
  { hex: "#3b4a8c", name: "Indigo" },
  { hex: "#c96f4a", name: "Terracotta" },
  { hex: "#efe6d0", name: "Cream" },
];

export const CATALOG_BRANDING: CatalogBranding[] = [
  { blurb: "Clean, unbranded finish.", delta: 0, name: "None" },
  { blurb: "Your logo pressed into the print.", delta: 10, name: "Debossed logo" },
  { blurb: "Your logo in metallic foil transfer.", delta: 15, name: "Foil-transfer logo" },
];

export const CATALOG_PRODUCTS: CatalogProduct[] = [
  {
    basePrice: 34,
    category: "Bags & Carry",
    description:
      "A modular organizer that drops into a tote or weekender and keeps every pocket where you left it. Rigid frame, soft-touch dividers, printed to fit your bag.",
    handle: "modular-tote-organizer",
    materials: ["PLA Multi-Color", "Soft TPU 75A", "PET-CF Tough"],
    tagline: "Your tote, organized to the inch.",
    title: "Modular Tote Organizer",
  },
  {
    basePrice: 28,
    category: "Bags & Carry",
    description:
      "A soft, flexible pouch in 75A TPU with a rigid zipper frame and clip loop. Built for cables, chargers, and the small things that vanish into bag bottoms.",
    handle: "soft-tpu-travel-pouch",
    materials: ["Soft TPU 75A", "PLA Multi-Color"],
    tagline: "Soft where it counts, rigid where it matters.",
    title: "Soft TPU Travel Pouch",
  },
  {
    basePrice: 38,
    category: "Bags & Carry",
    description:
      "A rigid-frame bag caddy with TPU feet and dividers, printed in one multi-material job. Holds a bag upright and open on any counter or back seat.",
    handle: "rigid-frame-bag-caddy",
    materials: ["PLA Multi-Color", "Soft TPU 75A", "PET-CF Tough"],
    tagline: "One print, hard frame plus soft grip.",
    title: "Rigid-Frame Bag Caddy",
  },
  {
    basePrice: 32,
    category: "Business & Hospitality",
    description:
      "A custom tap handle with your brewery, cafe, or tasting room mark in full color. Rigid body with a soft-touch grip section, threaded to fit standard taps.",
    handle: "custom-tap-handle",
    materials: ["PLA Multi-Color", "PET-CF Tough", "PA-CF Engineering"],
    tagline: "Your brand, on every pour.",
    title: "Custom Tap Handle",
  },
  {
    basePrice: 26,
    category: "Business & Hospitality",
    description:
      "A set of four coasters with a raised or debossed logo, in your brand colors. Rigid PLA or tough PET-CF for bars and tasting rooms that actually get used.",
    handle: "branded-coaster-set",
    materials: ["PLA Multi-Color", "PET-CF Tough"],
    tagline: "Four coasters, one brand, zero minimums.",
    title: "Branded Coaster Set",
  },
  {
    basePrice: 58,
    category: "Business & Hospitality",
    description:
      "A dimensional logo sign for a counter, wall, or market stall. Multi-color lettering with a rigid backplate, sized to your space and printed in days.",
    handle: "dimensional-logo-sign",
    materials: ["PLA Multi-Color", "PET-CF Tough"],
    tagline: "A sign that looks like you meant it.",
    title: "Dimensional Logo Sign",
  },
  {
    basePrice: 30,
    category: "Office & Retail",
    description:
      "A desk caddy with a card holder, pen slots, and a debossed logo plate. The piece local shops put on the counter that customers actually ask about.",
    handle: "desk-caddy-card-holder",
    materials: ["PLA Multi-Color", "PET-CF Tough"],
    tagline: "Counter presence, printed to order.",
    title: "Desk Caddy & Card Holder",
  },
  {
    basePrice: 24,
    category: "Parts & Repair",
    description:
      "The knob, bracket, or clip you can't buy anymore, remade in engineering filament. Send a photo or the broken part; we model it, print it, and ship it.",
    handle: "replacement-bracket-clip-kit",
    materials: ["PET-CF Tough", "PA-CF Engineering"],
    tagline: "Broken is not discontinued.",
    title: "Replacement Bracket & Clip Kit",
  },
  {
    basePrice: 42,
    category: "Awards & Events",
    description:
      "An award plaque with a foil-transfer mark and multi-color detailing, made one at a time for tournaments, weddings, and team milestones.",
    handle: "award-plaque-foil-mark",
    materials: ["PLA Multi-Color", "PET-CF Tough"],
    tagline: "One at a time, like it should be.",
    title: "Award Plaque with Foil Mark",
  },
  {
    basePrice: 22,
    category: "Outdoor",
    description:
      "A set of clips, strap adjusters, and hangers for trail and golf gear, in tough carbon-fiber blends that survive sun, sweat, and bag jostling.",
    handle: "trail-golf-clip-set",
    materials: ["PET-CF Tough", "PA-CF Engineering", "Soft TPU 75A"],
    tagline: "Small parts, big difference on the course.",
    title: "Trail & Golf Clip Set",
  },
];

export function getCatalogProduct(handle: string): CatalogProduct | undefined {
  return CATALOG_PRODUCTS.find((product) => product.handle === handle);
}

export function getMaterial(name: string): CatalogMaterial {
  return CATALOG_MATERIALS.find((material) => material.name === name) ?? CATALOG_MATERIALS[0];
}

export function getBranding(name: string): CatalogBranding {
  return CATALOG_BRANDING.find((option) => option.name === name) ?? CATALOG_BRANDING[0];
}

export function priceFor(basePrice: number, materialName: string, brandingName: string): number {
  return basePrice + getMaterial(materialName).delta + getBranding(brandingName).delta;
}
