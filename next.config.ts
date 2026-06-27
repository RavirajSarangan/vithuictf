import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";
import bundleAnalyzer from "@next/bundle-analyzer";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  poweredByHeader: false,
  compress: true,
  turbopack: {
    root: projectRoot,
  },
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "recharts",
      "date-fns",
      "@remixicon/react",
      "framer-motion",
      "@radix-ui/react-navigation-menu",
      "cmdk",
      "@tanstack/react-table",
    ],
  },
  images: supabaseUrl
    ? {
        formats: ["image/avif", "image/webp"],
        qualities: [75, 90],
        remotePatterns: [
          {
            protocol: "https",
            hostname: new URL(supabaseUrl).hostname,
            pathname: "/storage/v1/object/public/**",
          },
        ],
      }
    : {
        formats: ["image/avif", "image/webp"],
        qualities: [75, 90],
      },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    const immutableStatic = [
      { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
    ] as const;
    const faviconCache = [
      { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
    ] as const;

    // Derive the Supabase origins (https + wss for realtime) so CSP can allowlist them.
    const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";
    const supabaseWs = supabaseOrigin ? supabaseOrigin.replace(/^https:/, "wss:") : "";

    // Report-only CSP: observe violations in production before enforcing.
    // Tighten (and switch to enforcing) once the violation reports are clean.
    const csp = [
      `default-src 'self'`,
      `base-uri 'self'`,
      `object-src 'none'`,
      `frame-ancestors 'none'`,
      `form-action 'self'`,
      // Stripe.js + Vercel analytics/insights scripts; inline needed for Next bootstrap.
      `script-src 'self' 'unsafe-inline' https://js.stripe.com https://*.vercel-scripts.com https://*.vercel-insights.com`,
      // Tailwind/inline styles + Google Fonts stylesheet.
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
      `font-src 'self' https://fonts.gstatic.com data:`,
      `img-src 'self' data: https: blob:`,
      // Supabase REST/realtime, Stripe API, Vercel analytics beacons, Google OAuth.
      `connect-src 'self' ${supabaseOrigin} ${supabaseWs} https://api.stripe.com https://*.vercel-insights.com https://*.vercel-scripts.com https://accounts.google.com`
        .replace(/\s+/g, " ")
        .trim(),
      // Stripe Checkout/Elements iframes.
      `frame-src https://js.stripe.com https://hooks.stripe.com`,
      `upgrade-insecure-requests`,
    ].join("; ");

    const securityHeaders = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "geolocation=(), microphone=(), camera=()" },
      { key: "X-DNS-Prefetch-Control", value: "on" },
      { key: "Content-Security-Policy-Report-Only", value: csp },
    ] as const;

  return [
      {
        // Apply security headers site-wide. Per-asset Cache-Control entries below
        // remain effective because Next.js merges header rules per matched source.
        source: "/:path*",
        headers: [...securityHeaders],
      },
      // Immutable asset caching is production-only. In dev it causes stale client
      // bundles after refactors, which triggers React hydration mismatches.
      ...(isProd
        ? ([
            {
              source: "/_next/static/:path*",
              headers: [...immutableStatic],
            },
            {
              source: "/favicon.png",
              headers: [...faviconCache],
            },
            {
              source: "/apple-icon.png",
              headers: [...faviconCache],
            },
            {
              source: "/ICTF.svg",
              headers: [...immutableStatic],
            },
            {
              source: "/ICTF-light.svg",
              headers: [...immutableStatic],
            },
      {
        source: "/papa.png",
        headers: [...immutableStatic],
      },
      {
        source: "/pci.png",
        headers: [...immutableStatic],
      },
      {
        source: "/iso.png",
        headers: [...immutableStatic],
      },
      {
        source: "/llms.txt",
              headers: [
                { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
              ],
            },
      {
        source: "/landing/:path*",
        headers: [...immutableStatic],
      },
      {
        source: "/team/:path*",
              headers: [...immutableStatic],
            },
          ] as { source: string; headers: { key: string; value: string }[] }[])
        : []),
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
