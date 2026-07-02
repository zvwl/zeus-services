import { NextResponse } from "next/server";
import { getProfile, getUser, isAdmin } from "@/lib/auth";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Browser-side Supabase Storage uploads can reach Postgres without the user's
// auth token (so RLS sees them as anon and rejects them). We upload here
// instead: the admin check is enforced server-side and the write uses the
// service role, so it can't be spoofed and doesn't depend on the browser token.
// Raster image types only. SVG is intentionally excluded: it can carry inline
// <script>, and these buckets are public + same-origin, so a stored SVG is a
// stored-XSS vector.
const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ALLOWED_EXTS = ["png", "jpg", "jpeg", "webp", "gif"];

export async function POST(req: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  if (!hasAdminClient()) {
    return NextResponse.json(
      { error: "Uploads are not configured yet." },
      { status: 503 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  const bucket = String(form.get("bucket") ?? "zeus-assets");
  let folder = String(form.get("folder") ?? "").replace(/[^a-zA-Z0-9_\-/]/g, "");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "Max file size is 4 MB." }, { status: 400 });
  }
  // Require a recognised image MIME type (an empty/unknown type is rejected
  // rather than allowed through).
  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type. Use PNG, JPG, WEBP or GIF." },
      { status: 400 }
    );
  }

  // Per-bucket authorization, mirroring the storage RLS policies.
  if (bucket === "zeus-assets") {
    const profile = await getProfile();
    if (!isAdmin(profile)) {
      return NextResponse.json({ error: "Admins only." }, { status: 403 });
    }
  } else if (bucket === "zeus-avatars") {
    folder = user.id; // users may only write to their own avatar folder
  } else {
    return NextResponse.json({ error: "Invalid bucket." }, { status: 400 });
  }

  const rawExt = (file.name.split(".").pop() || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .slice(0, 5);
  const ext = ALLOWED_EXTS.includes(rawExt) ? rawExt : "png";
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const db = createAdminClient();
  const { error } = await db.storage.from(bucket).upload(path, file, {
    upsert: true,
    cacheControl: "3600",
    contentType: file.type || undefined,
  });
  if (error) {
    console.error("Upload failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = db.storage.from(bucket).getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
