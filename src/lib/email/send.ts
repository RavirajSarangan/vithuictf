import { getResendClient, getResendConfig } from "@/lib/email/resend";
import { htmlToPlainText } from "@/lib/email/escape";

export type SendEmailAttachment = {
  filename: string;
  content: Buffer | string;
  contentType?: string;
};

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string | string[];
  attachments?: SendEmailAttachment[];
};

export type SendEmailResult = {
  emailSent: boolean;
  error?: string;
  id?: string;
};

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const config = getResendConfig();
  if (!config) {
    return { emailSent: false, error: "Email service not configured" };
  }

  const resend = getResendClient();
  if (!resend) {
    return { emailSent: false, error: "Email client unavailable" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text ?? htmlToPlainText(input.html),
      replyTo: input.replyTo ?? config.replyTo,
      attachments: input.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: Buffer.isBuffer(attachment.content)
          ? attachment.content.toString("base64")
          : attachment.content,
        content_type: attachment.contentType,
      })),
    });

    if (error) {
      console.error("[email] Resend error:", error);
      return { emailSent: false, error: error.message };
    }

    return { emailSent: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    console.error("[email] Send failed:", message);
    return { emailSent: false, error: message };
  }
}
