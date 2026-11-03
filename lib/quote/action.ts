"use server";

import { z } from "zod";

import { getLocalProduct, getLocalProductVariant } from "@/lib/catalog/storefront";

import { attachLogoPath, saveLogoUpload, saveQuote } from "./store";
import type { SubmitQuoteResult } from "./types";

const LOGO_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/svg+xml", "image/webp"];
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

const QUOTE_INPUT = z.strictObject({
  branding: z.string().min(1).max(100),
  color: z.string().min(1).max(100),
  email: z.email().max(200),
  handle: z.string().min(1).max(200),
  logo: z.instanceof(File).optional(),
  material: z.string().min(1).max(100),
  name: z.string().min(1).max(100),
  notes: z.string().max(1000).optional(),
  quantity: z.coerce.number().int().min(1).max(99),
});

export async function submitQuoteAction(formData: FormData): Promise<SubmitQuoteResult> {
  const logoValue = formData.get("logo");
  const logo = logoValue instanceof File && logoValue.size > 0 ? logoValue : undefined;
  const parsed = QUOTE_INPUT.safeParse({
    branding: formData.get("branding"),
    color: formData.get("color"),
    email: formData.get("email"),
    handle: formData.get("handle"),
    logo,
    material: formData.get("material"),
    name: formData.get("name"),
    notes: formData.get("notes") || undefined,
    quantity: formData.get("quantity"),
  });
  if (!parsed.success) return { error: "Please check the form and try again.", ok: false };
  const input = parsed.data;

  const product = getLocalProduct(input.handle);
  if (!product) return { error: "That product could not be found.", ok: false };
  const variant = getLocalProductVariant(input.handle, [
    { name: "Material", value: input.material },
    { name: "Color", value: input.color },
    { name: "Branding", value: input.branding },
  ]);
  const configurationMatches =
    variant?.selectedOptions.some((option) => option.name === "Material" && option.value === input.material) &&
    variant?.selectedOptions.some((option) => option.name === "Color" && option.value === input.color) &&
    variant?.selectedOptions.some((option) => option.name === "Branding" && option.value === input.branding);
  if (!variant || !configurationMatches) {
    return { error: "That material, color, and branding combination is not available.", ok: false };
  }

  if (logo && (!LOGO_TYPES.includes(logo.type) || logo.size > MAX_LOGO_BYTES)) {
    return { error: "Logo must be a PNG, JPG, WebP, SVG, or PDF under 5 MB.", ok: false };
  }

  const unitPrice = variant.price.amount;
  const total = (Number(unitPrice) * input.quantity).toFixed(2);
  let reference: string;
  try {
    reference = (
      await saveQuote({
        branding: input.branding,
        color: input.color,
        email: input.email,
        handle: input.handle,
        logoPath: null,
        material: input.material,
        name: input.name,
        notes: input.notes ?? null,
        quantity: input.quantity,
        title: product.title,
        total,
        unitPrice,
      })
    ).reference;

    if (logo) {
      const logoPath = await saveLogoUpload(reference, logo);
      await attachLogoPath(reference, logoPath);
    }
  } catch {
    return { error: "We couldn't save your quote request. Please try again.", ok: false };
  }

  return { ok: true, reference, total };
}
