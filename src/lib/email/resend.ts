import { Resend } from "resend";
import { BRAND } from "@/lib/constants";

let resendClient: Resend | null = null;

export type ResendConfig = {
  from: string;
  replyTo?: string;
  contactInbox: string;
  appUrl: string;
};

export function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) return null;
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    "https://ictf.lk"
  ).replace(/\/$/, "");
}

export function isResendConfigured(): boolean {
  return Boolean(getResendConfig());
}

export function getResendConfig(): ResendConfig | null {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM_EMAIL?.trim();

  if (!apiKey || !from) return null;

  const replyTo = process.env.RESEND_REPLY_TO_EMAIL?.trim() || BRAND.contact.email;
  const contactInbox = process.env.CONTACT_INBOX_EMAIL?.trim() || BRAND.contact.email;

  return {
    from,
    replyTo,
    contactInbox,
    appUrl: getAppUrl(),
  };
}
