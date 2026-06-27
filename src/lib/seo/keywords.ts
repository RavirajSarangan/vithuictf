import type { MarketingLocale } from "@/contexts/marketing-language-context";

export type KeywordTier = 1 | 2 | 3;

export interface SeoKeywordPage {
  slug: string;
  path: string;
  tier: KeywordTier;
  schemaType: "Course" | "WebPage" | "LocalBusiness" | "Person";
  h1: Record<MarketingLocale, string>;
  title: Record<MarketingLocale, string>;
  description: Record<MarketingLocale, string>;
  keywords: Record<MarketingLocale, string[]>;
}

export const PROGRAM_PAGES: SeoKeywordPage[] = [
  {
    slug: "ol-ict",
    path: "/programs/ol-ict",
    tier: 1,
    schemaType: "Course",
    h1: {
      en: "O/L ICT Classes in Sri Lanka",
      ta: "இலங்கையில் O/L ICT வகுப்புகள்",
      si: "ශ්‍රී ලංකාවේ O/L ICT පන්ති",
    },
    title: {
      en: "O/L ICT Classes Sri Lanka | Online Zoom Institute — ICTF",
      ta: "O/L ICT வகுப்புகள் இலங்கை | ஆன்லைன் Zoom — ICTF",
      si: "O/L ICT පන්ති ශ්‍රී ලංකාව | අන්තර්ජාල Zoom — ICTF",
    },
    description: {
      en: "Join ICTF for O/L ICT classes across Sri Lanka. Live Zoom institute programs, past papers, paper centers, and the ICTF Student Portal. Founded by Vithoosan Sivanathan.",
      ta: "இலங்கை முழுவதும் O/L ICT வகுப்புகளுக்கு ICTF-ல் சேருங்கள். நேரடி Zoom நிறுவனம், பேப்பர் மையங்கள், மாணவர் தளம்.",
      si: "ශ්‍රී ලංකාව පුරා O/L ICT පන්ති සඳහා ICTF හා එක්වන්න. සජීවී Zoom ආයතනය, ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සහ ශිෂ්‍ය ද්වාරය.",
    },
    keywords: {
      en: ["O/L ICT", "O/L ICT classes Sri Lanka", "O/L ICT institute", "ICT Grade 10", "ICT Grade 11"],
      ta: ["O/L ICT", "O/L ICT வகுப்புகள்", "இலங்கை ICT"],
      si: ["O/L ICT", "O/L ICT පන්ති", "ශ්‍රී ලංකා ICT"],
    },
  },
  {
    slug: "al-ict",
    path: "/programs/al-ict",
    tier: 1,
    schemaType: "Course",
    h1: {
      en: "A/L ICT Institute in Sri Lanka",
      ta: "இலங்கையில் A/L ICT நிறுவனம்",
      si: "ශ්‍රී ලංකාවේ A/L ICT ආයතනය",
    },
    title: {
      en: "A/L ICT Institute Sri Lanka | Revision & Zoom Classes — ICTF",
      ta: "A/L ICT நிறுவனம் இலங்கை | மறுபரிசீலனை & Zoom — ICTF",
      si: "A/L ICT ආයතනය ශ්‍රී ලංකාව | නැවත පුහුණු & Zoom — ICTF",
    },
    description: {
      en: "Expert A/L ICT institute programs with ICTF. Islandwide Zoom classes, revision programs, past paper practice, and proven exam results. Learn with founder Vithoosan Sivanathan.",
      ta: "ICTF உடன் நிபுணர் A/L ICT நிறுவனம். தீவு முழுவதும் Zoom வகுப்புகள், மறுபரிசீலனை, நிரூபிக்கப்பட்ட தேர்வு முடிவுகள்.",
      si: "ICTF සමඟ විශේෂඥ A/L ICT ආයතනය. දිවයින පුරා Zoom පන්ති, නැවත පුහුණු වැඩසටහන් සහ සාර්ථක විභාග ප්‍රතිඵල.",
    },
    keywords: {
      en: ["A/L ICT", "A/L ICT institute Sri Lanka", "A/L ICT revision", "Advanced Level ICT"],
      ta: ["A/L ICT", "A/L ICT நிறுவனம்", "உயர் தர ICT"],
      si: ["A/L ICT", "A/L ICT ආයතනය", "උසස් පෙළ ICT"],
    },
  },
  {
    slug: "online-zoom",
    path: "/programs/online-zoom",
    tier: 1,
    schemaType: "Course",
    h1: {
      en: "ICT Online Classes via Zoom — Sri Lanka",
      ta: "Zoom வழியாக ICT ஆன்லைன் வகுப்புகள் — இலங்கை",
      si: "Zoom හරහා ICT අන්තර්ජාල පන්ති — ශ්‍රී ලංකාව",
    },
    title: {
      en: "ICT Online Zoom Classes Sri Lanka | ICTF Islandwide",
      ta: "ICT ஆன்லைன் Zoom வகுப்புகள் இலங்கை | ICTF",
      si: "ICT අන්තර්ජාල Zoom පන්ති ශ්‍රී ලංකාව | ICTF",
    },
    description: {
      en: "Study O/L and A/L ICT online from anywhere in Sri Lanka with ICTF live Zoom classes, recordings, and the student portal. Jaffna to Colombo — one trusted platform.",
      ta: "இலங்கையில் எங்கிருந்தும் ICTF நேரடி Zoom வகுப்புகள், பதிவுகள் மற்றும் மாணவர் தளத்துடன் O/L மற்றும் A/L ICT ஆன்லைனில் படியுங்கள்.",
      si: "ශ්‍රී ලංකාවේ ඕනෑම ස්ථානයකින් ICTF සජීවී Zoom පන්ති, පටිගත කිරීම් සහ ශිෂ්‍ය ද්වාරය සමඟ O/L සහ A/L ICT අන්තර්ජාලයෙන් අධ්‍යයනය කරන්න.",
    },
    keywords: {
      en: ["ICT online classes", "Zoom ICT institute", "online ICT Sri Lanka", "distance learning ICT"],
      ta: ["ஆன்லைன் ICT", "Zoom வகுப்புகள்"],
      si: ["අන්තර්ජාල ICT", "Zoom පන්ති"],
    },
  },
];

