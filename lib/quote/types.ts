export interface QuoteRequest {
  branding: string;
  color: string;
  createdAt: string;
  email: string;
  handle: string;
  logoPath: string | null;
  material: string;
  name: string;
  notes: string | null;
  quantity: number;
  reference: string;
  title: string;
  total: string;
  unitPrice: string;
}

export type SubmitQuoteResult =
  | { error: string; ok: false }
  | { ok: true; reference: string; total: string };
