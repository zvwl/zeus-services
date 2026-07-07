import type { Metadata } from "next";
import { CartView } from "@/components/CartView";
import { Reveal } from "@/components/motion";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your cart and check out securely.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <Reveal y={14}>
        <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary-light">
          Almost there
        </p>
        <h1 className="mb-8 text-3xl font-extrabold text-white sm:text-4xl">
          Your cart
        </h1>
      </Reveal>
      <CartView />
    </div>
  );
}
