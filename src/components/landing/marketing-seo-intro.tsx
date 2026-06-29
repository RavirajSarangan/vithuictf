import Link from "next/link";
import { MarketingContainer } from "@/components/landing/marketing-layout";
import type { MarketingLocale } from "@/contexts/marketing-language-context";

const COPY: Record<
  MarketingLocale,
  {
    title: string;
    paragraphs: string[];
    links: { href: string; label: string }[];
  }
> = {
  en: {
    title: "Sri Lanka's trusted O/L & A/L ICT institute",
    paragraphs: [
      "ICTF (Information Communication Technology Forum) delivers live Zoom ICT classes, islandwide paper center support, revision programs, and a modern student portal for learners across every district in Sri Lanka.",
      "Browse free O/L and A/L past papers online, explore our paper center network, and register for online or center-based ICT classes led by founder Vithoosan Sivanathan from Jaffna.",
    ],
    links: [
      { href: "/programs/ol-ict", label: "O/L ICT classes" },
      { href: "/programs/al-ict", label: "A/L ICT institute" },
      { href: "/pass-papers", label: "Free pass papers" },
      { href: "/network/paper-centers", label: "Paper centers" },
      { href: "/register", label: "Student registration" },
    ],
  },
  ta: {
    title: "இலங்கையின் நம்பகமான O/L & A/L ICT நிறுவனம்",
    paragraphs: [
      "ICTF தீவு முழுவதும் உள்ள மாணவர்களுக்கு நேரடி Zoom ICT வகுப்புகள், பேப்பர் மைய ஆதரவு, மறுபரிசீலனை திட்டங்கள் மற்றும் மாணவர் தளத்தை வழங்குகிறது.",
      "இலவச O/L மற்றும் A/L கடந்த வினாத்தாள்களை ஆன்லைனில் பார்வையிடுங்கள், பேப்பர் மைய வலையமைப்பை ஆராயுங்கள், நிறுவனர் விதூசன் சிவநாதன் வழிநடத்தும் வகுப்புகளுக்கு பதிவு செய்யுங்கள்.",
    ],
    links: [
      { href: "/ta/programs/ol-ict", label: "O/L ICT வகுப்புகள்" },
      { href: "/ta/programs/al-ict", label: "A/L ICT நிறுவனம்" },
      { href: "/pass-papers", label: "இலவச கடந்த வினாத்தாள்கள்" },
      { href: "/ta/network/paper-centers", label: "பேப்பர் மையங்கள்" },
      { href: "/register", label: "மாணவர் பதிவு" },
    ],
  },
  si: {
    title: "ශ්‍රී ලංකාවේ විශ්වසනීය O/L සහ A/L ICT ආයතනය",
    paragraphs: [
      "ICTF දිවයින පුරා සිසුන්ට සජීවී Zoom ICT පන්ති, ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සහාය, නැවත පුහුණු වැඩසටහන් සහ ශිෂ්‍ය ද්වාරය සපයයි.",
      "නොමිලේ O/L සහ A/L පසුගිය ප්‍රශ්න පත්‍ර බ්‍රවුස් කරන්න, ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන ජාලය ගවේෂණය කරන්න, සහ නිර්මාතෘ Vithoosan Sivanathan මෙහෙයවන පන්ති සඳහා ලියාපදිංචි වන්න.",
    ],
    links: [
      { href: "/si/programs/ol-ict", label: "O/L ICT පන්ති" },
      { href: "/si/programs/al-ict", label: "A/L ICT ආයතනය" },
      { href: "/pass-papers", label: "නොමිලේ පසුගිය ප්‍රශ්න පත්‍ර" },
      { href: "/si/network/paper-centers", label: "ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන" },
      { href: "/register", label: "ශිෂ්‍ය ලියාපදිංචිය" },
    ],
  },
};

export function MarketingSeoIntro({ locale = "en" }: { locale?: MarketingLocale }) {
  const copy = COPY[locale];

  return (
    <section
      aria-labelledby="marketing-seo-intro-title"
      className="border-b border-icvf-border/80 bg-white/70 py-10 sm:py-12"
    >
      <MarketingContainer>
        <div className="mx-auto max-w-4xl text-center">
          <h2
            id="marketing-seo-intro-title"
            className="text-lg font-semibold tracking-tight text-icvf-navy sm:text-xl"
          >
            {copy.title}
          </h2>
          {copy.paragraphs.map((paragraph) => (
            <p
              key={paragraph}
              className="mt-3 text-sm leading-relaxed text-icvf-text-light sm:text-base"
            >
              {paragraph}
            </p>
          ))}
          <nav
            aria-label="Featured ICTF programs and resources"
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            {copy.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full border border-icvf-border bg-white px-3 py-1.5 text-xs font-medium text-icvf-navy transition-colors hover:border-icvf-accent/40 hover:text-icvf-navy-dark sm:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </MarketingContainer>
    </section>
  );
}
