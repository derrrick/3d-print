import { CATALOG_PRODUCTS } from "@/lib/catalog/products";
import { getLocalProductCards } from "@/lib/catalog/storefront";
import { filterProductCardsByPrice, PRODUCTS_PER_PAGE, sortProductCards } from "@/lib/collections";
import type { BrowseResults, BrowseState } from "@/lib/collections/types";
import type { Facets } from "@/lib/filters/types";

// The local catalog has no Search & Discovery facets, so search views render without a filter sheet.
const EMPTY_FACETS: Facets = { filters: [] };

export async function fetchSearchResults({
  query,
  statePromise,
}: {
  query?: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const terms = query?.trim().toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const cards = getLocalProductCards();
  const matched =
    terms.length === 0
      ? cards
      : cards.filter((card) => {
          const product = CATALOG_PRODUCTS.find((candidate) => candidate.handle === card.handle);
          const haystack = [
            card.title,
            product?.tagline ?? "",
            product?.description ?? "",
            product?.category ?? "",
          ]
            .join(" ")
            .toLowerCase();
          return terms.every((term) => haystack.includes(term));
        });
  const products = sortProductCards(filterProductCardsByPrice(matched, filters), sort).slice(
    0,
    PRODUCTS_PER_PAGE,
  );
  return {
    dataSearch,
    facets: EMPTY_FACETS,
    pageInfo: {
      endCursor: null,
      hasNextPage: false,
      hasPreviousPage: false,
      startCursor: null,
    },
    products,
    source: { query, type: "search" },
    total: matched.length,
  };
}
