import type { MetadataRoute } from "next";
import { LOCATION_SLUGS, PROGRAM_PAGES } from "@/lib/seo/keywords";
import { SITE_URL } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/programs/", "/locations/", "/network/", "/about/", "/rankings", "/card/", "/verify/"],
        disallow: [
          "/admin",
          "/dashboard",
          "/parent",
          "/onboarding",
          "/settings",
          "/api/",
          "/coming-soon",
          "/maintenance",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
