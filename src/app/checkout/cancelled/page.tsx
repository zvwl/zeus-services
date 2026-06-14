import { XCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui";

export default function CheckoutCancelledPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15">
        <XCircle className="h-9 w-9 text-red-400" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-white">
        Checkout cancelled
      </h1>
      <p className="mt-2 max-w-md text-zinc-400">
        No payment was taken. Your order was not completed — you can try again
        whenever you&apos;re ready.
      </p>
      <div className="mt-8 flex gap-3">
        <ButtonLink href="/games">Back to store</ButtonLink>
        <ButtonLink href="/support" variant="outline">
          Need help?
        </ButtonLink>
      </div>
    </div>
  );
}
