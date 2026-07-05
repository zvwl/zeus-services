"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { convertFromUSD, formatMoney, FALLBACK_RATES } from "@/lib/currency";
import type { ExchangeRate } from "@/lib/types";

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
  initial,
  rates,
  children,
}: {
  initial: string;
  rates: ExchangeRate[];
  children: ReactNode;
}) {
  const safeRates = rates.length > 0 ? rates : FALLBACK_RATES;
  const [currency, setCurrencyState] = useState(
    safeRates.some((r) => r.code === initial) ? initial : "USD"
  );

  const setCurrency = useCallback((code: string) => {
    setCurrencyState(code);
    // The cookie only seeds `initial` for the NEXT server render — every
    // visible price is a client <Price> island that updates from this context,
    // so no router.refresh() is needed (it was re-running the whole dynamic
    // tree, middleware and all, inside the interaction).
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
