import { cacheLife, cacheTag } from "next/cache";

import type { CommerceLocale } from "@/lib/config/types";
import type { ShopPolicy } from "@/lib/policies/types";

const LOCAL_POLICIES: ShopPolicy[] = [
  {
    body: "<p>Monterey Print Shop prints made-to-order goods in Monterey, California. This policy explains what information we collect when you browse the shop, request a quote, or place an order, and how we use it.</p><h2>Information we collect</h2><p>When you contact us or order, we collect your name, email address, shipping address, and the details of your order, including any artwork or logo files you upload for branding. Browsing the shop may also set strictly necessary cookies that keep the shop working.</p><h2>How we use it</h2><p>We use your information to print and deliver your order, to answer questions about it, and to improve the shop. We do not sell your personal information, and we do not share your artwork with anyone except as needed to fulfil your order.</p><h2>Your choices</h2><p>You can ask us to correct or delete your personal information at any time by contacting us through the shop. Because every item is printed to order, order records are kept for as long as needed to handle remakes, refunds, and tax records.</p>",
    handle: "privacy-policy",
    title: "Privacy Policy",
  },
  {
    body: "<p>These terms cover orders placed with Monterey Print Shop, a made-to-order 3D print shop in Monterey, California.</p><h2>Made to order</h2><p>Every item is printed after you order it, in the material, color, and branding option you select. Colors on screen are a guide; printed colors vary slightly by material and lighting. Dimensions are approximate within normal print tolerances.</p><h2>Your artwork</h2><p>When you upload a logo or design for debossing or foil transfer, you confirm you have the right to use it. You keep ownership of your artwork, and we use it only to produce your order.</p><h2>Pricing and production</h2><p>Prices shown are for the selected material and branding option. Production begins after your order is confirmed, and production times are estimates, not guarantees. We may refuse an order for an item we cannot print safely or legally.</p><h2>Liability</h2><p>Replacement parts are printed to the measurements or reference part you provide. Check fit before relying on a printed part for a safety-critical use.</p>",
    handle: "terms-of-service",
    title: "Terms of Service",
  },
  {
    body: "<p>Every item at Monterey Print Shop is printed to order, so shipping times include production time.</p><h2>Production and delivery</h2><p>Most orders print within 2 to 5 business days, then ship. Larger or multi-material orders can take longer, and we will tell you if your order falls outside the usual window. Local pickup in Monterey, California is available where offered at checkout.</p><h2>Shipping</h2><p>Orders ship within the United States. Shipping cost and estimated delivery are shown before you confirm your order, and tracking is provided when your order ships.</p><h2>Delays</h2><p>Print failures, material availability, and carrier delays can push an order back. If a delay affects your order, we will contact you with a revised estimate.</p>",
    handle: "shipping-policy",
    title: "Shipping Policy",
  },
  {
    body: "<p>Because every item is printed to order for you, most orders cannot be returned for a change of mind. We stand behind the print itself.</p><h2>Defects and misprints</h2><p>If your item arrives damaged, misprinted, or materially different from what you ordered, contact us within 14 days of delivery with a photo of the item. We will reprint it or refund you, at our choice.</p><h2>What is not covered</h2><p>Normal variation in printed color and texture, fit issues caused by measurements you provided, and damage after delivery are not covered. Replacement parts are made to your measurements or reference part, so double-check them before ordering.</p><h2>How to start a claim</h2><p>Include your order details and a photo showing the problem. Approved reprints ship as soon as the replacement prints; approved refunds go back to your original payment method.</p>",
    handle: "refund-policy",
    title: "Refund Policy",
  },
];

export async function getShopPolicies(
  params: { locale?: CommerceLocale } = {},
): Promise<ShopPolicy[]> {
  "use cache: remote";
  cacheLife("max");
  cacheTag("policies");

  return LOCAL_POLICIES;
}

export async function getShopPolicy({
  handle,
  locale,
}: {
  handle: string;
  locale?: CommerceLocale;
}): Promise<ShopPolicy | undefined> {
  const policies = await getShopPolicies({ locale });
  return policies.find((policy) => policy.handle === handle);
}
