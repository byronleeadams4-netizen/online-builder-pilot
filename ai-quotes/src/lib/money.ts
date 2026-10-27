// Placeholder conversion: catalogue prices in the knowledge base were written in USD.
export const PLACEHOLDER_ZAR_PER_USD = 18;

export const zar = (amount: number | undefined): string =>
  `R${Math.round(amount ?? 0).toLocaleString('en-ZA')}`;

export const catalogueZar = (usd: number | undefined): number =>
  Math.round((usd ?? 0) * PLACEHOLDER_ZAR_PER_USD);
