import { buildLlmsFullText } from "@/lib/seo/llms";

export const revalidate = 3600;

export async function GET(): Promise<Response> {
  const body = await buildLlmsFullText();
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
