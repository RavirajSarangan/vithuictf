import { RiWhatsappFill } from "@remixicon/react";

/** Builds a direct click-to-chat wa.me link from any phone number format. */
function buildWhatsAppChatUrl(phoneNumber: string): string {
  const digitsOnly = phoneNumber.replace(/[^0-9]/g, "");
  return `https://wa.me/${digitsOnly}`;
}

export function WhatsAppFloatButton({ phoneNumber }: { phoneNumber: string }) {
  return (
    <a
      href={buildWhatsAppChatUrl(phoneNumber)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with ICTF Institute on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg ring-2 ring-white/40 transition-transform hover:scale-105 hover:bg-[#20BD5A] sm:bottom-6 sm:right-6"
    >
      <RiWhatsappFill className="size-7" />
    </a>
  );
}
