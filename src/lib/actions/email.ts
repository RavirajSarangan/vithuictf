"use server";

import { requireAdmin } from "@/lib/actions/auth";
import { getResendConfig } from "@/lib/email/resend";
import { sendEmail } from "@/lib/email/send";
import {
  buildContactInquiryAdminEmailHtml,
  buildContactInquiryAdminEmailSubject,
} from "@/lib/email/templates/contact-inquiry-admin";
import {
  buildContactInquiryConfirmationEmailHtml,
  buildContactInquiryConfirmationEmailSubject,
} from "@/lib/email/templates/contact-inquiry-confirmation";
import {
  buildRegistrationPendingEmailHtml,
  buildRegistrationPendingEmailSubject,
  buildRegistrationPendingEmailText,
} from "@/lib/email/templates/registration-pending";
import {
  buildWelcomeStudentEmailHtml,
  buildWelcomeStudentEmailSubject,
  buildWelcomeStudentEmailText,
  type WelcomeStudentEmailData,
} from "@/lib/email/templates/welcome-student";
import {
  buildWelcomeStaffEmailHtml,
  buildWelcomeStaffEmailSubject,
  buildWelcomeStaffEmailText,
  type WelcomeStaffEmailData,
} from "@/lib/email/templates/welcome-staff";

export async function sendStudentRegistrationPendingEmail(data: {
  displayName: string;
  studentId: string;
  email: string;
  courseName: string;
}): Promise<{ emailSent: boolean; error?: string }> {
  const config = getResendConfig();

  if (!config) {
    console.info("[email] Resend not configured. Registration pending email for:", data.email);
    return { emailSent: false, error: "Email service not configured" };
  }

  const result = await sendEmail({
    to: data.email,
    subject: buildRegistrationPendingEmailSubject(),
    html: buildRegistrationPendingEmailHtml(data),
    text: buildRegistrationPendingEmailText(data),
    replyTo: config.replyTo,
  });

  return { emailSent: result.emailSent, error: result.error };
}

export async function sendStudentWelcomeEmail(
  data: Omit<WelcomeStudentEmailData, "loginUrl">
): Promise<{ emailSent: boolean; error?: string }> {
  const config = getResendConfig();
  const loginUrl = `${config?.appUrl ?? "https://ictf.lk"}/login`;
  const payload: WelcomeStudentEmailData = { ...data, loginUrl };

  if (!config) {
    console.info("[email] Resend not configured. Welcome email for:", data.email);
    return { emailSent: false, error: "Email service not configured" };
  }

  const result = await sendEmail({
    to: data.email,
    subject: buildWelcomeStudentEmailSubject(data.studentId, {
      registrationApproved: data.registrationApproved,
    }),
    html: buildWelcomeStudentEmailHtml(payload),
    text: buildWelcomeStudentEmailText(payload),
    replyTo: config.replyTo,
  });

  return { emailSent: result.emailSent, error: result.error };
}

export async function sendStaffWelcomeEmail(
  data: Omit<WelcomeStaffEmailData, "loginUrl">
): Promise<{ emailSent: boolean; error?: string }> {
  const config = getResendConfig();
  const loginUrl = `${config?.appUrl ?? "https://www.ictf.lk"}/login/staff`;
  const payload: WelcomeStaffEmailData = { ...data, loginUrl };

  if (!config) {
    console.info("[email] Resend not configured. Staff welcome email for:", data.email);
    return { emailSent: false, error: "Email service not configured" };
  }

  const result = await sendEmail({
    to: data.email,
    subject: buildWelcomeStaffEmailSubject(data.staffUsername, data.passwordReset),
    html: buildWelcomeStaffEmailHtml(payload),
    text: buildWelcomeStaffEmailText(payload),
    replyTo: config.replyTo,
  });

  return { emailSent: result.emailSent, error: result.error };
}

export async function sendContactInquiryNotification(data: {
  name: string;
  email: string;
  phone: string;
  message: string;
}): Promise<{ emailSent: boolean; error?: string }> {
  const config = getResendConfig();
  if (!config) {
    console.info("[email] Contact inquiry (Resend not configured):", data);
    return { emailSent: false, error: "Email service not configured" };
  }

  const submittedAt = new Date().toLocaleString("en-LK", {
    timeZone: "Asia/Colombo",
    dateStyle: "medium",
    timeStyle: "short",
  });

  const adminResult = await sendEmail({
    to: config.contactInbox,
    subject: buildContactInquiryAdminEmailSubject(data.name),
    html: buildContactInquiryAdminEmailHtml({
      ...data,
      phone: data.phone || undefined,
      submittedAt,
    }),
    replyTo: data.email,
  });

  if (!adminResult.emailSent) {
    return adminResult;
  }

  const confirmationResult = await sendEmail({
    to: data.email,
    subject: buildContactInquiryConfirmationEmailSubject(),
    html: buildContactInquiryConfirmationEmailHtml({
      name: data.name,
      message: data.message,
    }),
    replyTo: config.replyTo,
  });

  if (!confirmationResult.emailSent) {
    console.error("[email] Contact confirmation failed:", confirmationResult.error);
  }

  return adminResult;
}

export async function sendResendTestEmail(to: string): Promise<{ emailSent: boolean; error?: string }> {
  await requireAdmin();

  const config = getResendConfig();
  if (!config) {
    return { emailSent: false, error: "Set RESEND_API_KEY and RESEND_FROM_EMAIL in environment variables." };
  }

  return sendEmail({
    to,
    subject: buildWelcomeStudentEmailSubject("ICTF-TEST-001"),
    html: buildWelcomeStudentEmailHtml({
      displayName: "Test Student",
      studentId: "ICTF-TEST-001",
      email: to,
      tempPassword: "ICTF-Demo-2026",
      courseName: "O/L & A/L ICT Program",
      loginUrl: `${config.appUrl}/login`,
      indexNumber: "ICTF-2026-00042",
      selfRegistered: false,
    }),
    text: buildWelcomeStudentEmailText({
      displayName: "Test Student",
      studentId: "ICTF-TEST-001",
      email: to,
      tempPassword: "ICTF-Demo-2026",
      courseName: "O/L & A/L ICT Program",
      loginUrl: `${config.appUrl}/login`,
      indexNumber: "ICTF-2026-00042",
      selfRegistered: false,
    }),
    replyTo: config.replyTo,
  });
}
