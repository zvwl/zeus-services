import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-32 text-center">
      <p className="text-7xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 text-2xl font-bold text-white">
        This page got struck by lightning
      </h1>
      <p className="mt-2 text-zinc-400">
        The page you&apos;re looking for doesn&apos;t exist or was moved.
      </p>
      <ButtonLink href="/" className="mt-8">
        Back to home
      </ButtonLink>
    </div>
  );
}
