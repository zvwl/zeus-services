import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { createPublicClient } from "@/lib/supabase/public";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { JsonLd } from "@/components/JsonLd";
import { Reveal } from "@/components/motion";
import type { Faq } from "@/lib/types";

export const metadata: Metadata = {
  title: "FAQ",
  description:
    "Answers to common questions about delivery times, payments, boosting safety and our 7-day account cover.",
  alternates: { canonical: "/faq" },
};
export const revalidate = 0;

export default async function FaqPage() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("faqs")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");
  const faqs = (data as Faq[]) ?? [];

  const groups = new Map<string, Faq[]>();
  for (const f of faqs) {
    const list = groups.get(f.category) ?? [];
    list.push(f);
    groups.set(f.category, list);
  }

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      {faqs.length > 0 && <JsonLd data={faqJsonLd} />}
      <Reveal y={14}>
        <SectionHeading
          as="h1"
          eyebrow="Help center"
          title="Frequently asked questions"
          subtitle="Everything you need to know about ordering, delivery, payments and account safety."
          center
        />
      </Reveal>
      {[...groups.entries()].map(([category, items]) => (
        <Reveal key={category} y={16}>
          <section className="mb-10">
            <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-primary-light">
              <span
                aria-hidden
                className="h-5 w-1 rounded-full bg-gradient-to-b from-primary to-fuchsia-500"
              />
              {category}
            </h2>
            <div className="space-y-3">
              {items.map((f) => (
                <details
                  key={f.id}
                  className="glass group p-0 transition hover:border-primary/30"
                >
                  <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-medium text-white transition group-open:text-primary-light [&::-webkit-details-marker]:hidden">
                    {f.question}
                    <Plus
                      aria-hidden
                      className="h-4 w-4 shrink-0 text-primary-light transition-transform duration-200 group-open:rotate-45"
                    />
                  </summary>
                  <p className="whitespace-pre-line px-5 pb-5 text-sm leading-relaxed text-zinc-400">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </Reveal>
      ))}
      <Reveal y={16}>
        <div className="glass mt-12 p-8 text-center">
          <h3 className="text-lg font-bold text-white">
            Can&apos;t find an answer?
          </h3>
          <p className="mt-2 text-sm text-zinc-400">
            Our support team usually replies within a few hours.
          </p>
          <ButtonLink href="/support" className="mt-5">
            Contact support
          </ButtonLink>
        </div>
      </Reveal>
    </div>
  );
}
