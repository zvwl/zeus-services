import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { FALLBACK_RATES } from "@/lib/currency";
import type {
  Category,
  ExchangeRate,
  SiteSection,
  SiteSettings,
} from "@/lib/types";

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = await createClient();
  const { data } = await supabase.from("site_settings").select("key, value");
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value]));
});

export function setting(settings: SiteSettings, key: string, fallback = "") {
  const value = settings[key];
  return typeof value === "string" && value.length > 0 ? value : fallback;
}

export const getCategories = cache(async (): Promise<Category[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data as Category[]) ?? [];
});

export const getRates = cache(async (): Promise<ExchangeRate[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("exchange_rates")
    .select("*")
    .order("code");
  const rates = (data as ExchangeRate[]) ?? [];
  return rates.length > 0 ? rates : FALLBACK_RATES;
});

export const getSections = cache(async (): Promise<SiteSection[]> => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_sections")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  return (data as SiteSection[]) ?? [];
});
