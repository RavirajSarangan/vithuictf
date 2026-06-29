import { BRAND } from "@/lib/constants";
import { escapeHtml } from "@/lib/email/escape";

const NAVY = BRAND.colors.navy;
const NAVY_DARK = BRAND.colors.navyDark;
const ACCENT = BRAND.colors.accent;
const TEXT = BRAND.colors.textDark;
const MUTED = BRAND.colors.textLight;

export type EmailCta = {
  label: string;
  href: string;
};

export type IctfEmailLayoutOptions = {
  title: string;
  subtitle?: string;
  preheader?: string;
  bodyHtml: string;
  cta?: EmailCta;
};

export function buildIctfEmailLayout({
  title,
  subtitle,
  preheader,
  bodyHtml,
  cta,
}: IctfEmailLayoutOptions): string {
  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div>`
    : "";

  const subtitleHtml = subtitle
    ? `<p style="margin:10px 0 0;font-size:15px;line-height:1.5;color:rgba(255,255,255,0.82);">${escapeHtml(subtitle)}</p>`
    : "";

  const ctaHtml = cta
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 8px;">
        <tr>
          <td style="border-radius:999px;background:${ACCENT};">
            <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:700;color:${NAVY_DARK};text-decoration:none;border-radius:999px;">${escapeHtml(cta.label)}</a>
          </td>
        </tr>
      </table>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6fb;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:${TEXT};">
  ${preheaderHtml}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6fb;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e8edf5;border-radius:18px;overflow:hidden;box-shadow:0 18px 50px -28px rgba(39,52,97,0.35);">
          <tr>
            <td style="background:linear-gradient(135deg,${NAVY} 0%,${NAVY_DARK} 100%);padding:28px 28px 24px;">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:${ACCENT};">${escapeHtml(BRAND.name)} · ${escapeHtml(BRAND.fullName)}</p>
              <h1 style="margin:0;font-size:24px;line-height:1.25;font-weight:800;color:#ffffff;">${escapeHtml(title)}</h1>
              ${subtitleHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:28px;font-size:15px;line-height:1.7;color:${TEXT};">
              ${bodyHtml}
              ${ctaHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:0 28px 28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e8edf5;">
                <tr>
                  <td style="padding-top:18px;font-size:12px;line-height:1.6;color:${MUTED};">
                    <strong style="color:${NAVY};">${escapeHtml(BRAND.legalName)}</strong><br />
                    ${escapeHtml(BRAND.contact.address)}<br />
                    <a href="mailto:${escapeHtml(BRAND.contact.email)}" style="color:${NAVY};text-decoration:none;">${escapeHtml(BRAND.contact.email)}</a>
                    · ${escapeHtml(BRAND.contact.phone)}<br />
                    <a href="https://ictf.lk" style="color:${NAVY};text-decoration:none;">ictf.lk</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;line-height:1.5;color:#94a3b8;max-width:600px;">
          You received this email from ${escapeHtml(BRAND.platformName)}. Please do not reply to automated messages unless a reply address is provided.
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildDetailsTable(rows: Array<{ label: string; value: string }>): string {
  const rowHtml = rows
    .map(
      ({ label, value }) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #eef2f7;color:${MUTED};font-size:14px;width:38%;vertical-align:top;">${escapeHtml(label)}</td>
        <td style="padding:10px 0;border-bottom:1px solid #eef2f7;color:${TEXT};font-size:14px;font-weight:600;vertical-align:top;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;border-collapse:collapse;">${rowHtml}</table>`;
}

export function buildMessageBox(message: string): string {
  return `<div style="margin:16px 0 0;padding:16px 18px;border:1px solid #e8edf5;border-radius:12px;background:#f8fafc;color:${TEXT};font-size:14px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(message)}</div>`;
}

