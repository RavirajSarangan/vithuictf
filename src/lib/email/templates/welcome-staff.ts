import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";
import {
  buildDetailsTable,
  buildIctfEmailLayout,
  buildNumberedSteps,
  buildStaffCredentialsCard,
} from "@/lib/email/layout";

export interface WelcomeStaffEmailData {
  displayName: string;
  staffUsername: string;
  email: string;
  password: string;
  loginUrl: string;
  adminSetPassword?: boolean;
  passwordReset?: boolean;
}

const STAFF_PORTAL_FEATURES = [
  {
    title: "Student management",
    description: "View and manage students assigned to your courses.",
  },
  {
    title: "Results & resources",
    description: "Upload results and learning materials for your classes.",
  },
  {
    title: "Calendar",
    description: "See class schedules and institute calendar events.",
  },
] as const;

export function buildWelcomeStaffEmailHtml(data: WelcomeStaffEmailData): string {
  const passwordLabel = data.passwordReset
    ? "New account password"
    : data.adminSetPassword
      ? "Your account password"
      : "Temporary password";

  const securityNote = data.passwordReset
    ? "Your password was reset by an administrator. Use the new password above on your next sign-in."
    : data.adminSetPassword
      ? "Your administrator set this password. Change it after your first login if you prefer a different one."
      : "This is a temporary password. Please change it after your first login for security.";

  const steps = [
    "Save your staff username, email, and password in a safe place.",
    "Open the staff login page using the button below.",
    "Enter all three fields to access the Staff Portal.",
  ];

  const profileRows = [
    { label: "Full name", value: data.displayName },
    { label: "Staff username", value: data.staffUsername },
    { label: "Login email", value: data.email },
    { label: "Staff login URL", value: data.loginUrl },
  ];

  const bodyHtml = `
    <p style="margin:0 0 16px;">Hello <strong>${escapeHtml(data.displayName)}</strong>,</p>
    <p style="margin:0 0 8px;">Your <strong>${escapeHtml(BRAND.name)}</strong> staff portal account is ready.</p>
    <p style="margin:0 0 4px;font-size:14px;color:${BRAND.colors.textLight};">Sign in with your staff username, email, and account password on the private staff login page.</p>

    ${buildStaffCredentialsCard({
      staffUsername: data.staffUsername,
      email: data.email,
      password: data.password,
      passwordLabel,
    })}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Account details</p>
    ${buildDetailsTable(profileRows)}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Sign in</p>
    ${buildNumberedSteps(steps)}

    <p style="margin:24px 0 8px;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND.colors.textLight};">Staff portal</p>
  `;

  const featuresHtml = STAFF_PORTAL_FEATURES.map(
    (feature) =>
      `<p style="margin:0 0 8px;font-size:14px;line-height:1.6;color:${BRAND.colors.textDark};"><strong>${escapeHtml(feature.title)}</strong> — ${escapeHtml(feature.description)}</p>`
  ).join("");

  const closingHtml = `
    ${featuresHtml}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">${escapeHtml(securityNote)}</p>
    <p style="margin:10px 0 0;font-size:14px;line-height:1.6;color:${BRAND.colors.textLight};">Need help? Email <a href="mailto:${escapeHtml(BRAND.contact.email)}" style="color:${BRAND.colors.navy};text-decoration:none;font-weight:600;">${escapeHtml(BRAND.contact.email)}</a>.</p>
  `;

  return buildIctfEmailLayout({
    title: data.passwordReset ? "Your staff password was reset" : "Welcome to the Staff Portal",
    subtitle: "Your staff username and account password are inside",
    preheader: `Staff username: ${data.staffUsername}. Use your account password to sign in.`,
    bodyHtml: bodyHtml + closingHtml,
    cta: {
      label: "Open staff login",
      href: data.loginUrl,
    },
  });
}

export function buildWelcomeStaffEmailSubject(staffUsername: string, passwordReset?: boolean): string {
  if (passwordReset) {
    return `${BRAND.name} staff password reset — ${staffUsername}`;
  }
  return `Welcome to ${BRAND.name} Staff Portal — login for ${staffUsername}`;
}

export function buildWelcomeStaffEmailText(data: WelcomeStaffEmailData): string {
  return [
    `Hello ${data.displayName},`,
    "",
    `Your ${BRAND.name} staff portal account is ready.`,
    "",
    "YOUR LOGIN CREDENTIALS",
    `Staff username: ${data.staffUsername}`,
    `Login email: ${data.email}`,
    `Account password: ${data.password}`,
    "",
    `Staff login: ${data.loginUrl}`,
    "",
    "Sign in with all three: staff username, email, and account password.",
    "",
    `Support: ${BRAND.contact.email}`,
  ].join("\n");
}
