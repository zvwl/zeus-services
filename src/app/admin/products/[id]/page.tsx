import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductForm } from "@/components/admin/ProductForm";
import type { Category, Game, Product } from "@/lib/types";

export const revalidate = 0;

export default async function AdminProductEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: games }, { data: categories }] = await Promise.all([
    supabase.from("games").select("*").order("sort_order"),
    supabase.from("categories").select("*").order("sort_order"),
  ]);

  let product: Product | null = null;
  if (id !== "new") {
    const { data } = await supabase
      .from("products")
      .select("*, variants:product_variants(*), fields:product_fields(*)")
      .eq("id", id)
      .maybeSingle();
    if (!data) notFound();
    product = data as Product;
  }

  return (
    <div className="max-w-3xl">
      <Link href="/admin/products" className="text-sm text-zinc-500 hover:text-primary-light">
        ← All products
      </Link>
      <h1 className="mt-3 text-2xl font-extrabold text-white">
        {product ? `Edit: ${product.name}` : "New product"}
      </h1>
      <div className="mt-6">
        <ProductForm
          product={product}
          games={(games as Game[]) ?? []}
          categories={(categories as Category[]) ?? []}
        />
      </div>
    </div>
  );
}
