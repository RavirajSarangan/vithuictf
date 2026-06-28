import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const role = profile?.role;
  if (!role || !["admin", "super_admin", "teacher"].includes(role)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const { data: cert } = await supabase.from("certificates").select("image_path, certificate_number").eq("id", id).maybeSingle();
  if (!cert?.image_path) {
    return new NextResponse("Not found", { status: 404 });
  }

  const admin = createAdminClient();
  const { data: file, error } = await admin.storage.from("certificates").download(cert.image_path);
  if (error || !file) {
    return new NextResponse("Failed to load certificate", { status: 500 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `${cert.certificate_number ?? id}.png`;

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
