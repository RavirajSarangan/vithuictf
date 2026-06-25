"use server";

import { createClient } from "@/lib/supabase/server";
import { sendContactInquiryNotification } from "@/lib/actions/email";

export type ContactInquiryState = {
  success: boolean;
  message: string;
};

export async function submitContactInquiry(
  _prev: ContactInquiryState | null,
  formData: FormData
): Promise<ContactInquiryState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en").trim() || "en";

  if (name.length < 2) {
    return { success: false, message: "Please enter your name." };
  }
  if (!email.includes("@")) {
    return { success: false, message: "Please enter a valid email address." };
  }
  if (message.length < 10) {
    return { success: false, message: "Use at least 10 characters." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("contact_inquiries").insert({
    name,
    email,
    phone: phone || null,
    message,
    locale,
    status: "new",
  });

  if (error) {
    console.error("contact_inquiry insert failed:", error.message);
    return { success: false, message: "Could not send your message. Please try again later." };
  }

  await sendContactInquiryNotification({ name, email, phone, message }).catch((err) => {
    console.error("contact inquiry email failed:", err);
  });

  return { success: true, message: "Thank you! We will get back to you soon." };
}
