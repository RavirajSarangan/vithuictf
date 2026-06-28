import { BRAND } from "@/lib/constants";
import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { localizedPath } from "@/lib/seo/metadata";
import { FOUNDER, ORG_GEO, SITE_URL, absoluteUrl, socialSameAs } from "@/lib/seo/site";

type JsonLd = Record<string, unknown>;

// JSON.stringify does not escape `</script>` or other HTML-significant characters,
// so CMS-driven content (e.g. FAQ answers) could otherwise break out of the inline
// script tag. Escaping `<`, `>` and `&` neutralizes that XSS vector while remaining
// valid JSON-LD.
function escapeJsonLd(json: string): string {
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}

function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  const payload = Array.isArray(data) ? data : [data];
  const json = JSON.stringify(payload.length === 1 ? payload[0] : payload);
  return (
    <script
      type="application/ld+json"
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: escapeJsonLd(json) }}
    />
  );
}

export function OrganizationJsonLd({ locale = "en" }: { locale?: MarketingLocale }) {
  const homeUrl = absoluteUrl(localizedPath("/", locale));
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.fullName,
    alternateName: BRAND.name,
    legalName: BRAND.legalName,
    url: homeUrl,
    logo: absoluteUrl(BRAND.logo),
    description:
      "ICT Foundation (ICTF) delivers O/L and A/L ICT institute programs across Sri Lanka through Zoom online classes and an islandwide paper center network.",
    email: BRAND.contact.email,
    telephone: BRAND.contact.phone,
    sameAs: socialSameAs(),
    address: {
      "@type": "PostalAddress",
      streetAddress: BRAND.contact.address,
      addressLocality: "Jaffna",
      addressCountry: "LK",
    },
    areaServed: { "@type": "Country", name: "Sri Lanka" },
    founder: { "@id": absoluteUrl(`${localizedPath("/about/founder", locale)}#person`) },
  };
  return <JsonLdScript data={data} />;
}

export function LocalBusinessJsonLd({
  district,
  latitude,
  longitude,
  locale = "en",
}: {
  district?: string;
  latitude?: number;
  longitude?: number;
  locale?: MarketingLocale;
}) {
  const lat = latitude ?? ORG_GEO.latitude;
  const lon = longitude ?? ORG_GEO.longitude;
  const locationPath = district ? localizedPath(`/locations/${district}`, locale) : localizedPath("/", locale);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": district
      ? `${absoluteUrl(locationPath)}#localbusiness`
      : `${SITE_URL}/#localbusiness`,
    name: district ? `ICTF — ICT Institute ${district}` : `${BRAND.fullName} — Jaffna`,
    image: absoluteUrl(BRAND.logo),
    url: absoluteUrl(locationPath),
    telephone: BRAND.contact.phone,
    email: BRAND.contact.email,
    address: {
      "@type": "PostalAddress",
      addressLocality: district ? district.charAt(0).toUpperCase() + district.slice(1) : "Jaffna",
      addressCountry: "LK",
    },
    geo: { "@type": "GeoCoordinates", latitude: lat, longitude: lon },
    areaServed: "Sri Lanka",
    priceRange: "LKR",
  };
  return <JsonLdScript data={data} />;
}

export function WebSiteJsonLd({ locale = "en" }: { locale?: MarketingLocale }) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: absoluteUrl(localizedPath("/", locale)),
    name: BRAND.fullName,
    alternateName: BRAND.name,
    description:
      "O/L and A/L ICT institute in Sri Lanka — live Zoom classes, paper centers islandwide, and student portal.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["en-LK", "ta-LK", "si-LK"],
    isAccessibleForFree: true,
    about: { "@id": `${SITE_URL}/#organization` },
  };
  return <JsonLdScript data={data} />;
}

export function PersonJsonLd({ locale = "en" }: { locale?: MarketingLocale }) {
  const founderPath = localizedPath("/about/founder", locale);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${absoluteUrl(founderPath)}#person`,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    image: absoluteUrl(FOUNDER.imagePath),
    url: absoluteUrl(founderPath),
    worksFor: { "@id": `${SITE_URL}/#organization` },
    knowsAbout: ["Information and Communication Technology", "O/L ICT", "A/L ICT", "Sri Lankan education"],
    nationality: { "@type": "Country", name: "Sri Lanka" },
  };
  return <JsonLdScript data={data} />;
}

