"use server";

import { createClient } from "@/lib/supabase/server";
import { sendContactInquiryNotification } from "@/lib/actions/email";
import { contactInquirySchema } from "@/lib/validation/contact-inquiry";
import { assertRateLimit } from "@/lib/security/rate-limit";
import { getRequestClientKey } from "@/lib/security/request-client-key";

export type ContactInquiryState = {
  success: boolean;
  message: string;
};

export async function submitContactInquiry(
  _prev: ContactInquiryState | null,
  formData: FormData
): Promise<ContactInquiryState> {
  const parsed = contactInquirySchema.safeParse({
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    message: String(formData.get("message") ?? ""),
    locale: String(formData.get("locale") ?? "en"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Invalid form data.",
    };
  }

  const { name, email, phone, message, locale } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  try {
    const ipKey = await getRequestClientKey();
    await assertRateLimit(`contact:ip:${ipKey}`, 5, 60 * 60);
    await assertRateLimit(`contact:email:${normalizedEmail}`, 5, 60 * 60);
  } catch (err) {
    const rateMessage =
      err instanceof Error ? err.message : "Too many messages. Please try again later.";
    return { success: false, message: rateMessage };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email: normalizedEmail,
    phone: phone || null,
    message,
    locale,
    status: "new",
  });

  if (error) {
    console.error("contact_inquiry insert failed:", error.message);
    return { success: false, message: "Could not send your message. Please try again later." };
  }

  await sendContactInquiryNotification({ name, email: normalizedEmail, phone: phone ?? "", message }).catch(
    (err) => {
      console.error("contact inquiry email failed:", err);
    }
  );

  return { success: true, message: "Thank you! We will get back to you soon." };
}
