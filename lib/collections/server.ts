import type { Metadata } from "next";
import { cacheLife, cacheTag } from "next/cache";

import { CATALOG_PRODUCTS } from "@/lib/catalog/products";
import { getLocalProductCards } from "@/lib/catalog/storefront";
import {
  describeCollection,
  filterProductCardsByPrice,
  PRODUCTS_PER_PAGE,
  resolveBrowseParams,
  sortProductCards,
} from "@/lib/collections";
import type {
  BrowseResults,
  BrowseState,
  Collection,
  CollectionWithThumbnail,
} from "@/lib/collections/types";
import { shopConfig } from "@/lib/config";
import type { CommerceLocale } from "@/lib/config/types";
import type { Facets } from "@/lib/filters/types";
import { tagProducts } from "@/lib/product/server";
import type { ProductCard } from "@/lib/product/types";
import { buildAlternates, buildOpenGraph } from "@/lib/seo";

// /collections/all is a local virtual collection with no Storefront API equivalent.
export const ALL_PRODUCTS_HANDLE = "all";

// The local catalog has no Search & Discovery facets, so browse views render without a filter sheet.
const EMPTY_FACETS: Facets = { filters: [] };

const EMPTY_PAGE_INFO = {
  endCursor: null,
  hasNextPage: false,
  hasPreviousPage: false,
  startCursor: null,
};

interface CollectionCategory {
  description: string;
  handle: string;
  image: string;
  title: string;
}

// Collection imagery: AI concept shots (see ai-concepts/). Two collections share
// one shot when both of their products appear in it. The image files live in
// public/images/collections/ and are uploaded to the repo separately from code
// pushes, which carry text only.
const COLLECTION_CATEGORIES: CollectionCategory[] = [
  {
    description:
      "Modular organizers, soft pouches, and rigid-frame caddies for totes, weekenders, and everyday carry.",
    handle: "bags-carry",
    image: "/images/collections/bags-carry.webp",
    title: "Bags & Carry",
  },
  {
    description:
      "Tap handles, coaster sets, and dimensional signs branded for cafes, breweries, tasting rooms, and hotels.",
    handle: "business-hospitality",
    image: "/images/collections/business-hospitality.webp",
    title: "Business & Hospitality",
  },
  {
    description:
      "Counter pieces and desk organizers that put a local shop's brand where customers can see it.",
    handle: "office-retail",
    image: "/images/collections/desk-workshop.webp",
    title: "Office & Retail",
  },
  {
    description:
      "Replacement brackets, clips, and knobs remade in engineering filament when the original is discontinued.",
    handle: "parts-repair",
    image: "/images/collections/desk-workshop.webp",
    title: "Parts & Repair",
  },
  {
    description:
      "One-at-a-time plaques and awards with foil-transfer marks for tournaments, weddings, and milestones.",
    handle: "awards-events",
    image: "/images/collections/awards-outdoors.webp",
    title: "Awards & Events",
  },
  {
    description:
      "Clips, strap adjusters, and hangers in tough carbon-fiber blends for trail and golf gear.",
    handle: "outdoor",
    image: "/images/collections/awards-outdoors.webp",
    title: "Outdoor",
  },
];

const PRODUCT_CATEGORIES = new Map(
  CATALOG_PRODUCTS.map((product) => [product.handle, product.category]),
);

function buildCollection(category: CollectionCategory): Collection {
  return {
    description: category.description,
    handle: category.handle,
    id: `local-collection-${category.handle}`,
    image: {
      altText: `${category.title} collection image`,
      height: 1280,
      url: category.image,
      width: 1920,
    },
    path: `/collections/${category.handle}`,
    seo: { description: category.description, title: category.title },
    title: category.title,
  };
}

function cardsForCollection(handle: string): ProductCard[] {
  if (handle === ALL_PRODUCTS_HANDLE) return getLocalProductCards();
  const category = COLLECTION_CATEGORIES.find((candidate) => candidate.handle === handle);
  if (!category) return [];
  return getLocalProductCards().filter(
    (card) => PRODUCT_CATEGORIES.get(card.handle) === category.title,
  );
}

