import { cacheLife, cacheTag } from "next/cache";

import { CATALOG_PRODUCTS } from "@/lib/catalog/products";
import { getAllProductsCollection, getCollections } from "@/lib/collections/server";
import type { ShopifySitemapType, SitemapResource } from "@/lib/shopify/operations/sitemap/types";

// Sitemap shards list up to 250 resources, matching the article page size the Shopify layer used.
const SITEMAP_PAGE_SIZE = 250;

// Local catalog entries share the catalog's updated date.
const UPDATED_AT = "2026-11-03T00:00:00Z";

function sitemapCacheTags(type: ShopifySitemapType): string[] {
  if (type === "ARTICLE") return ["articles", "articles-index"];
  if (type === "BLOG") return ["blogs", "blogs-index"];
  if (type === "COLLECTION") return ["collections", "collections-index"];
  return type === "PAGE" ? ["pages"] : ["products", "products-index"];
}

function tagSitemapResources(type: ShopifySitemapType, resources: SitemapResource[]): void {
  if (type === "PAGE") return;

  if (type === "ARTICLE") {
    for (const resource of resources) {
      cacheTag(`article-${resource.blogHandle}-${resource.handle}`);
    }
    return;
  }

  const prefix = type === "BLOG" ? "blog" : type === "COLLECTION" ? "collection" : "product";
  for (const resource of resources) {
    cacheTag(`${prefix}-${resource.handle}`);
  }
}

async function getLocalSitemapResources(type: ShopifySitemapType): Promise<SitemapResource[]> {
  if (type === "PRODUCT") {
    return CATALOG_PRODUCTS.map((product) => ({
      handle: product.handle,
      updatedAt: UPDATED_AT,
    }));
  }
  if (type === "COLLECTION") {
    const collections = [...(await getCollections()), await getAllProductsCollection()];
    return collections.map((collection) => ({
      handle: collection.handle,
      updatedAt: UPDATED_AT,
    }));
  }
  return [];
}

export async function getShopifySitemapPagesCount(type: ShopifySitemapType): Promise<number> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags(type));

  const resources = await getLocalSitemapResources(type);
  return Math.ceil(resources.length / SITEMAP_PAGE_SIZE);
}

export async function getShopifySitemapPage(
  type: ShopifySitemapType,
  page: number,
): Promise<{ items: SitemapResource[] }> {
  "use cache: remote";
  cacheLife("max");
  cacheTag(...sitemapCacheTags(type));

  const resources = await getLocalSitemapResources(type);
  const items = resources.slice((page - 1) * SITEMAP_PAGE_SIZE, page * SITEMAP_PAGE_SIZE);
  tagSitemapResources(type, items);
  return { items };
}
