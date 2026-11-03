import {
  type CollectionState,
  getSortByValue,
  parseCollectionParams,
  type ProductFilter,
  serializeCollectionParams,
} from "@shopify/hydrogen";

import type { BrowseState, Collection, SortValue } from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import { summarizeText } from "@/lib/content";
import type { ProductCard } from "@/lib/product/types";

export const PRODUCTS_PER_PAGE = 40;

export function describeCollection(collection: Collection): string {
  return (
    summarizeText(collection.seo.description) ||
    summarizeText(collection.description) ||
    `Shop ${collection.title} at ${shopConfig.site.name}: browse products, compare prices, and check availability.`
  );
}

// Shopify `sort_by` values; "manual" means the collection's own order.
export const SORT_VALUES = [
  "manual",
  "best-selling",
  "title-ascending",
  "title-descending",
  "price-ascending",
  "price-descending",
  "created-ascending",
  "created-descending",
] as const;

// Storefront `search` only sorts by RELEVANCE and PRICE.
export const SEARCH_SORT_EXCLUDE: SortValue[] = [
  "best-selling",
  "created-ascending",
  "created-descending",
  "title-ascending",
  "title-descending",
];

export function getBrowseSort(
  state: Pick<CollectionState, "reverse" | "sortKey">,
): string | undefined {
  return state.sortKey ? getSortByValue(state.sortKey, state.reverse) : undefined;
}

// Local catalog sorting for browse views; unrecognized sorts keep catalog order.
export function sortProductCards(cards: ProductCard[], sort?: string): ProductCard[] {
  const sorted = [...cards];
  switch (sort) {
    case "created-descending":
      return sorted.reverse();
    case "price-ascending":
      return sorted.sort((a, b) => Number(a.price.amount) - Number(b.price.amount));
    case "price-descending":
      return sorted.sort((a, b) => Number(b.price.amount) - Number(a.price.amount));
    case "title-ascending":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title-descending":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    default:
      return sorted;
  }
}

// The local catalog has no facets, so only the price filter from a crafted URL applies.
export function filterProductCardsByPrice(
  cards: ProductCard[],
  filters: ProductFilter[],
): ProductCard[] {
  let result = cards;
  for (const filter of filters) {
    const price = filter.price;
    if (!price) continue;
    const max = price.max ?? null;
    const min = price.min ?? null;
    result = result.filter((card) => {
      const amount = Number(card.price.amount);
      return (min === null || amount >= min) && (max === null || amount <= max);
    });
  }
  return result;
}

export function resolveBrowseParams(search: string | URLSearchParams): BrowseState {
  const state = parseCollectionParams(
    typeof search === "string" ? new URLSearchParams(search) : search,
  );
  return {
    dataSearch: serializeCollectionParams(state).toString(),
    filters: state.filters,
    sort: getBrowseSort(state),
  };
}

const COLLECTION_PATH = /^\/collections\/([^/]+)\/?$/;
const REFINED_COLLECTION_PATH = /^\/collections\/[^/]+\/refine\/?$/;

// The default view never reads search params so its products stay in the static shell and prefetches; filtered and sorted views render from the request-time `refine` route.
export function getRefinedCollectionPath(pathname: string, search: string): string | null {
  const handle = COLLECTION_PATH.exec(pathname)?.[1];
  return handle && resolveBrowseParams(search).dataSearch ? `/collections/${handle}/refine` : null;
}

export function isRefinedCollectionPath(pathname: string): boolean {
  return REFINED_COLLECTION_PATH.test(pathname);
}

export function getBrowseSearch(
  state: Pick<CollectionState, "filters" | "reverse" | "sortKey">,
): string {
  return serializeCollectionParams(state).toString();
}

export function parseFilterInput(input: string): ProductFilter | undefined {
  try {
    return JSON.parse(input) as ProductFilter;
  } catch {
    return undefined;
  }
}
