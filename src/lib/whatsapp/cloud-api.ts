import { getWhatsAppConfig } from "@/lib/whatsapp/config";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";

export type WhatsAppTemplateComponent = {
  type: "body" | "button";
  sub_type?: "url" | "quick_reply";
  index?: string;
  parameters: Array<{ type: "text"; text: string }>;
};

export type SendWhatsAppTemplateInput = {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: WhatsAppTemplateComponent[];
};

export type SendWhatsAppResult = {
  whatsappSent: boolean;
  messageId?: string;
  error?: string;
};

function toMetaRecipient(phone: string): string | null {
  const normalized = normalizeSriLankaWhatsApp(phone);
  if (!normalized) return null;
  return normalized.replace(/^\+/, "");
}

export async function sendWhatsAppTemplate(
  input: SendWhatsAppTemplateInput
): Promise<SendWhatsAppResult> {
  const config = getWhatsAppConfig();
  if (!config) {
    console.info("[whatsapp] Not configured. Skipping template:", input.templateName);
    return { whatsappSent: false, error: "WhatsApp not configured" };
  }

  const recipient = toMetaRecipient(input.to);
  if (!recipient) {
    return { whatsappSent: false, error: "Invalid WhatsApp number" };
  }

  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`;

  const body = {
    messaging_product: "whatsapp",
    to: recipient,
    type: "template",
    template: {
      name: input.templateName,
      language: { code: input.languageCode ?? "en" },
      ...(input.components?.length ? { components: input.components } : {}),
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const payload = (await response.json()) as {
      messages?: Array<{ id: string }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      const detail = payload.error?.message ?? `HTTP ${response.status}`;
      console.error("[whatsapp] Send failed:", detail);
      return { whatsappSent: false, error: detail };
    }

    return {
      whatsappSent: true,
      messageId: payload.messages?.[0]?.id,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "WhatsApp request failed";
    console.error("[whatsapp] Send error:", detail);
    return { whatsappSent: false, error: detail };
  }
}