export function buildStudentCredentialsCard(options: {
  studentId: string;
  password?: string;
  passwordLabel?: string;
  passwordReminder?: string;
}): string {
  const passwordLabel = options.passwordLabel ?? "Portal password";
  const passwordContent = options.password?.trim()
    ? escapeHtml(options.password)
    : options.passwordReminder
      ? escapeHtml(options.passwordReminder)
      : "";

  const passwordRow = passwordContent
    ? `<tr>
            <td style="padding:12px 0 0;border-top:1px solid #f1e4c8;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${MUTED};">${escapeHtml(passwordLabel)}</p>
              <p style="margin:0;font-size:18px;line-height:1.35;font-weight:800;color:${NAVY_DARK};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${passwordContent}</p>
            </td>
          </tr>`
    : "";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;border-collapse:separate;border-spacing:0;">
    <tr>
      <td style="padding:20px 22px;border:2px solid ${ACCENT};border-radius:16px;background:linear-gradient(180deg,#fff9ed 0%,#ffffff 100%);">
        <p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${NAVY};">Your login credentials</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 12px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${MUTED};">Student ID</p>
              <p style="margin:0;font-size:20px;line-height:1.3;font-weight:800;letter-spacing:0.04em;color:${NAVY};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(options.studentId)}</p>
            </td>
          </tr>
          ${passwordRow}
        </table>
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">Keep these details safe. You will need them every time you sign in.</p>
      </td>
    </tr>
  </table>`;
}

export function buildStaffCredentialsCard(options: {
  staffUsername: string;
  email: string;
  password: string;
  passwordLabel?: string;
}): string {
  const passwordLabel = options.passwordLabel ?? "Account password";

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 8px;border-collapse:separate;border-spacing:0;">
    <tr>
      <td style="padding:20px 22px;border:2px solid ${ACCENT};border-radius:16px;background:linear-gradient(180deg,#fff9ed 0%,#ffffff 100%);">
        <p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:${NAVY};">Your login credentials</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 0 12px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${MUTED};">Staff username</p>
              <p style="margin:0;font-size:18px;line-height:1.3;font-weight:800;color:${NAVY};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(options.staffUsername)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;border-top:1px solid #f1e4c8;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${MUTED};">Login email</p>
              <p style="margin:0;font-size:15px;line-height:1.4;font-weight:700;color:${NAVY};">${escapeHtml(options.email)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0 0;border-top:1px solid #f1e4c8;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:${MUTED};">${escapeHtml(passwordLabel)}</p>
              <p style="margin:0;font-size:18px;line-height:1.35;font-weight:800;color:${NAVY_DARK};font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;">${escapeHtml(options.password)}</p>
            </td>
          </tr>
        </table>
        <p style="margin:14px 0 0;font-size:12px;line-height:1.6;color:${MUTED};">Use staff username, email, and this password on the staff login page.</p>
      </td>
    </tr>
  </table>`;
}

export function buildPortalFeaturesGrid(
  features: Array<{ title: string; description: string }>
): string {
  const items = features
    .map(
      (feature) => `<tr>
        <td style="padding:0 0 12px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e8edf5;border-radius:12px;background:#f8fafc;">
            <tr>
              <td style="padding:14px 16px;">
                <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${NAVY};">${escapeHtml(feature.title)}</p>
                <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};">${escapeHtml(feature.description)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:8px 0 0;">${items}</table>`;
}

export function buildNumberedSteps(steps: string[]): string {
  const items = steps
    .map(
      (step, index) => `<tr>
        <td style="padding:0 0 10px;vertical-align:top;width:28px;">
          <span style="display:inline-block;width:22px;height:22px;border-radius:999px;background:${NAVY};color:#ffffff;font-size:12px;font-weight:700;line-height:22px;text-align:center;">${index + 1}</span>
        </td>
        <td style="padding:0 0 10px 10px;font-size:14px;line-height:1.6;color:${TEXT};">${escapeHtml(step)}</td>
      </tr>`
    )
    .join("");

  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 0;">${items}</table>`;
}
