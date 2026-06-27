export const BRAND = {
  name: "ICTF",
  fullName: "Information Communication Technology Forum (PVT) LTD",
  /** Dark horizontal wordmark for light backgrounds (mobile sheet, auth cards). */
  logo: "/ICTF%20PNG%204.png",
  /** Login/register mobile header wordmark. */
  logoAuthMobile: "/landing/ICTF%20PNG%204%202%20(1).webp",
  /** Login/register desktop aside wordmark (navy panel). */
  logoAuthDesktop: "/landing/Vector.webp",
  /** Square mark for dark backgrounds (nav, footer). */
  logoMark: "/ICTF.svg",
  /** Legacy light wordmark asset (footer, portal shell). */
  logoLight: "/ICTF-light.svg",
  /** Marketing nav + header wordmark (navy bar). */
  logoNav: "/Vector%20(2).webp",
  /** Marketing footer wordmark. */
  logoFooter: "/Vector%20(2).webp",
  navIcon: "/ICTF.svg",
  favicon: "/favicon.png",
  /** Horizontal wordmark intrinsic ratio (ICTF-light.svg). */
  logoWidth: 1880,
  logoHeight: 717,
  /** Nav/header wordmark intrinsic ratio (Vector (2).webp). */
  logoNavWidth: 339,
  logoNavHeight: 150,
  /** Footer wordmark intrinsic ratio (Vector (2).webp). */
  logoFooterWidth: 339,
  logoFooterHeight: 150,
  /** Square mark intrinsic ratio (ICTF.svg). */
  logoMarkSize: 1767,
  legalName: "Information Communication Technology Forum (PVT) LTD",
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
    address: "Information Communication Technology Forum (PVT) LTD, Jaffna, Sri Lanka",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.2!2d80.0074!3d9.6615!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMzknNDEuNCJOIDgwwrAwMCcyNi42IkU!5e0!3m2!1sen!2slk!4v1",
    social: {
      facebook: "https://www.facebook.com/profile.php?id=100069520722645",
      instagram: "https://instagram.com/ictf.lk",
      youtube: "https://www.youtube.com/@ictfinstitute",
      linkedin: "https://www.linkedin.com/company/ictfofficial",
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
      { label: "Blog", href: "/blog" },
      { label: "Results", href: "/#results" },
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