export const LOCATION_SLUGS = [
  "jaffna",
  "colombo",
  "kandy",
  "kurunegala",
  "gampaha",
  "galle",
  "matara",
  "batticaloa",
  "trincomalee",
  "anuradhapura",
  "badulla",
  "ratnapura",
  "kalutara",
  "matale",
  "kilinochchi",
  "vavuniya",
  "negombo",
] as const;

export type LocationSlug = (typeof LOCATION_SLUGS)[number];

export function formatDistrictName(slug: LocationSlug): string {
  return slug.charAt(0).toUpperCase() + slug.slice(1);
}

export function getLocationSeo(slug: LocationSlug): {
  path: string;
  h1: Record<MarketingLocale, string>;
  title: Record<MarketingLocale, string>;
  description: Record<MarketingLocale, string>;
} {
  const name = formatDistrictName(slug);
  return {
    path: `/locations/${slug}`,
    h1: {
      en: `ICT Institute in ${name}, Sri Lanka`,
      ta: `${name}, இலங்கையில் ICT நிறுவனம்`,
      si: `${name}, ශ්‍රී ලංකාවේ ICT ආයතනය`,
    },
    title: {
      en: `ICT Institute ${name} Sri Lanka | O/L & A/L — ICTF`,
      ta: `ICT நிறுவனம் ${name} இலங்கை | O/L & A/L — ICTF`,
      si: `ICT ආයතනය ${name} ශ්‍රී ලංකාව | O/L & A/L — ICTF`,
    },
    description: {
      en: `ICTF offers O/L and A/L ICT classes for students in ${name} district. Online Zoom institute programs plus islandwide paper centers. Register at ictf.lk.`,
      ta: `${name} மாவட்ட மாணவர்களுக்கு ICTF O/L மற்றும் A/L ICT வகுப்புகளை வழங்குகிறது. ஆன்லைன் Zoom மற்றும் பேப்பர் மையங்கள்.`,
      si: `${name} දිස්ත්‍රික්කයේ ශිෂ්‍යයින්ට ICTF O/L සහ A/L ICT පන්ති ලබා දෙයි. අන්තර්ජාල Zoom සහ දිවයින පුරා මධ්‍යස්ථාන.`,
    },
  };
}

export function getProgramBySlug(slug: string): SeoKeywordPage | undefined {
  return PROGRAM_PAGES.find((p) => p.slug === slug);
}

export const FOUNDER_SEO = {
  path: "/about/founder",
  h1: {
    en: "Vithoosan Sivanathan — ICTF Founder & ICT Educator",
    ta: "விதூசன் சிவநாதன் — ICTF நிறுவனர் & ICT கல்வியாளர்",
    si: "Vithoosan Sivanathan — ICTF නිර්මාතෘ & ICT අධ්‍යාපනික",
  },
  title: {
    en: "Vithoosan Sivanathan | ICTF Founder — Sri Lanka ICT Teacher",
    ta: "விதூசன் சிவநாதன் | ICTF நிறுவனர் — இலங்கை ICT ஆசிரியர்",
    si: "Vithoosan Sivanathan | ICTF නිර්මාතෘ — ශ්‍රී ලංකා ICT ගුරු",
  },
  description: {
    en: "Meet Vithoosan Sivanathan, founder of ICT Foundation (ICTF). Leading O/L & A/L ICT educator in Sri Lanka with island-ranked student results and islandwide online classes.",
    ta: "ICT அடித்தளத்தின் (ICTF) நிறுவனர் விதூசன் சிவநாதனைச் சந்திக்கவும். தீவு தரவரிசை முடிவுகளுடன் இலங்கையின் முன்னணி O/L & A/L ICT கல்வியாளர்.",
    si: "ICT Foundation (ICTF) නිර්මාතෘ Vithoosan Sivanathan හඳුනාගන්න. දිවයින ශ්‍රේණිගත විභාග ප්‍රතිඵල සහිත ශ්‍රී ලංකාවේ ප්‍රමුඛ O/L & A/L ICT අධ්‍යාපනිකයා.",
  },
};

