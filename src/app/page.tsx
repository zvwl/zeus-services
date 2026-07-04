import type { Metadata } from "next";
import { getSections } from "@/lib/data";
import { SectionRenderer } from "@/components/sections/SectionRenderer";
import { ButtonLink } from "@/components/ui";

// Title/description/OG come from the root layout; the homepage only needs its
// own canonical (the layout deliberately doesn't set one — see app/layout.tsx).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export const revalidate = 3600;

export default async function HomePage() {
  const sections = await getSections();

  if (sections.length === 0) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
        <h1 className="text-4xl font-extrabold text-white">
          Welcome to <span className="text-gradient">Zeuservices</span>
        </h1>
        <p className="mt-4 text-zinc-400">
          The homepage has no sections yet. Sign in as an admin and add some
          under <span className="text-primary-light">Admin → Layout</span>.
        </p>
        <ButtonLink href="/games" className="mt-8">
          Browse games
        </ButtonLink>
      </div>
    );
  }

  return (
    <>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </>
  );
}