export function FaqPageJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  if (faqs.length === 0) return null;
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
  return <JsonLdScript data={data} />;
}

export function CourseJsonLd({
  name,
  description,
  path,
  educationalLevel,
  locale = "en",
}: {
  name: string;
  description: string;
  path: string;
  educationalLevel: string;
  locale?: MarketingLocale;
}) {
  const localizedCoursePath = localizedPath(path, locale);
  const registerUrl = absoluteUrl(localizedPath("/register", locale));
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    "@id": `${absoluteUrl(localizedCoursePath)}#course`,
    name,
    description,
    url: absoluteUrl(localizedCoursePath),
    provider: {
      "@type": "Organization",
      name: BRAND.fullName,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(BRAND.logo),
      },
      sameAs: socialSameAs(),
    },
    educationalLevel,
    inLanguage: localeToHreflang(locale),
    courseMode: "blended",
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      availability: "https://schema.org/InStock",
      url: registerUrl,
      priceSpecification: {
        "@type": "UnitPriceSpecification",
        priceCurrency: "LKR",
        description: "Course fees and payment plans are shared during registration at ictf.lk/register.",
      },
    },
    areaServed: {
      "@type": "Country",
      name: "Sri Lanka",
    },
  };
  return <JsonLdScript data={data} />;
}

export function BreadcrumbJsonLd({
  items,
  locale = "en",
}: {
  items: { name: string; path: string }[];
  locale?: MarketingLocale;
}) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(localizedPath(item.path, locale)),
    })),
  };
  return <JsonLdScript data={data} />;
}

export function BlogIndexJsonLd({
  postCount,
  locale = "en",
}: {
  postCount: number;
  locale?: MarketingLocale;
}) {
  const blogPath = localizedPath("/blog", locale);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${absoluteUrl(blogPath)}#blog`,
    url: absoluteUrl(blogPath),
    name: `${BRAND.name} ICT Blog`,
    description: "O/L and A/L ICT exam tips, study guidance, and institute updates for students across Sri Lanka.",
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["en-LK", "ta-LK", "si-LK"],
    blogPost: postCount > 0 ? { "@type": "ItemList", numberOfItems: postCount } : undefined,
  };
  return <JsonLdScript data={data} />;
}

export function ItemListJsonLd({
  name,
  items,
}: {
  name: string;
  items: { name: string; url: string; description?: string }[];
}) {
  if (items.length === 0) return null;
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "LocalBusiness",
        name: item.name,
        url: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
        description: item.description,
        address: { "@type": "PostalAddress", addressCountry: "LK" },
      },
    })),
  };
  return <JsonLdScript data={data} />;
}

export function WebPageJsonLd({
  title,
  description,
  path,
  locale = "en",
}: {
  title: string;
  description: string;
  path: string;
  locale?: MarketingLocale;
}) {
  const pagePath = localizedPath(path, locale);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(pagePath)}#webpage`,
    url: absoluteUrl(pagePath),
    name: title,
    description,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    inLanguage: localeToHreflang(locale),
  };
  return <JsonLdScript data={data} />;
}

function localeToHreflang(locale: MarketingLocale): string {
  if (locale === "ta") return "ta-LK";
  if (locale === "si") return "si-LK";
  return "en-LK";
}

export function HomePageJsonLd({
  faqs,
  locale = "en",
}: {
  faqs: { question: string; answer: string }[];
  locale?: MarketingLocale;
}) {
  return (
    <>
      <OrganizationJsonLd locale={locale} />
      <LocalBusinessJsonLd locale={locale} />
      <WebSiteJsonLd locale={locale} />
      <PersonJsonLd locale={locale} />
      <FaqPageJsonLd faqs={faqs} />
    </>
  );
}

export function ArticleJsonLd({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  authorName,
}: {
  title: string;
  description?: string;
  url: string;
  image?: string;
  datePublished: string;
  dateModified?: string;
  authorName?: string;
}) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description: description ?? title,
    url,
    image: image ? (image.startsWith("http") ? image : absoluteUrl(image)) : absoluteUrl("/og-image.png"),
    datePublished,
    dateModified: dateModified ?? datePublished,
    author: {
      "@type": "Person",
      name: authorName ?? "ICTF",
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.fullName,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl(BRAND.logo),
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
  };
  return <JsonLdScript data={data} />;
}
