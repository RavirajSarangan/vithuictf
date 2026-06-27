import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Inter } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/providers/theme-provider";
import { ThemeColorMeta } from "@/components/layout/theme-color-meta";
import { IcvfSiteCursorLazy } from "@/components/shared/icvf-site-cursor-lazy";
import { DeferredAnalytics } from "@/components/shared/deferred-analytics";
import { LegacyPwaDispose } from "@/components/shared/legacy-pwa-dispose";
import { BRAND } from "@/lib/constants";
import { rootMetadata } from "@/lib/seo/metadata";
import { getMarketingHtmlLang } from "@/lib/seo/marketing-locale-server";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const supabaseOrigin = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
  : null;

export const metadata: Metadata = {
  ...rootMetadata,
  title: {
    default: `${BRAND.name} — O/L & A/L ICT Institute Sri Lanka`,
    template: "%s",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-icon.png", type: "image/png", sizes: "180x180" }],
    shortcut: ["/favicon.png"],
  },
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: BRAND.colors.navy },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getMarketingHtmlLang();

  return (
    <html
      lang={lang}
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${inter.variable} h-full`}
    >
      <head>
        {supabaseOrigin ? (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        ) : null}
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
      </head>
      <body className="min-h-dvh font-sans antialiased">
        <Script id="icvf-theme-init" strategy="beforeInteractive">
          {`!function(){try{var e=localStorage.getItem("icvf-theme")||"light",t=document.documentElement,n=e;"system"===e&&(n=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"),"dark"===n?t.classList.add("dark"):t.classList.remove("dark")}catch(e){}}();`}
        </Script>
        <ThemeProvider>
          <ThemeColorMeta />
          <IcvfSiteCursorLazy />
          <TooltipProvider>
            {children}
            <DeferredAnalytics />
            <LegacyPwaDispose />
            <Toaster richColors position="top-right" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
