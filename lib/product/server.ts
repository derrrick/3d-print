import type { ProductRecommendationIntent } from "@shopify/hydrogen/storefront-api-types";

import type { CommerceLocale } from "@/lib/config/types";
import type {
  ProductCard,
  ProductDetails,
  ProductPage,
  ProductVariant,
  SelectedOption,
} from "@/lib/product/types";

import {
  getLocalProduct,
  getLocalProductCards,
  getLocalProductVariant,
  getLocalRecommendations,
} from "@/lib/catalog/storefront";

export function tagProducts(_products: Array<{ id: string }>): void {}

export async function getProduct(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ProductDetails | undefined> {
  return getLocalProduct(params.handle);
}

export async function getSearchIndexProducts(params: {
  limit?: number;
}): Promise<ProductPage> {
  return {
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
    products: getLocalProductCards(params.limit),
  };
}

export async function getProductRecommendations(params: {
  handle: string;
  intent: ProductRecommendationIntent;
  locale?: CommerceLocale;
}): Promise<ProductCard[]> {
  return getLocalRecommendations(params.handle);
}

export async function fetchProductVariant(params: {
  handle: string;
  selectedOptions: SelectedOption[];
}): Promise<ProductVariant | undefined> {
  return getLocalProductVariant(params.handle, params.selectedOptions);
}