function browseResults(
  cards: ProductCard[],
  source: BrowseResults["source"],
  total?: number,
): BrowseResults {
  return {
    dataSearch: "",
    facets: EMPTY_FACETS,
    pageInfo: EMPTY_PAGE_INFO,
    products: cards.slice(0, PRODUCTS_PER_PAGE),
    source,
    ...(total !== undefined ? { total } : {}),
  };
}

export async function getCollections(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<Collection[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const collections = COLLECTION_CATEGORIES.map(buildCollection);
  return params.limit === undefined ? collections : collections.slice(0, params.limit);
}

export async function getCollection(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<Collection | undefined> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`);

  if (params.handle === ALL_PRODUCTS_HANDLE) return getAllProductsCollection();
  const category = COLLECTION_CATEGORIES.find((candidate) => candidate.handle === params.handle);
  return category ? buildCollection(category) : undefined;
}

export async function getCollectionsListing(
  params: { limit?: number; locale?: CommerceLocale } = {},
): Promise<CollectionWithThumbnail[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", "collections-index");

  const cards = getLocalProductCards();
  const collections = COLLECTION_CATEGORIES.map((category) => {
    const built = buildCollection(category);
    const thumbnailCard = cards.find(
      (card) => PRODUCT_CATEGORIES.get(card.handle) === category.title,
    );
    return {
      ...built,
      thumbnail: built.image ?? thumbnailCard?.featuredImage ?? null,
      thumbnailProductId: thumbnailCard?.id ?? null,
    };
  });
  tagProducts(
    collections.flatMap((collection) =>
      collection.thumbnailProductId ? [{ id: collection.thumbnailProductId }] : [],
    ),
  );
  return params.limit === undefined ? collections : collections.slice(0, params.limit);
}

export async function readBrowseState(
  searchParamsPromise: Promise<Record<string, string | string[] | undefined>>,
): Promise<BrowseState> {
  return resolveBrowseParams(recordToSearchParams(await searchParamsPromise));
}

function recordToSearchParams(
  record: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      for (const item of value) params.append(key, item);
    } else if (value !== undefined) {
      params.set(key, value);
    }
  }
  return params;
}

// The default view, unfiltered and in its default sort.
export async function getCollectionResults(params: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("collections", `collection-${params.handle}`, "products-index");

  const products = cardsForCollection(params.handle);
  tagProducts(products);
  return browseResults(products, { collection: params.handle, type: "collection" });
}

export async function getAllProductsResults(
  params: { locale?: CommerceLocale } = {},
): Promise<BrowseResults> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("products-index");

  const products = getLocalProductCards();
  tagProducts(products);
  return browseResults(products, { type: "search" }, products.length);
}

// Filtered and sorted views stay live; a cache entry per combination would rarely be reused.
export async function fetchCollectionResults({
  handle,
  statePromise,
}: {
  handle: string;
  statePromise: Promise<BrowseState>;
}): Promise<BrowseResults> {
  const { dataSearch, filters, sort } = await statePromise;
  const products = sortProductCards(
    filterProductCardsByPrice(cardsForCollection(handle), filters),
    sort,
  );
  return {
    ...browseResults(products, { collection: handle, type: "collection" }),
    dataSearch,
  };
}

export async function getAllProductsCollection(): Promise<Collection> {
  const title = "Products";
  const description = "";
  return {
    handle: ALL_PRODUCTS_HANDLE,
    title,
    description,
    image: null,
    path: `/collections/${ALL_PRODUCTS_HANDLE}`,
    seo: {
      description: `Browse every product at ${shopConfig.site.name}: compare prices and check availability.`,
      title,
    },
  };
}

function browseMetadata(handle: string, title: string, description: string): Metadata {
  const url = `/collections/${handle}`;
  return {
    title,
    description,
    alternates: buildAlternates({ pathname: url }),
    openGraph: buildOpenGraph({ title, description, url, type: "website" }),
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-default.png"],
    },
  };
}

export async function getCollectionMetadata(handle: string): Promise<Metadata> {
  const collection = await getCollection({ handle });
  if (!collection) return browseMetadata(handle, "Collection", "Browse collection products.");
  return browseMetadata(collection.handle, collection.seo.title, describeCollection(collection));
}

export async function getAllProductsMetadata(): Promise<Metadata> {
  return browseMetadata(
    ALL_PRODUCTS_HANDLE,
    "Products",
    describeCollection(await getAllProductsCollection()),
  );
}
