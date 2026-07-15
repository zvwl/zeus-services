import { NextResponse } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { REVIEW_CARD_COLUMNS } from "@/lib/data";

// "Load more" pages for /reviews arrive as slim JSON instead of being
// server-rendered — every extra RSC-rendered card ships twice (HTML + flight).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const offset = Math.max(
    0,
    Number.parseInt(searchParams.get("offset") ?? "0", 10) || 0
  );
  const limit = Math.min(
    24,
    Math.max(1, Number.parseInt(searchParams.get("limit") ?? "12", 10) || 12)
  );

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("reviews")
    .select(REVIEW_CARD_COLUMNS)
    .eq("is_approved", true)
    .order("created_at", { ascending: false })
    // Must sort identically to getLatestReviews (SSR page 1): without the id
    // tiebreaker, equal timestamps can duplicate/skip rows across pages.
    .order("id")
    .range(offset, offset + limit - 1);
  if (error) {
    return NextResponse.json(
      { error: "Failed to load reviews" },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { reviews: data ?? [] },
    {
      // Same staleness bound as the site-wide 5-minute cache safety net.
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=60",
      },
    }
  );
}
