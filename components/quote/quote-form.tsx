"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { submitQuoteAction } from "@/lib/quote/action";
import type { SubmitQuoteResult } from "@/lib/quote/types";

interface QuoteFormProps {
  branding: string;
  color: string;
  defaultQuantity: number;
  handle: string;
  material: string;
  title: string;
  unitPrice: string;
}

export function QuoteForm({
  branding,
  color,
  defaultQuantity,
  handle,
  material,
  title,
  unitPrice,
}: QuoteFormProps) {
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SubmitQuoteResult | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const outcome = await submitQuoteAction(new FormData(event.currentTarget));
    setPending(false);
    if (!outcome.ok) {
      setError(outcome.error);
      return;
    }
    setResult(outcome);
  }

  if (result?.ok) {
    return (
      <div className="grid gap-2.5 rounded-lg border border-border p-4">
        <h2 className="text-xl">Quote requested</h2>
        <p className="text-sm text-muted-foreground">
          Reference <span className="font-medium text-foreground">{result.reference}</span> — keep
          it for your records.
        </p>
        <p className="text-sm">
          {quantity} × {title} ({material}, {color}, {branding}) — estimated total ${result.total}.
        </p>
        <p className="text-sm text-muted-foreground">
          What happens next: we reply within 1 business day to confirm artwork, timing, and final
          pricing. Nothing is charged until you approve the quote.
        </p>
      </div>
    );
  }

  const estimatedTotal = (Number(unitPrice) * quantity).toFixed(2);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <input type="hidden" name="handle" value={handle} />
      <input type="hidden" name="material" value={material} />
      <input type="hidden" name="color" value={color} />
      <input type="hidden" name="branding" value={branding} />
      <div className="grid gap-1.5">
        <label htmlFor="quote-name" className="text-sm font-medium">
          Name
        </label>
        <input
          id="quote-name"
          name="name"
          required
          maxLength={100}
          autoComplete="name"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="quote-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="quote-email"
          name="email"
          type="email"
          required
          maxLength={200}
          autoComplete="email"
          className="h-10 rounded-lg border border-border bg-background px-3 text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="quote-quantity" className="text-sm font-medium">
          Quantity
        </label>
        <input
          id="quote-quantity"
          name="quantity"
          type="number"
          min={1}
          max={99}
          required
          value={quantity}
          onChange={(event) => setQuantity(Math.max(1, Math.min(99, Number(event.target.value) || 1)))}
          className="h-10 w-32 rounded-lg border border-border bg-background px-3 text-sm tabular-nums"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="quote-notes" className="text-sm font-medium">
          Notes (optional)
        </label>
        <textarea
          id="quote-notes"
          name="notes"
          maxLength={1000}
          rows={4}
          placeholder="Sizes, deadlines, where this will be used — anything that changes the print."
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor="quote-logo" className="text-sm font-medium">
          Logo (optional)
        </label>
        <input
          id="quote-logo"
          name="logo"
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.svg,.pdf"
          className="text-sm"
        />
        <p className="text-sm text-muted-foreground">
          For debossed or foil logos, upload your artwork (PNG, JPG, WebP, SVG, or PDF, up to 5 MB).
          We confirm artwork before printing.
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        Estimated total: <span className="font-medium text-foreground">${estimatedTotal}</span> for{" "}
        {quantity} × {title} at ${unitPrice} each. Final total is confirmed in your quote reply.
      </p>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending} className="h-12 justify-center">
        {pending ? "Sending…" : "Request quote"}
      </Button>
    </form>
  );
}
