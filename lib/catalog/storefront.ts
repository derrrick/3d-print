import type { Image } from "@/lib/media/types";
import type { Money } from "@/lib/money/types";
import type {
  ProductCard,
  ProductDetails,
  ProductOption,
  ProductVariant,
  SelectedOption,
} from "@/lib/product/types";

import {
  CATALOG_BRANDING,
  CATALOG_COLORS,
  CATALOG_PRODUCTS,
  getBranding,
  getCatalogProduct,
  getMaterial,
  priceFor,
  type CatalogProduct,
} from "./products";

const PLACEHOLDER_IMAGE: Image = {
  altText: "Monterey Print Shop product photo",
  height: 1200,
  url: "/images/product-placeholder.svg",
  width: 1200,
};

function money(amount: number): Money {
  return { amount: amount.toFixed(2), currencyCode: "USD" };
}

function variantId(handle: string, material: string, color: string, branding: string): string {
  return `local-variant-${handle}-${material}-${color}-${branding}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-");
}

function buildVariant(
  product: CatalogProduct,
  material: string,
  color: string,
  branding: string,
): ProductVariant {
  return {
    availableForSale: true,
    bundleParents: [],
    components: [],
    id: variantId(product.handle, material, color, branding),
    image: PLACEHOLDER_IMAGE,
    price: money(priceFor(product.basePrice, material, branding)),
    productHandle: product.handle,
    productTitle: product.title,
    requiresComponents: false,
    requiresSellingPlan: false,
    selectedOptions: [
      { name: "Material", value: material },
      { name: "Color", value: color },
      { name: "Branding", value: branding },
    ],
    sellingPlanAllocations: [],
    title: `${material} / ${color} / ${branding}`,
  };
}

function buildVariants(product: CatalogProduct): ProductVariant[] {
  const variants: ProductVariant[] = [];
  for (const material of product.materials) {
    for (const color of CATALOG_COLORS) {
      for (const branding of CATALOG_BRANDING) {
        variants.push(buildVariant(product, material, color.name, branding.name));
      }
    }
  }
  return variants;
}

function buildOptions(product: CatalogProduct, variants: ProductVariant[]): ProductOption[] {
  const colorValues = CATALOG_COLORS.map((color) => ({
    firstSelectableVariant:
      variants.find((variant) =>
        variant.selectedOptions.some((option) => option.name === "Color" && option.value === color.name),
      ) ?? undefined,
    id: `local-option-color-${color.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: color.name,
    swatch: { color: color.hex },
  }));
  const materialValues = product.materials.map((material) => ({
    firstSelectableVariant:
      variants.find((variant) =>
        variant.selectedOptions.some((option) => option.name === "Material" && option.value === material),
      ) ?? undefined,
    id: `local-option-material-${material}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: material,
  }));
  const brandingValues = CATALOG_BRANDING.map((branding) => ({
    firstSelectableVariant:
      variants.find((variant) =>
        variant.selectedOptions.some((option) => option.name === "Branding" && option.value === branding.name),
      ) ?? undefined,
    id: `local-option-branding-${branding.name}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    name: branding.name,
  }));
  return [
    { id: `local-option-material-${product.handle}`, name: "Material", values: materialValues },
    { id: `local-option-color-${product.handle}`, name: "Color", values: colorValues },
    { id: `local-option-branding-${product.handle}`, name: "Branding", values: brandingValues },
  ];
}

function toCard(product: CatalogProduct): ProductCard {
  const maxPrice =
    product.basePrice +
    Math.max(...product.materials.map((material) => getMaterial(material).delta)) +
    Math.max(...CATALOG_BRANDING.map((branding) => branding.delta));
  return {
    availableForSale: true,
    featuredImage: PLACEHOLDER_IMAGE,
    handle: product.handle,
    id: `local-product-${product.handle}`,
    isGiftCard: false,
    maxPrice: money(maxPrice),
    price: money(product.basePrice),
    title: product.title,
    vendor: "Monterey Print Shop",
  };
}

export function getLocalProductCards(limit?: number): ProductCard[] {
  const cards = CATALOG_PRODUCTS.map(toCard);
  return limit === undefined ? cards : cards.slice(0, limit);
}

export function getLocalProduct(handle: string): ProductDetails | undefined {
  const product = getCatalogProduct(handle);
  if (!product) return undefined;
  const variants = buildVariants(product);
  const defaultVariant = variants[0];
  const prices = variants.map((variant) => Number(variant.price.amount));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  return {
    adjacentVariants: variants,
    allVariantsInStock: true,
    availableForSale: true,
    category: {
      ancestors: [],
      id: `local-category-${product.category}`.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: product.category,
    },
    currencyCode: "USD",
    defaultVariant,
    defaultVariantSelectedOptions: defaultVariant.selectedOptions,
    description: product.description,
    descriptionHtml: `<p>${product.description}</p>`,
    featuredImage: PLACEHOLDER_IMAGE,
    handle: product.handle,
    hasUniformPricing: false,
    id: `local-product-${product.handle}`,
    images: [PLACEHOLDER_IMAGE],
    isGiftCard: false,
    maxPrice: money(maxPrice),
    options: buildOptions(product, variants),
    price: money(product.basePrice),
    priceRange: { maxVariantPrice: money(maxPrice), minVariantPrice: money(minPrice) },
    seo: { description: product.tagline, title: product.title },
    title: product.title,
    updatedAt: "2026-11-03T00:00:00Z",
    variants,
    variantsComplete: true,
    variantsCount: variants.length,
    vendor: "Monterey Print Shop",
    videos: [],
  };
}

export function getLocalProductVariant(
  handle: string,
  selectedOptions: SelectedOption[],
): ProductVariant | undefined {
  const product = getLocalProduct(handle);
  if (!product) return undefined;
  const wanted = new Map(selectedOptions.map((option) => [option.name, option.value]));
  return (
    product.variants?.find((variant) =>
      variant.selectedOptions.every((option) => wanted.get(option.name) === option.value),
    ) ?? product.defaultVariant
  );
}

export function getLocalRecommendations(handle: string): ProductCard[] {
  const product = getCatalogProduct(handle);
  if (!product) return [];
  const sameCategory = CATALOG_PRODUCTS.filter(
    (candidate) => candidate.handle !== handle && candidate.category === product.category,
  );
  const rest = CATALOG_PRODUCTS.filter(
    (candidate) => candidate.handle !== handle && candidate.category !== product.category,
  );
  return [...sameCategory, ...rest].slice(0, 4).map(toCard);
}
