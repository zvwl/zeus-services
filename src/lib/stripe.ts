import Stripe from "stripe";

// Lazily constructed so the app can build/boot without Stripe configured —
// checkout endpoints return a clear error instead of crashing the process.
let stripe: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not configured. Add it to your environment variables."
    );
  }
  if (!stripe) stripe = new Stripe(key);
  return stripe;
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
