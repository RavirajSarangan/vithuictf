export const heroSlides = [
  {
    id: "future-education",
    badge: "ICT Foundation",
    badgeTa: "ICT அடித்தளம்",
    title: "Shaping the Future of Education",
    titleTa: "எதிர்கால கல்வியை வடிவமைக்கிறோம்",
    subtitle:
      "Empowering tomorrow's innovators through smart learning, advanced technology, expert mentorship, and career-focused education.",
    subtitleTa:
      "ஸ்மார்ட் கற்றல், மேம்பட்ட தொழில்நுட்பம், நிபுணர் வழிகாட்டுதல் மூலம் நாளைய புதுமையாளர்களை வலுப்படுத்துகிறோம்.",
    primaryCta: { label: "Explore Courses", href: "#programs" },
    secondaryCta: { label: "Register Now", href: "/register" },
  },
  {
    id: "zoom-classes",
    badge: "Online via Zoom",
    badgeTa: "ஆன்லைன் Zoom வகுப்புகள்",
    title: "Learn ICT Without Boundaries",
    titleTa: "எல்லைகள் இல்லாமல் ICT கற்றுக்கொள்ளுங்கள்",
    subtitle:
      "Join flexible online classes via Zoom and study from anywhere with expert guidance and modern digital tools.",
    subtitleTa:
      "நிபுணர் வழிகாட்டுதலுடன் எங்கிருந்தும் படிக்க Zoom வழியாக நெகிழ்வான ஆன்லைன் வகுப்புகளில் சேருங்கள்.",
    primaryCta: { label: "View Programs", href: "#programs" },
    secondaryCta: { label: "Login", href: "/login" },
  },
  {
    id: "curricula",
    badge: "Global Pathways",
    badgeTa: "உலகளாவிய பாதைகள்",
    title: "Sri Lankan and UK Curricula",
    titleTa: "இலங்கை மற்றும் UK பாடத்திட்டங்கள்",
    subtitle:
      "Gain a globally relevant education designed around Sri Lankan academic needs and United Kingdom curriculum standards.",
    subtitleTa:
      "இலங்கை கல்வித் தேவைகள் மற்றும் UK பாடத்திட்ட தரநிலைகளை மையமாகக் கொண்ட உலகளாவிய கல்வி.",
    primaryCta: { label: "Explore Pathways", href: "#programs" },
    secondaryCta: { label: "Book a Consultation", href: "#contact" },
  },
  {
    id: "career-skills",
    badge: "Professional Development",
    badgeTa: "தொழில்முறை வளர்ச்சி",
    title: "Build Skills for Tomorrow",
    titleTa: "நாளைக்கான திறன்களை உருவாக்குங்கள்",
    subtitle:
      "Prepare for future careers with practical ICT knowledge, innovation-focused learning, and professional development.",
    subtitleTa:
      "நடைமுறை ICT அறிவு, புதுமை மையப்படுத்திய கற்றல் மற்றும் தொழில்முறை வளர்ச்சியுடன் எதிர்கால வாழ்க்கைக்குத் தயாராகுங்கள்.",
    primaryCta: { label: "View Programs", href: "#programs" },
    secondaryCta: { label: "Register Now", href: "/register" },
  },
] as const;

export const trustPills = [
  { label: "Online via Zoom", labelTa: "Zoom வழியாக ஆன்லைன்" },
  { label: "O/L & A/L ICT Classes", labelTa: "O/L & A/L ICT வகுப்புகள்" },
  { label: "Paper Center Network", labelTa: "பேப்பர் மைய நெட்வொர்க்" },
  { label: "Islandwide Institute", labelTa: "தீவு முழுவதும் நிறுவனம்" },
] as const;

export const instituteAbout = {
  title: "About ICT Foundation",
  titleTa: "ICT அடித்தளம் பற்றி",
  subtitle: "Premium ICT education built for a borderless digital era.",
  subtitleTa: "எல்லையற்ற டிஜிட்டல் யுகத்திற்கான தரமான ICT கல்வி.",
  intro:
    "ICT Foundation (ICTF) advances education and professional development in information and communication technology — delivering high-quality academic and professional courses aligned with both Sri Lankan and United Kingdom curricula.",
  introTa:
    "ICT அடித்தளம் (ICTF) என்பது தகவல் தொழில்நுட்ப கல்வி மற்றும் தொழில்முறை வளர்ச்சியை முன்னெடுக்கும் நிறுவனம் — இலங்கை மற்றும் UK பாடத்திட்டங்களுடன் இணைந்த தரமான பாடங்களை வழங்குகிறது.",
  note:
    "All classes are conducted online via Zoom, giving students flexible access to learning regardless of location. ICTF supports students in achieving academic goals and preparing for professional success.",
  pillars: [
    {
      title: "Future-Ready Learning",
      titleTa: "எதிர்காலத்திற்கு தயார் கற்றல்",
      description:
        "Modern lessons shaped around emerging technologies, flexible delivery, and lifelong relevance.",
    },
    {
      title: "Innovation-Driven Education",
      titleTa: "புதுமை மையப்படுத்திய கல்வி",
      description: "Challenge-based learning that turns curiosity into practical digital capability.",
    },
    {
      title: "Career-Focused Growth",
      titleTa: "தொழில் மையப்படுத்திய வளர்ச்சி",
      description:
        "Mentorship and professional development designed to connect learning with opportunity.",
    },
  ],
  mission:
    "Deliver accessible, technology-led education that develops confident ICT learners.",
  vision: "Become a trusted global pathway for future-ready digital talent.",
  philosophy:
    "Blend academic rigor, practical skills, and mentorship in every learning journey.",
} as const;
