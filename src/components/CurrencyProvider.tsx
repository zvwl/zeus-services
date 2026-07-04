"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { convertFromUSD, formatMoney, FALLBACK_RATES } from "@/lib/currency";
import type { ExchangeRate } from "@/lib/types";

function readCurrencyCookie(): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)currency=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

interface CurrencyContextValue {
  currency: string;
  rates: ExchangeRate[];
  setCurrency: (code: string) => void;
  /** Convert a USD amount to the active currency. */
  convert: (usd: number) => number;
  /** Convert + format a USD amount in the active currency. */
  format: (usd: number) => string;
  /** Format an amount already denominated in the given currency. */
  formatRaw: (amount: number, currency: string) => string;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  rates,
  children,
}: {
  rates: ExchangeRate[];
  children: ReactNode;
}) {
  const safeRates = rates.length > 0 ? rates : FALLBACK_RATES;
  // SSR renders USD (so statically-cached pages are user-agnostic); the visitor's
  // saved preference is applied on the client right after hydration. Currency is
  // display-only (checkout re-prices server-side from the currency sent in the
  // request), so no server cookie read is needed — which lets pages stay static.
  const [currency, setCurrencyState] = useState("USD");

  useEffect(() => {
    const saved = readCurrencyCookie();
    if (saved && safeRates.some((r) => r.code === saved)) {
      setCurrencyState(saved);
    }
    // safeRates identity is stable per render set; run once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    document.cookie = `currency=${code}; path=/; max-age=31536000; samesite=lax`;
  }, []);

  const value = useMemo<CurrencyContextValue>(() => {
    const rate = safeRates.find((r) => r.code === currency)?.rate ?? 1;
    return {
      currency,
      rates: safeRates,
      setCurrency,
      convert: (usd: number) => convertFromUSD(usd, Number(rate)),
      format: (usd: number) =>
        formatMoney(convertFromUSD(usd, Number(rate)), currency),
      formatRaw: (amount: number, code: string) => formatMoney(amount, code),
    };
  }, [currency, safeRates, setCurrency]);

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within CurrencyProvider");
  return ctx;
}
