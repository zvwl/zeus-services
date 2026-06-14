import type { ExchangeRate } from "./types";

export const BASE_CURRENCY = "USD";

export const FALLBACK_RATES: ExchangeRate[] = [
  { code: "USD", rate: 1, symbol: "$", label: "US Dollar" },
  { code: "EUR", rate: 0.92, symbol: "€", label: "Euro" },
  { code: "GBP", rate: 0.79, symbol: "£", label: "British Pound" },
  { code: "CAD", rate: 1.37, symbol: "C$", label: "Canadian Dollar" },
  { code: "AUD", rate: 1.53, symbol: "A$", label: "Australian Dollar" },
];

/** Convert a USD amount into the target currency using a rate (1 USD = rate). */
export function convertFromUSD(usd: number, rate: number) {
  return Math.round(usd * rate * 100) / 100;
}

export function formatMoney(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}