export const RANKINGS_SEO = {
  path: "/rankings",
  title: {
    en: "O/L & A/L ICT Exam Results | ICTF Rankings — Sri Lanka",
    ta: "O/L & A/L ICT தேர்வு முடிவுகள் | ICTF தரவரிசை — இலங்கை",
    si: "O/L & A/L ICT විභාග ප්‍රතිඵල | ICTF ශ්‍රේණි — ශ්‍රී ලංකාව",
  },
  description: {
    en: "View ICTF student examination achievements — island ranks, district top tens, and A/B grades from O/L and A/L ICT exams across Sri Lanka.",
    ta: "ICTF மாணவர் தேர்வு சாதனைகளைப் பாருங்கள் — தீவு தரவரிசை, மாவட்ட முதல் பத்து மற்றும் O/L மற்றும் A/L ICT தேர்வுகளில் A/B தரங்கள்.",
    si: "ICTF ශිෂ්‍ය විභාග ජයග්‍රහණ බලන්න — දිවයින ශ්‍රේණි, දිස්ත්‍රික්ක ප්‍රමුඛ දහය සහ ශ්‍රී ලංකාව පුරා O/L සහ A/L ICT විභාගවල A/B ශ්‍රේණි.",
  },
  keywords: {
    en: ["ICT exam results", "O/L ICT rankings", "A/L ICT results Sri Lanka", "ICTF rankings"],
    ta: ["ICT தேர்வு முடிவுகள்", "O/L ICT தரவரிசை", "A/L ICT முடிவுகள்"],
    si: ["ICT විභාග ප්‍රතිඵල", "O/L ICT ශ්‍රේණි", "A/L ICT ප්‍රතිඵල"],
  },
};

export const PAPER_CENTERS_SEO = {
  path: "/network/paper-centers",
  title: {
    en: "ICT Paper Centers Sri Lanka | ICTF Islandwide Network",
    ta: "ICT பேப்பர் மையங்கள் இலங்கை | ICTF தீவு முழுவதும் வலையமைப்பு",
    si: "ICT ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන ශ්‍රී ලංකාව | ICTF දිවයින පුරා ජාලය",
  },
  description: {
    en: "Find ICTF paper centers across Sri Lanka for O/L and A/L ICT past paper practice. Islandwide network from Jaffna to Colombo with online Zoom classes.",
    ta: "O/L மற்றும் A/L ICT பேப்பர் பயிற்சிக்காக இலங்கை முழுவதும் ICTF பேப்பர் மையங்களைக் கண்டறியுங்கள். யாழ்ப்பாணம் முதல் கொழும்பு வரை தீவு முழுவதும் வலையமைப்பு.",
    si: "O/L සහ A/L ICT ප්‍රශ්න පත්‍ර පුහුණුව සඳහා ශ්‍රී ලංකාව පුරා ICTF මධ්‍යස්ථාන සොයා ගන්න. යාපනයේ සිට කොළඹ දක්වා දිවයින පුරා ජාලය.",
  },
  keywords: {
    en: ["ICT paper centers", "past paper centers Sri Lanka", "ICTF network", "O/L A/L ICT practice"],
    ta: ["ICT பேப்பர் மையங்கள்", "பேப்பர் மையங்கள் இலங்கை"],
    si: ["ICT ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන", "ශ්‍රී ලංකා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන"],
  },
};

export const BLOG_SEO = {
  path: "/blog",
  title: {
    en: "ICT Blog | O/L & A/L ICT Tips — ICTF Sri Lanka",
    ta: "ICT Blog | O/L & A/L ICT Tips — ICTF Sri Lanka",
    si: "ICT Blog | O/L & A/L ICT Tips — ICTF Sri Lanka",
  },
  description: {
    en: "Read ICTF blog articles on O/L and A/L ICT exam preparation, study tips, Zoom class updates, and institute news for students across Sri Lanka.",
    ta: "Read ICTF blog articles on O/L and A/L ICT exam preparation, study tips, Zoom class updates, and institute news for students across Sri Lanka.",
    si: "Read ICTF blog articles on O/L and A/L ICT exam preparation, study tips, Zoom class updates, and institute news for students across Sri Lanka.",
  },
  keywords: {
    en: ["ICT blog", "O/L ICT tips", "A/L ICT study guide", "ICTF blog Sri Lanka", "ICT exam preparation"],
    ta: ["ICT blog", "O/L ICT tips", "A/L ICT study guide"],
    si: ["ICT blog", "O/L ICT tips", "A/L ICT study guide"],
  },
};
