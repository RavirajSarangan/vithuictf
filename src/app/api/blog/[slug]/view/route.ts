import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createPublicClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientKey } from "@/lib/security/request-client-key";

const VIEW_COOKIE_PREFIX = "blog_view_";
const VIEW_COOKIE_MAX_AGE = 60 * 60 * 24;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  if (!slug.trim()) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const clientKey = await getRequestClientKey(slug);
  const allowed = await checkRateLimit(`blog-view:${clientKey}`, 1, 60 * 60 * 24);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 });
  }

  const cookieStore = await cookies();
  const cookieName = `${VIEW_COOKIE_PREFIX}${slug}`;
  const supabase = createPublicClient();

  if (cookieStore.get(cookieName)?.value === "1") {
    const { data } = await supabase
      .from("blog_posts")
      .select("view_count")
      .eq("slug", slug)
      .maybeSingle();

    return NextResponse.json({
      viewCount: data?.view_count ?? 0,
      recorded: false,
    });
  }

  const { data, error } = await supabase.rpc("increment_blog_post_view_count", {
    p_slug: slug,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (data === null) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  const response = NextResponse.json({ viewCount: data, recorded: true });
  response.cookies.set(cookieName, "1", {
    maxAge: VIEW_COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });

  return response;
}
