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
      "ICT Foundation (ICTF) provides comprehensive O/L ICT classes for Grade 10 and Grade 11 students across Sri Lanka. Our program combines live Zoom classes, structured lesson paths, past paper practice at islandwide paper centers, and 24/7 access to the ICTF Student Portal.",
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
      "ICT அடித்தளம் (ICTF) இலங்கை முழுவதும் தரம் 10 மற்றும் தரம் 11 மாணவர்களுக்கு விரிவான O/L ICT வகுப்புகளை வழங்குகிறது. நேரடி Zoom வகுப்புகள், கட்டமைக்கப்பட்ட பாடங்கள், பேப்பர் மைய பயிற்சி மற்றும் ICTF மாணவர் தளம் ஆகியவை இணைந்துள்ளன.",
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
      "ICT Foundation (ICTF) ශ්‍රී ලංකාව පුරා 10 සහ 11 ශ්‍රේණි ශිෂ්‍යයින්ට සම්පූර්ණ O/L ICT පන්ති ලබා දෙයි. සජීවී Zoom පන්ති, ව්‍යුහගත පාඩම්, දිවයින පුරා ප්‍රශ්න පත්‍ර මධ්‍යස්ථාන සහ ICTF ශිෂ්‍ය ද්වාරය ඇතුළත් වේ.",
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
      "ICTF delivers advanced A/L ICT institute programs for Sri Lankan students preparing for the Advanced Level examination. Our A/L program includes intensive revision, past paper workshops, Zoom masterclasses, and full access to the ICTF Student Portal with AI study support.",
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
    cta: "Register for A/L ICT institute programs",
  },
  ta: {
    intro:
      "ICTF உயர் தர ICT நிறுவனத்தை வழங்குகிறது — மறுபரிசீலனை, கடந்த கால வினாத்தாள் பயிற்சி, Zoom வகுப்புகள் மற்றும் AI படிப்பு உதவியுடன் ICTF மாணவர் தளம்.",
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
    cta: "A/L ICT நிறுவனத்திற்குப் பதிவு செய்யுங்கள்",
  },
  si: {
    intro:
      "ICTF උසස් පෙළ ICT ආයතන වැඩසටහන් ලබා දෙයි — නැවත පුහුණු, පසුගිය විභාග ප්‍රශ්න පත්‍ර, Zoom පන්ති සහ AI අධ්‍යයන සහාය සහිත ICTF ශිෂ්‍ය ද්වාරය.",
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
    cta: "A/L ICT ආයතන වැඩසටහන් සඳහා ලියාපදිංචි වන්න",
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

export interface ProgramFaq {
  question: string;
  answer: string;
}

/** Visible FAQ content per program page, emitted as FAQPage structured data. */
export const PROGRAM_FAQS: Record<string, Record<MarketingLocale, ProgramFaq[]>> = {
  "ol-ict": {
    en: [
      {
        question: "How do I join ICTF O/L ICT classes?",
        answer:
          "Register online at ictf.lk/register or message us on WhatsApp +94 77 459 1161. Course fees and payment plans are shared during registration.",
      },
      {
        question: "Are O/L ICT classes online or in person?",
        answer:
          "Classes are conducted live on Zoom, so students can join from any district in Sri Lanka. Past-paper practice is also available at partner paper centers islandwide.",
      },
      {
        question: "Are class recordings available if I miss a session?",
        answer:
          "Yes. Live Zoom sessions are recorded and made available through the ICTF Student Portal along with notes, videos, and resources.",
      },
      {
        question: "Who can enroll in O/L ICT?",
        answer:
          "Students in Grade 10 or Grade 11 preparing for the G.C.E. O/L ICT examination anywhere in Sri Lanka can enroll.",
      },
      {
        question: "In which language are the classes taught?",
        answer:
          "ICTF supports Tamil, Sinhala, and English medium students, with materials and guidance aligned to the national O/L ICT syllabus.",
      },
    ],
    ta: [
      {
        question: "ICTF O/L ICT வகுப்புகளில் எப்படி சேர்வது?",
        answer:
          "ictf.lk/register இல் ஆன்லைனில் பதிவு செய்யுங்கள் அல்லது WhatsApp +94 77 459 1161 இல் தொடர்பு கொள்ளுங்கள். கட்டணங்கள் பதிவின் போது அறிவிக்கப்படும்.",
      },
      {
        question: "O/L ICT வகுப்புகள் ஆன்லைனா அல்லது நேரடியா?",
        answer:
          "வகுப்புகள் Zoom வழியாக நேரடியாக நடத்தப்படுகின்றன. இலங்கையின் எந்த மாவட்டத்திலிருந்தும் சேரலாம். பேப்பர் மையங்களில் பயிற்சியும் உண்டு.",
      },
      {
        question: "வகுப்பை தவறவிட்டால் பதிவுகள் கிடைக்குமா?",
        answer:
          "ஆம். நேரடி Zoom வகுப்புகள் பதிவு செய்யப்பட்டு ICTF மாணவர் தளத்தில் குறிப்புகளுடன் வழங்கப்படும்.",
      },
      {
        question: "யார் O/L ICT இல் சேரலாம்?",
        answer: "தரம் 10 அல்லது தரம் 11 இல் G.C.E. O/L ICT தேர்வுக்கு தயாராகும் மாணவர்கள் சேரலாம்.",
      },
    ],
    si: [
      {
        question: "ICTF O/L ICT පන්තිවලට එක්වන්නේ කෙසේද?",
        answer:
          "ictf.lk/register හරහා අන්තර්ජාලයෙන් ලියාපදිංචි වන්න හෝ WhatsApp +94 77 459 1161 අමතන්න. ගාස්තු ලියාපදිංචියේදී දැනුම් දෙනු ලැබේ.",
      },
      {
        question: "O/L ICT පන්ති අන්තර්ජාලද, නැතිනම් භෞතිකද?",
        answer:
          "පන්ති Zoom හරහා සජීවීව පැවැත්වේ. ශ්‍රී ලංකාවේ ඕනෑම දිස්ත්‍රික්කයකින් එක්විය හැක. ප්‍රශ්න පත්‍ර මධ්‍යස්ථානවල පුහුණුවද ඇත.",
      },
      {
        question: "පන්තියක් මගහැරුණොත් පටිගත කිරීම් ලැබේද?",
        answer: "ඔව්. සජීවී Zoom පන්ති පටිගත කර ICTF ශිෂ්‍ය ද්වාරය හරහා ලබා දේ.",
      },
      {
        question: "O/L ICT සඳහා ලියාපදිංචි විය හැක්කේ කාටද?",
        answer: "G.C.E. O/L ICT විභාගයට සූදානම් වන 10 හෝ 11 ශ්‍රේණියේ ශිෂ්‍යයින්ට එක්විය හැක.",
      },
    ],
  },
  "al-ict": {
    en: [
      {
        question: "How do I join ICTF A/L ICT classes?",
        answer:
          "Register online at ictf.lk/register or message us on WhatsApp +94 77 459 1161. Course fees and payment plans are shared during registration.",
      },
      {
        question: "Does ICTF cover the full A/L ICT syllabus?",
        answer:
          "Yes. The program covers theory, revision, and past-paper practice for the G.C.E. A/L ICT examination, with structured schedules and exam-technique guidance.",
      },
      {
        question: "Can I join A/L ICT classes from outside Jaffna?",
        answer:
          "Yes. Classes run live on Zoom for students in every district, and the paper center network provides local past-paper practice from Jaffna to Colombo.",
      },
      {
        question: "Are recordings and notes provided?",
        answer:
          "Yes. Recordings, notes, and resources are available on the ICTF Student Portal for enrolled students.",
      },
      {
        question: "What results have ICTF students achieved?",
        answer:
          "ICTF students have earned island ranks, district top-ten placements, and strong A/B grades in national ICT examinations. See ictf.lk for featured results.",
      },
    ],
    ta: [
      {
        question: "ICTF A/L ICT வகுப்புகளில் எப்படி சேர்வது?",
        answer:
          "ictf.lk/register இல் பதிவு செய்யுங்கள் அல்லது WhatsApp +94 77 459 1161 இல் தொடர்பு கொள்ளுங்கள்.",
      },
      {
        question: "முழு A/L ICT பாடத்திட்டமும் கற்பிக்கப்படுமா?",
        answer:
          "ஆம். G.C.E. A/L ICT தேர்வுக்கான கோட்பாடு, மறுபரிசீலனை மற்றும் பேப்பர் பயிற்சி அனைத்தும் உள்ளடங்கும்.",
      },
      {
        question: "யாழ்ப்பாணத்திற்கு வெளியே இருந்து சேரலாமா?",
        answer:
          "ஆம். வகுப்புகள் Zoom வழியாக நடைபெறுவதால் எல்லா மாவட்ட மாணவர்களும் சேரலாம். பேப்பர் மையங்களும் உள்ளன.",
      },
      {
        question: "பதிவுகளும் குறிப்புகளும் வழங்கப்படுமா?",
        answer: "ஆம். ICTF மாணவர் தளத்தில் பதிவுகள், குறிப்புகள் மற்றும் வளங்கள் கிடைக்கும்.",
      },
    ],
    si: [
      {
        question: "ICTF A/L ICT පන්තිවලට එක්වන්නේ කෙසේද?",
        answer:
          "ictf.lk/register හරහා ලියාපදිංචි වන්න හෝ WhatsApp +94 77 459 1161 අමතන්න.",
      },
      {
        question: "සම්පූර්ණ A/L ICT විෂය නිර්දේශය ආවරණය වේද?",
        answer:
          "ඔව්. G.C.E. A/L ICT විභාගය සඳහා සිද්ධාන්ත, නැවත පුහුණු සහ ප්‍රශ්න පත්‍ර පුහුණුව ඇතුළත් වේ.",
      },
      {
        question: "යාපනයෙන් පිටත සිට එක්විය හැකිද?",
        answer:
          "ඔව්. පන්ති Zoom හරහා පැවැත්වෙන නිසා සියලුම දිස්ත්‍රික්කවල ශිෂ්‍යයින්ට එක්විය හැක.",
      },
      {
        question: "පටිගත කිරීම් සහ සටහන් ලබා දේද?",
        answer: "ඔව්. ICTF ශිෂ්‍ය ද්වාරයේ පටිගත කිරීම්, සටහන් සහ සම්පත් ලබා ගත හැක.",
      },
    ],
  },
  "online-zoom": {
    en: [
      {
        question: "How do ICTF online Zoom classes work?",
        answer:
          "Classes run live on Zoom at scheduled times. Students join with a link from the ICTF Student Portal, and every session is recorded for revision.",
      },
      {
        question: "What do I need to join online classes?",
        answer:
          "A phone, tablet, or computer with an internet connection is enough. The Zoom app is free, and ICTF shares setup guidance when you register.",
      },
      {
        question: "Can I study ICT online from any district?",
        answer:
          "Yes. Students join from every district of Sri Lanka — Jaffna to Colombo — and can also practice past papers at nearby partner paper centers.",
      },
      {
        question: "How do I register for online classes?",
        answer:
          "Register at ictf.lk/register or contact WhatsApp +94 77 459 1161. Fees and schedules are shared during registration.",
      },
    ],
    ta: [
      {
        question: "ICTF ஆன்லைன் Zoom வகுப்புகள் எப்படி நடைபெறுகின்றன?",
        answer:
          "குறிப்பிட்ட நேரங்களில் Zoom வழியாக நேரடி வகுப்புகள் நடைபெறும். ஒவ்வொரு அமர்வும் பதிவு செய்யப்படும்.",
      },
      {
        question: "ஆன்லைன் வகுப்புகளுக்கு என்ன தேவை?",
        answer:
          "இணைய இணைப்புடன் ஒரு தொலைபேசி, டேப்லெட் அல்லது கணினி போதும். Zoom செயலி இலவசம்.",
      },
      {
        question: "எந்த மாவட்டத்திலிருந்தும் சேரலாமா?",
        answer: "ஆம். இலங்கையின் எல்லா மாவட்டங்களிலிருந்தும் மாணவர்கள் சேர்கிறார்கள்.",
      },
      {
        question: "எப்படி பதிவு செய்வது?",
        answer: "ictf.lk/register இல் பதிவு செய்யுங்கள் அல்லது WhatsApp +94 77 459 1161 ஐ தொடர்பு கொள்ளுங்கள்.",
      },
    ],
    si: [
      {
        question: "ICTF අන්තර්ජාල Zoom පන්ති ක්‍රියාත්මක වන්නේ කෙසේද?",
        answer:
          "නියමිත වේලාවන්හිදී Zoom හරහා සජීවී පන්ති පැවැත්වේ. සෑම සැසියක්ම පටිගත කෙරේ.",
      },
      {
        question: "අන්තර්ජාල පන්ති සඳහා අවශ්‍ය දේ මොනවාද?",
        answer:
          "අන්තර්ජාල සම්බන්ධතාවක් සහිත දුරකථනයක්, ටැබ්ලට් හෝ පරිගණකයක් ප්‍රමාණවත්ය. Zoom යෙදුම නොමිලේ.",
      },
      {
        question: "ඕනෑම දිස්ත්‍රික්කයකින් එක්විය හැකිද?",
        answer: "ඔව්. ශ්‍රී ලංකාවේ සෑම දිස්ත්‍රික්කයකින්ම ශිෂ්‍යයින් එක්වේ.",
      },
      {
        question: "ලියාපදිංචි වන්නේ කෙසේද?",
        answer: "ictf.lk/register හරහා ලියාපදිංචි වන්න හෝ WhatsApp +94 77 459 1161 අමතන්න.",
      },
    ],
  },
};
