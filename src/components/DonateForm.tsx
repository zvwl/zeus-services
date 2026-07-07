"use client";

import { useState } from "react";
import { Coffee } from "lucide-react";
import { Button } from "@/components/ui";
import { useCurrency } from "@/components/CurrencyProvider";
import { cn } from "@/lib/utils";

const PRESETS = [3, 5, 10, 25];

export function DonateForm() {
  const { currency, formatRaw } = useCurrency();
  const [amount, setAmount] = useState<number>(5);
  const [custom, setCustom] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const finalAmount = custom ? Number(custom) : amount;

  async function donate() {
    setError(null);
    if (!Number.isFinite(finalAmount) || finalAmount < 1) {
      setError("Minimum donation is 1.00");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: finalAmount, currency, name, message }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Donation failed");
      window.location.href = json.url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Donation failed");
      setLoading(false);
    }
  }

  return (
    <div className="glass border-amber-400/15 p-6">
      <p className="label">Pick an amount ({currency})</p>
      <div className="grid grid-cols-4 gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => {
              setAmount(p);
              setCustom("");
            }}
            className={cn(
              "rounded-xl border px-3 py-3 text-sm font-bold transition",
              !custom && amount === p
                ? "border-gold bg-gold/15 text-gold"
                : "border-edge bg-raised/50 text-zinc-300 hover:border-gold/40"
            )}
          >
            {formatRaw(p, currency)}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={1}
        max={1000}
        step="0.01"
        placeholder="Custom amount"
        className="input mt-3"
        value={custom}
        onChange={(e) => setCustom(e.target.value)}
      />
      <div className="mt-4 space-y-3">
        <input
          className="input"
          placeholder="Your name (shown publicly, optional)"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <textarea
          className="input min-h-[80px]"
          placeholder="Leave a message (optional)"
          maxLength={280}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </div>
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      <Button
        variant="gold"
        size="lg"
        className="mt-5 w-full"
        disabled={loading}
        onClick={donate}
      >
        <Coffee className="h-5 w-5" />
        {loading
          ? "Redirecting…"
          : `Donate ${
              Number.isFinite(finalAmount) && finalAmount > 0
                ? formatRaw(finalAmount, currency)
                : ""
            }`}
      </Button>
      <p className="mt-3 text-center text-xs text-zinc-600">
        100% optional — processed securely by Stripe.
      </p>
    </div>
  );
}
