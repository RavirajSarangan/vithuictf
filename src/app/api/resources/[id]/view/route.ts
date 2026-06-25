import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminClientConfigured } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: resource, error } = await supabase
    .from("resources")
    .select("id, title, storage_path, view_only, type")
    .eq("id", id)
    .single();

  if (error || !resource) {
    return NextResponse.json({ error: "Resource not found" }, { status: 404 });
  }

  const row = resource as {
    id: string;
    title: string;
    storage_path: string;
    view_only: boolean;
    type: string;
  };

  if (!isAdminClientConfigured()) {
    return NextResponse.json({
      id: row.id,
      title: row.title,
      viewUrl: row.storage_path,
      viewOnly: row.view_only,
      expiresIn: 300,
    });
  }

  const admin = createAdminClient();
  const { data: signed, error: signError } = await admin.storage
    .from("resources")
    .createSignedUrl(row.storage_path, 300);

  if (signError || !signed?.signedUrl) {
    return NextResponse.json({ error: "Failed to generate secure URL" }, { status: 500 });
  }

  return NextResponse.json({
    id: row.id,
    title: row.title,
    type: row.type,
    viewUrl: signed.signedUrl,
    viewOnly: row.view_only,
    expiresIn: 300,
  });
}
