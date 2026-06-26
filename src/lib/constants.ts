export const BRAND = {
  name: "ICTF",
  fullName: "ICT Foundation",
  /** Dark horizontal wordmark for light backgrounds (auth cards, about, SEO). */
  logo: "/ICTF PNG 4.png",
  /** Square mark for dark backgrounds (nav, footer). */
  logoMark: "/ICTF.svg",
  /** Legacy light wordmark asset. */
  logoLight: "/ICTF-light.svg",
  navIcon: "/ICTF.svg",
  favicon: "/favicon.png",
  /** Horizontal wordmark intrinsic ratio (ICTF-light.svg). */
  logoWidth: 1880,
  logoHeight: 717,
  /** Square mark intrinsic ratio (ICTF.svg). */
  logoMarkSize: 1767,
  legalName: "ICT Foundation (Pvt) Ltd",
  platformName: "ICTF Student Portal",
  studentIdPrefix: "ICTF",
  tagline: "Shaping the Future of Education",
  colors: {
    navy: "#273461",
    navyHover: "#34457E",
    navyDark: "#1C2547",
    accent: "#F5A623",
    accentHover: "#FFB938",
    surface: "#F8FAFC",
    border: "#E2E8F0",
    textDark: "#0F172A",
    textLight: "#64748B",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
  },
  contact: {
    whatsapp: "+94774591161",
    email: "info@ictf.lk",
    phone: "+94 77 459 1161",
    address: "ICT Foundation, Jaffna, Sri Lanka",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.2!2d80.0074!3d9.6615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknNDEuNCJOIDgwwrAwMCcyNi42IkU!5e0!3m2!1sen!2slk!4v1",
    social: {
      facebook: "https://facebook.com/ictf.lk",
      instagram: "https://instagram.com/ictf.lk",
      youtube: "https://youtube.com/@ictf",
      linkedin: "https://linkedin.com/company/ictf-institute",
      telegram: "https://t.me/ictf_institute",
      whatsappChannel: "https://wa.me/94774591161",
    },
  },
  footerLinks: {
    quick: [
      { label: "O/L ICT", href: "/programs/ol-ict" },
      { label: "A/L ICT", href: "/programs/al-ict" },
      { label: "Online Zoom", href: "/programs/online-zoom" },
      { label: "Paper Centers", href: "/network/paper-centers" },
      { label: "Founder", href: "/about/founder" },
      { label: "Results", href: "/rankings" },
      { label: "FAQ", href: "/#faq" },
      { label: "Register", href: "/register" },
      { label: "Contact", href: "/#contact" },
    ],
    courses: [
      { label: "Software Engineering", href: "#programs" },
      { label: "Computer Science", href: "#programs" },
      { label: "Data Science & Analytics", href: "#programs" },
      { label: "AI & Machine Learning", href: "#programs" },
      { label: "Cybersecurity", href: "#programs" },
      { label: "Cloud & DevOps", href: "#programs" },
    ],
    portal: [
      { label: "Login", href: "/login" },
      { label: "Register Now", href: "/register" },
      { label: "Parent Portal", href: "/coming-soon/parent" },
      { label: "Teacher Portal", href: "/coming-soon/teacher" },
    ],
  },
} as const;
