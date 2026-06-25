import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import {
  buildDetailsTable,
  buildIctfEmailLayout,
  buildNumberedSteps,
  buildPortalFeaturesGrid,
  buildStudentCredentialsCard,
} from "@/lib/email/layout";

export interface WelcomeStudentEmailData {
  displayName: string;
  studentId: string;
  email: string;
  tempPassword: string;
  courseName: string;
  loginUrl: string;
  username?: string;
  indexNumber?: string;
  examYear?: string;
  ictGrade?: string;
  selfRegistered?: boolean;
}

const PORTAL_FEATURES = [
  {
    title: "Live Zoom classes",
    description: "Join scheduled ICT classes online and never miss a lesson.",
  },
  {
    title: "Study materials & video library",
    description: "Access notes, recordings, and revision resources anytime.",
  },
  {
    title: "Results & progress tracking",
    description: "View your performance, ranks, and learning progress in one place.",
  },
  {
    title: "Calendar & announcements",
    description: "Stay updated with class schedules and important tuition notices.",
  },
  {
    title: "Student profile & index number",
    description: "Your official student details are stored securely in your portal account.",
  },
] as const;

function formatIctGradeLabel(grade?: string): string | undefined {
  if (grade === "grade_10") return "Grade 10 ICT";
  if (grade === "grade_11") return "Grade 11 ICT";
  return undefined;
}

export function buildWelcomeStudentEmailHtml(data: WelcomeStudentEmailData): string {
  const portalUsername = data.username ?? data.email;
  const passwordLabel = data.selfRegistered ? "Your portal password" : "Temporary password";
  const ictGradeLabel = formatIctGradeLabel(data.ictGrade);

  const profileRows = [
    { label: "Full name", value: data.displayName },
    { label: "Login email", value: data.email },
    { label: "Username", value: portalUsername },
    ...(data.indexNumber ? [{ label: "Index number", value: data.indexNumber }] : []),
    ...(data.examYear ? [{ label: "A/L exam year", value: data.examYear }] : []),
    ...(ictGradeLabel ? [{ label: "ICT program", value: ictGradeLabel }] : []),
    { label: "Enrolled course", value: data.courseName },
  ];

  const securityNote = data.selfRegistered
    ? "You chose this password during registration. If you forget it, contact ICTF support to reset your account."
    : "This is a temporary password. Please change it after your first login for security.";

  const steps = [
    "Save your Student ID and password in a safe place.",
    "Click Login now to open the ICTF Student Portal.",
    "Explore your dashboard, classes, materials, and results.",
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello <strong>${escapeHtml(data.displayName)}</strong>,</p>
    <p style="margin:0 0 8px;">Welcome to <strong>${escapeHtml(BRAND.fullName)} (${escapeHtml(BRAND.name)})</strong>. Your student account has been created successfully.</p>
    <p style="margin:0 0 4px;font-size:14px;color:${BRAND.colors.textLight};">Use the credentials below to access the ${escapeHtml(BRAND.platformName)}.</p>

    ${buildStudentCredentialsCard({
      studentId: data.studentId,
      password: data.tempPassword,
      passwordLabel,
    })}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Your account details</p>
    ${buildDetailsTable(profileRows)}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Get started in 3 steps</p>
    ${buildNumberedSteps(steps)}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">What you can do in the portal</p>
    ${buildPortalFeaturesGrid([...PORTAL_FEATURES])}

    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">${escapeHtml(securityNote)}</p>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">Need help? Email <a href="mailto:${escapeHtml(BRAND.contact.email)}" style="color:${BRAND.colors.navy};text-decoration:none;font-weight:600;">${escapeHtml(BRAND.contact.email)}</a> or call ${escapeHtml(BRAND.contact.phone)}.</p>
  `;

  return buildIctfEmailLayout({
    title: "Welcome, new student!",
    subtitle: "Your Student ID and portal access are ready",
    preheader: `Your Student ID is ${data.studentId}. Login now to access the ICTF portal.`,
    bodyHtml,
    cta: {
      label: "Login now",
      href: data.loginUrl,
    },
  });
}

export function buildWelcomeStudentEmailSubject(studentId: string): string {
  return `Welcome to ${BRAND.name} — Student ID ${studentId} & portal login`;
}

export function buildWelcomeStudentEmailText(data: WelcomeStudentEmailData): string {
  const lines = [
    `Hello ${data.displayName},`,
    "",
    `Welcome to ${BRAND.fullName} (${BRAND.name}). Your student account is ready.`,
    "",
    "YOUR LOGIN CREDENTIALS",
    `Student ID: ${data.studentId}`,
    `Password: ${data.tempPassword}`,
    `Login email: ${data.email}`,
    ...(data.username ? [`Username: ${data.username}`] : []),
    ...(data.indexNumber ? [`Index number: ${data.indexNumber}`] : []),
    `Course: ${data.courseName}`,
    "",
    `Login now: ${data.loginUrl}`,
    "",
    "Portal features:",
    ...PORTAL_FEATURES.map((feature) => `- ${feature.title}: ${feature.description}`),
    "",
    `Support: ${BRAND.contact.email} · ${BRAND.contact.phone}`,
  ];

  return lines.join("\n");
}
