import { RiWhatsappFill } from "@remixicon/react";
import { BRAND } from "@/lib/constants";

export function WhatsAppFloatButton() {
  return (
    <a
      href={BRAND.contact.social.whatsappChannel}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Follow ICTF Institute on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-icvf-navy-dark text-icvf-accent shadow-lg ring-2 ring-icvf-accent/40 transition-transform hover:scale-105 hover:bg-icvf-navy sm:bottom-6 sm:right-6"
    >
      <RiWhatsappFill className="size-7" />
    </a>
  );
}
