import type { MarketingLocale } from "@/contexts/marketing-language-context";

export interface ProgramSection {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
}

export interface ProgramContent {
  intro: string;
  sections: ProgramSection[];
  cta: string;
}

const OL_ICT: Record<MarketingLocale, ProgramContent> = {
  en: {
    intro:
      "ICT Foundation (ICTF) provides comprehensive O/L ICT classes for Grade 10 and Grade 11 students across Sri Lanka. Our program combines live Zoom tuition, structured lesson paths, past paper practice at islandwide paper centers, and 24/7 access to the ICTF Student Portal.",
    sections: [
      {
        heading: "Why choose ICTF for O/L ICT?",
        paragraphs: [
          "Sri Lankan students face a demanding O/L ICT syllabus covering theory, practical skills, and exam technique. ICTF delivers expert-led classes designed around the local curriculum, with revision support before national examinations.",
          "Founded by Vithoosan Sivanathan, ICTF has built a reputation for strong examination outcomes and an islandwide learning network from Jaffna to Colombo.",
        ],
        bullets: [
          "Live Zoom classes with recordings",
          "Past papers and revision sessions",
          "Paper center network across districts",
          "Student portal with notes and videos",
          "LKR pricing with online registration",
        ],
      },
      {
        heading: "Who can enroll?",
        paragraphs: [
          "Students in Grade 10 or Grade 11 preparing for O/L ICT examinations anywhere in Sri Lanka can register online at ictf.lk/register or contact us on WhatsApp +94 77 459 1161.",
        ],
      },
    ],
    cta: "Register for O/L ICT classes",
  },
  ta: {
    intro:
      "ICT அடித்தளம் (ICTF) இலங்கை முழுவதும் தரம் 10 மற்றும் தரம் 11 மாணவர்களுக்கு விரிவான O/L ICT வகுப்புகளை வழங்குகிறது. நேரடி Zoom பயிற்சி, கட்டமைக்கப்பட்ட பாடங்கள், பேப்பர் மைய பயிற்சி மற்றும் ICTF மாணவர் தளம் ஆகியவை இணைந்துள்ளன.",
    sections: [
      {
        heading: "O/L ICT-க்கு ICTF ஏன்?",
        paragraphs: [
          "இலங்கை O/L ICT பாடத்திட்டம் கோட்பாடு, நடைமுறை திறன்கள் மற்றும் தேர்வு நுட்பத்தை உள்ளடக்கியது. ICTF நிபுணர் வழிநடத்தும் வகுப்புகளை வழங்குகிறது.",
        ],
        bullets: [
          "பதிவுகளுடன் நேரடி Zoom வகுப்புகள்",
          "கடந்த கால வினாத்தாள்கள்",
          "மாவட்டங்களில் பேப்பர் மையங்கள்",
          "குறிப்புகள் மற்றும் வீடியோக்கள்",
        ],
      },
      {
        heading: "யார் பதிவு செய்யலாம்?",
        paragraphs: ["இலங்கையில் எங்கிருந்தும் O/L ICT தேர்வுக்குத் தயாராகும் தரம் 10/11 மாணவர்கள் பதிவு செய்யலாம்."],
      },
    ],
    cta: "O/L ICT வகுப்புகளுக்குப் பதிவு செய்யுங்கள்",
  },
  si: {
    intro:
      "ICT Foundation (ICTF) ශ්‍රී ලංකාව පුරා 10 සහ 11 ශ්‍රේණි ශිෂ්‍යයින්ට සම්පූර්ණ O/L ICT පන්ති ලබා දෙයි. සජීවී Zoom ටියුෂන්, ව්‍යුහගත පාඩම්, දිවයින පුරා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සහ ICTF ශිෂ්‍ය ද්වාරය ඇතුළත් වේ.",
    sections: [
      {
        heading: "O/L ICT සඳහා ICTF තෝරන්නේ ඇයි?",
        paragraphs: [
          "ශ්‍රී ලංකා O/L ICT විෂය නිර්දේශය න්‍යාය, ප්‍රායෝගික කුසලතා සහ විභාග ශිල්පය ඇතුළත් කරයි. ICTF විශේෂඥ මගින් මෙහෙයවන පන්ති ලබා දෙයි.",
        ],
        bullets: [
          "පටිගත කිරීම් සහිත සජීවී Zoom පන්ති",
          "පසුගිය විභාග ප්‍රශ්න පත්‍ර",
          "දිස්ත්‍රික්කවල මධ්‍යස්ථාන",
          "සටහන් සහ වීඩියෝ",
        ],
      },
      {
        heading: "ලියාපදිංචි විය හැක්කේ කාටද?",
        paragraphs: ["ශ්‍රී ලංකාවේ ඕනෑම ස්ථානයකින් O/L ICT විභාගයට සූදානම් 10/11 ශ්‍රේණි ශිෂ්‍යයින්ට ලියාපදිංචි විය හැක."],
      },
    ],
    cta: "O/L ICT පන්ති සඳහා ලියාපදිංචි වන්න",
  },
};

