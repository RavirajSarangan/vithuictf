import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/seo/site";

const PUBLIC_ALLOW = [
  "/",
  "/blog/",
  "/programs/",
  "/locations/",
  "/network/",
  "/about/",
  "/card/",
  "/verify/",
  "/ta/",
  "/si/",
  "/llms.txt",
] as const;

const PRIVATE_DISALLOW = [
  "/admin",
  "/dashboard",
  "/parent",
  "/onboarding",
  "/settings",
  "/api/",
  "/coming-soon",
  "/maintenance",
  "/rankings",
] as const;

const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "Google-Extended",
  "anthropic-ai",
  "ClaudeBot",
  "PerplexityBot",
  "Applebot-Extended",
  "cohere-ai",
] as const;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [...PUBLIC_ALLOW],
        disallow: [...PRIVATE_DISALLOW],
      },
      {
        userAgent: [...AI_CRAWLERS],
        allow: [...PUBLIC_ALLOW],
        disallow: [...PRIVATE_DISALLOW],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
