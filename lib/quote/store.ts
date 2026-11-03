import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { list, put } from "@vercel/blob";

import type { QuoteRequest } from "./types";

// Local filesystem storage, used for local development.
const QUOTES_PATH = path.join(process.cwd(), "data", "quotes.json");
const UPLOADS_DIR = path.join(process.cwd(), "data", "quote-uploads");

// Vercel Blob storage, used in production, where the filesystem is ephemeral.
// Each quote is one blob under quotes/, each logo upload one blob under quote-logos/.
// When BLOB_READ_WRITE_TOKEN is unset, everything below falls back to the filesystem.
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
const useBlob = Boolean(BLOB_TOKEN);
const QUOTE_PREFIX = "quotes/";
const LOGO_PREFIX = "quote-logos/";

export function buildReference(existingCount: number): string {
  const now = new Date();
  const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  return `Q-${day}-${String(existingCount + 1).padStart(3, "0")}`;
}

async function readQuotesFromFs(): Promise<QuoteRequest[]> {
  try {
    const raw = await readFile(QUOTES_PATH, "utf-8");
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QuoteRequest[]) : [];
  } catch {
    return [];
  }
}

async function saveQuoteToFs(
  request: Omit<QuoteRequest, "createdAt" | "reference">,
): Promise<QuoteRequest> {
  const existing = await readQuotesFromFs();
  const saved: QuoteRequest = {
    ...request,
    createdAt: new Date().toISOString(),
    reference: buildReference(existing.length),
  };
  await mkdir(path.dirname(QUOTES_PATH), { recursive: true });
  await writeFile(QUOTES_PATH, `${JSON.stringify([...existing, saved], null, 2)}\n`, "utf-8");
  return saved;
}

async function attachLogoPathToFs(reference: string, logoPath: string): Promise<void> {
  const existing = await readQuotesFromFs();
  const updated = existing.map((quote) =>
    quote.reference === reference ? { ...quote, logoPath } : quote,
  );
  await mkdir(path.dirname(QUOTES_PATH), { recursive: true });
  await writeFile(QUOTES_PATH, `${JSON.stringify(updated, null, 2)}\n`, "utf-8");
}

async function saveLogoUploadToFs(reference: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const relativePath = `data/quote-uploads/${reference}-${safeName}`;
  await mkdir(UPLOADS_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(UPLOADS_DIR, `${reference}-${safeName}`), buffer);
  return relativePath;
}

async function listBlobPathnames(prefix: string): Promise<string[]> {
  const pathnames: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await list({ cursor, prefix });
    pathnames.push(...page.blobs.map((blob) => blob.pathname));
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return pathnames;
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  const page = await list({ prefix: pathname });
  const blob = page.blobs.find((entry) => entry.pathname === pathname);
  if (!blob) return null;
  const response = await fetch(blob.url, {
    headers: { Authorization: `Bearer ${BLOB_TOKEN}` },
  });
  if (!response.ok) return null;
  return (await response.json()) as T;
}

async function writeBlobJson(pathname: string, value: unknown): Promise<void> {
  await put(pathname, JSON.stringify(value, null, 2), {
    access: "private",
    addRandomSuffix: false,
    contentType: "application/json",
  });
}

async function saveQuoteToBlob(
  request: Omit<QuoteRequest, "createdAt" | "reference">,
): Promise<QuoteRequest> {
  const now = new Date();
  const day = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const todaysQuotes = await listBlobPathnames(`${QUOTE_PREFIX}Q-${day}-`);
  const saved: QuoteRequest = {
    ...request,
    createdAt: now.toISOString(),
    reference: buildReference(todaysQuotes.length),
  };
  await writeBlobJson(`${QUOTE_PREFIX}${saved.reference}.json`, saved);
  return saved;
}

async function attachLogoPathToBlob(reference: string, logoPath: string): Promise<void> {
  const pathname = `${QUOTE_PREFIX}${reference}.json`;
  const quote = await readBlobJson<QuoteRequest>(pathname);
  if (!quote) return;
  await writeBlobJson(pathname, { ...quote, logoPath });
}

async function saveLogoUploadToBlob(reference: string, file: File): Promise<string> {
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "-");
  const pathname = `${LOGO_PREFIX}${reference}-${safeName}`;
  await put(pathname, file, {
    access: "private",
    addRandomSuffix: false,
    contentType: file.type,
  });
  return pathname;
}

export async function saveQuote(
  request: Omit<QuoteRequest, "createdAt" | "reference">,
): Promise<QuoteRequest> {
  return useBlob ? saveQuoteToBlob(request) : saveQuoteToFs(request);
}

export async function attachLogoPath(reference: string, logoPath: string): Promise<void> {
  return useBlob
    ? attachLogoPathToBlob(reference, logoPath)
    : attachLogoPathToFs(reference, logoPath);
}

export async function saveLogoUpload(reference: string, file: File): Promise<string> {
  return useBlob ? saveLogoUploadToBlob(reference, file) : saveLogoUploadToFs(reference, file);
}