const AL_ICT: Record<MarketingLocale, ProgramContent> = {
  en: {
    intro:
      "ICTF delivers advanced A/L ICT tuition for Sri Lankan students preparing for the Advanced Level examination. Our A/L program includes intensive revision, past paper workshops, Zoom masterclasses, and full access to the ICTF Student Portal with AI study support.",
    sections: [
      {
        heading: "A/L ICT program highlights",
        paragraphs: [
          "The A/L ICT syllabus requires deep understanding of programming, databases, networking, and systems analysis. ICTF's faculty — led by founder Vithoosan Sivanathan — guides students through structured batches with proven island and district ranking outcomes.",
        ],
        bullets: [
          "Revision programs before A/L exams",
          "Past paper discussions and mock exams",
          "Live Zoom classes with Q&A",
          "Leaderboard and progress tracking",
          "Paper center practice islandwide",
        ],
      },
      {
        heading: "Results you can trust",
        paragraphs: [
          "View public examination achievements at ictf.lk/rankings. ICTF students regularly achieve island ranks, district top tens, and A/B grades in O/L and A/L ICT.",
        ],
      },
    ],
    cta: "Register for A/L ICT tuition",
  },
  ta: {
    intro:
      "ICTF உயர் தர ICT பயிற்சியை வழங்குகிறது — மறுபரிசீலனை, கடந்த கால வினாத்தாள் பயிற்சி, Zoom வகுப்புகள் மற்றும் AI படிப்பு உதவியுடன் KCTF மாணவர் தளம்.",
    sections: [
      {
        heading: "A/L ICT நிரல் சிறப்புகள்",
        paragraphs: ["நிறுவனர் விதூசன் சிவநாதன் தலைமையில் நிபுணர் வழிகாட்டுதல்."],
        bullets: ["மறுபரிசீலனை", "கடந்த கால வினாத்தாள்கள்", "நேரடி Zoom", "லீடர்போர்டு"],
      },
      {
        heading: "நம்பகமான முடிவுகள்",
        paragraphs: ["ictf.lk/rankings-ல் தேர்வு சாதனைகளைப் பாருங்கள்."],
      },
    ],
    cta: "A/L ICT பயிற்சிக்குப் பதிவு செய்யுங்கள்",
  },
  si: {
    intro:
      "ICTF උසස් පෙළ ICT ටියුෂන් ලබා දෙයි — නැවත පුහුණු, පසුගිය විභාග ප්‍රශ්න පත්‍ර, Zoom පන්ති සහ AI අධ්‍යයන සහාය සහිත ICTF ශිෂ්‍ය ද්වාරය.",
    sections: [
      {
        heading: "A/L ICT වැඩසටහන",
        paragraphs: ["නිර්මාතෘ Vithoosan Sivanathan මෙහෙයවන විශේෂඥ මගින් පන්ති."],
        bullets: ["නැවත පුහුණු", "පසුගිය ප්‍රශ්න පත්‍ර", "සජීවී Zoom", "නායක පුවරුව"],
      },
      {
        heading: "විශ්වාසදායක ප්‍රතිඵල",
        paragraphs: ["ictf.lk/rankings හි විභාග සාර්ථකත්වය බලන්න."],
      },
    ],
    cta: "A/L ICT ටියුෂන් සඳහා ලියාපදිංචි වන්න",
  },
};

const ONLINE_ZOOM: Record<MarketingLocale, ProgramContent> = {
  en: {
    intro:
      "Study O/L and A/L ICT from anywhere in Sri Lanka with ICTF online Zoom classes. Our islandwide institute connects students in every district to expert faculty, live sessions, class recordings, and digital study materials through the ICTF Student Portal.",
    sections: [
      {
        heading: "How online ICT classes work",
        paragraphs: [
          "Enroll at ictf.lk/register, join scheduled Zoom sessions from your phone or laptop, and revisit recordings anytime. Supplement online learning with optional paper center visits for past paper practice near you.",
        ],
        bullets: [
          "Flexible scheduling for school students",
          "HD recordings after every live class",
          "WhatsApp support: +94 77 459 1161",
          "Works on mobile, tablet, and desktop",
        ],
      },
      {
        heading: "Online plus local support",
        paragraphs: [
          "ICTF combines the convenience of online learning with physical paper centers across Sri Lanka — the best of both worlds for ICT exam preparation.",
        ],
      },
    ],
    cta: "Start learning online today",
  },
  ta: {
    intro: "இலங்கையில் எங்கிருந்தும் ICTF ஆன்லைன் Zoom வகுப்புகள் மூலம் O/L மற்றும் A/L ICT படியுங்கள்.",
    sections: [
      {
        heading: "ஆன்லைன் வகுப்புகள் எப்படி?",
        paragraphs: ["ictf.lk/register-ல் பதிவு செய்து Zoom வகுப்புகளில் சேருங்கள்."],
        bullets: ["நெகிழ்வான அட்டவணை", "பதிவுகள்", "WhatsApp ஆதரவு"],
      },
      {
        heading: "ஆன்லைன் + உள்ளூர் ஆதரவு",
        paragraphs: ["பேப்பர் மையங்களுடன் இணைந்த ஆன்லைன் கற்றல்."],
      },
    ],
    cta: "இன்றே ஆன்லைனில் கற்றல் தொடங்குங்கள்",
  },
  si: {
    intro: "ශ්‍රී ලංකාවේ ඕනෑම ස්ථානයකින් ICTF අන්තර්ජාල Zoom පන්ති හරහා O/L සහ A/L ICT අධ්‍යයනය කරන්න.",
    sections: [
      {
        heading: "අන්තර්ජාල පන්ති ක්‍රමය",
        paragraphs: ["ictf.lk/register හරහා ලියාපදිංචි වී Zoom පන්ති වලට සහභාගී වන්න."],
        bullets: ["නම්‍යශීලී කාලසටහන", "පටිගත කිරීම්", "WhatsApp සහාය"],
      },
      {
        heading: "අන්තර්ජාල + දේශීය සහාය",
        paragraphs: ["ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සමඟ අන්තර්ජාල ඉගෙනීම."],
      },
    ],
    cta: "අදම අන්තර්ජාලයෙන් ඉගෙන ගන්න",
  },
};

export const PROGRAM_CONTENT: Record<string, Record<MarketingLocale, ProgramContent>> = {
  "ol-ict": OL_ICT,
  "al-ict": AL_ICT,
  "online-zoom": ONLINE_ZOOM,
};
