import Image from "next/image";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { QuoteForm } from "@/components/quote/quote-form";
import { Container } from "@/components/ui/container";
import { Page } from "@/components/ui/page";
import { Sections } from "@/components/ui/sections";
import { getLocalProduct, getLocalProductVariant } from "@/lib/catalog/storefront";
import { formatPrice } from "@/lib/money";

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseQuantity(value: string | string[] | undefined): number {
  const parsed = Number(firstParam(value));
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 99) return 1;
  return parsed;
}

export default function QuotePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Page>
      <Sections>
        <Container>
          <Suspense
            fallback={
              <div aria-busy="true" className="text-sm text-muted-foreground">
                Loading quote form…
              </div>
            }
          >
            <QuotePageContent searchParams={searchParams} />
          </Suspense>
        </Container>
      </Sections>
    </Page>
  );
}

async function QuotePageContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const handle = firstParam(params.handle);
  if (!handle) notFound();
  const product = getLocalProduct(handle);
  if (!product) notFound();

  const requested = [
    { name: "Material", value: firstParam(params.Material) },
    { name: "Color", value: firstParam(params.Color) },
    { name: "Branding", value: firstParam(params.Branding) },
  ];
  const complete = requested.every((option) => option.value !== undefined);
  const variant = complete
    ? getLocalProductVariant(
        handle,
        requested as { name: string; value: string }[],
      )
    : product.defaultVariant;
  const selected = variant ?? product.defaultVariant;
  if (!selected) notFound();
  const selectedOptions = new Map(
    selected.selectedOptions.map((option) => [option.name, option.value]),
  );

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <div className="grid content-start gap-2.5">
        <h1 className="text-3xl">Request a quote</h1>
        <p className="text-sm text-muted-foreground">
          Made to order in Monterey. Tell us what you need and we confirm artwork, timing, and
          final pricing before anything is printed or charged.
        </p>
        <div className="grid gap-2.5 rounded-lg border border-border p-4">
          {product.featuredImage ? (
            <Image
              src={product.featuredImage.url}
              alt={product.featuredImage.altText}
              width={product.featuredImage.width}
              height={product.featuredImage.height}
              sizes="100vw"
              className="aspect-square w-full rounded-lg object-cover"
            />
          ) : null}
          <h2 className="text-xl">{product.title}</h2>
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted-foreground">Material</dt>
              <dd>{selectedOptions.get("Material")}</dd>
            </div>
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted-foreground">Color</dt>
              <dd>{selectedOptions.get("Color")}</dd>
            </div>
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted-foreground">Branding</dt>
              <dd>{selectedOptions.get("Branding")}</dd>
            </div>
            <div className="flex justify-between gap-2.5">
              <dt className="text-muted-foreground">Unit price</dt>
              <dd className="tabular-nums">{formatPrice(selected.price)}</dd>
            </div>
          </dl>
          <p className="text-sm text-muted-foreground">
            Want a different configuration? Go back to{" "}
            <a href={`/products/${product.handle}`} className="underline">
              {product.title}
            </a>{" "}
            and pick it there.
          </p>
        </div>
      </div>
      <QuoteForm
        branding={selectedOptions.get("Branding") ?? ""}
        color={selectedOptions.get("Color") ?? ""}
        defaultQuantity={parseQuantity(params.quantity)}
        handle={product.handle}
        material={selectedOptions.get("Material") ?? ""}
        title={product.title}
        unitPrice={selected.price.amount}
      />
    </div>
  );
}
