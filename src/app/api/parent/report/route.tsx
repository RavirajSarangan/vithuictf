import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { BRAND } from "@/lib/constants";

export const runtime = "nodejs";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 12 },
  title: { fontSize: 20, marginBottom: 8 },
  subtitle: { fontSize: 12, marginBottom: 20, color: "#64748B" },
  row: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return new Response("studentId required", { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data: parent } = await supabase.from("parents").select("id").eq("user_id", user.id).maybeSingle();
  if (!parent) return new Response("Forbidden", { status: 403 });

  const { data: link } = await supabase
    .from("parent_student_links")
    .select("student_id")
    .eq("parent_id", parent.id)
    .eq("student_id", studentId)
    .maybeSingle();
  if (!link) return new Response("Forbidden", { status: 403 });

  const { data: student } = await supabase.from("students").select("*").eq("id", studentId).maybeSingle();
  const { data: results } = await supabase
    .from("results")
    .select("*")
    .eq("student_id", studentId)
    .order("result_date", { ascending: false })
    .limit(20);

  const doc = (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{BRAND.name} Progress Report</Text>
        <Text style={styles.subtitle}>
          {student?.display_name ?? "Student"} · {student?.course_name ?? ""}
        </Text>
        <Text style={{ marginBottom: 12 }}>Generated {new Date().toLocaleDateString()}</Text>
        {(results ?? []).map((r) => (
          <View key={r.id} style={styles.row}>
            <Text>
              {r.subject} ({r.term})
            </Text>
            <Text>
              {r.grade} — {r.marks}/{r.max_marks}
            </Text>
          </View>
        ))}
        {(results ?? []).length === 0 ? <Text>No results recorded yet.</Text> : null}
      </Page>
    </Document>
  );

  const blob = await pdf(doc).toBlob();
  return new Response(blob, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="icvf-progress-${studentId}.pdf"`,
    },
  });
}
