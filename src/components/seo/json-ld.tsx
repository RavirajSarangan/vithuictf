import { BRAND } from "@/lib/constants";
import { FOUNDER, ORG_GEO, SITE_URL, absoluteUrl, socialSameAs } from "@/lib/seo/site";

type JsonLd = Record<string, unknown>;

function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  const payload = Array.isArray(data) ? data : [data];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload.length === 1 ? payload[0] : payload) }}
    />
  );
}

export function OrganizationJsonLd() {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "Organization"],
    "@id": `${SITE_URL}/#organization`,
    name: BRAND.fullName,
    alternateName: BRAND.name,
    legalName: BRAND.legalName,
    url: SITE_URL,
    logo: absoluteUrl(BRAND.logo),
    description:
      "ICT Foundation (ICTF) delivers O/L and A/L ICT tuition across Sri Lanka through Zoom online classes and an islandwide paper center network.",
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
    founder: { "@id": `${SITE_URL}/about/founder#person` },
  };
  return <JsonLdScript data={data} />;
}

export function LocalBusinessJsonLd({
  district,
  latitude,
  longitude,
}: {
  district?: string;
  latitude?: number;
  longitude?: number;
}) {
  const lat = latitude ?? ORG_GEO.latitude;
  const lon = longitude ?? ORG_GEO.longitude;
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": district ? `${SITE_URL}/locations/${district}#localbusiness` : `${SITE_URL}/#localbusiness`,
    name: district ? `ICTF — ICT Tuition ${district}` : `${BRAND.fullName} — Jaffna`,
    image: absoluteUrl(BRAND.logo),
    url: district ? absoluteUrl(`/locations/${district}`) : SITE_URL,
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

export function WebSiteJsonLd() {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: BRAND.fullName,
    publisher: { "@id": `${SITE_URL}/#organization` },
    inLanguage: ["en-LK", "ta-LK", "si-LK"],
  };
  return <JsonLdScript data={data} />;
}

export function PersonJsonLd() {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITE_URL}/about/founder#person`,
    name: FOUNDER.name,
    jobTitle: FOUNDER.jobTitle,
    image: absoluteUrl(FOUNDER.imagePath),
    url: absoluteUrl("/about/founder"),
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
}: {
  name: string;
  description: string;
  path: string;
  educationalLevel: string;
}) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Course",
    name,
    description,
    url: absoluteUrl(path),
    provider: { "@id": `${SITE_URL}/#organization` },
    educationalLevel,
    inLanguage: ["en", "ta", "si"],
    offers: {
      "@type": "Offer",
      priceCurrency: "LKR",
      availability: "https://schema.org/InStock",
      url: absoluteUrl("/register"),
    },
    areaServed: "Sri Lanka",
  };
  return <JsonLdScript data={data} />;
}

export function BreadcrumbJsonLd({ items }: { items: { name: string; path: string }[] }) {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
  return <JsonLdScript data={data} />;
}

export function HomePageJsonLd({ faqs }: { faqs: { question: string; answer: string }[] }) {
  return (
    <>
      <OrganizationJsonLd />
      <LocalBusinessJsonLd />
      <WebSiteJsonLd />
      <PersonJsonLd />
      <FaqPageJsonLd faqs={faqs} />
    </>
  );
}
