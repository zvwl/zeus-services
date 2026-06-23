import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = {
  title: "Your cart",
  description: "Review the items in your cart and check out securely.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/cart" },
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold text-white">Your cart</h1>
      <CartView />
    </div>
  );
}
