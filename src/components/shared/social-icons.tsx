import {
  RiFacebookFill,
  RiInstagramFill,
  RiLinkedinFill,
  RiWhatsappFill,
  RiYoutubeFill,
} from "@remixicon/react";
import { MessageCircle, Send } from "lucide-react";

export const socialIcons = {
  facebook: RiFacebookFill,
  instagram: RiInstagramFill,
  youtube: RiYoutubeFill,
  linkedin: RiLinkedinFill,
  telegram: Send,
  whatsappChannel: MessageCircle,
  whatsapp: RiWhatsappFill,
  tiktok: TikTokIcon,
} as const;

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z" />
    </svg>
  );
}

export type SocialIconKey = keyof typeof socialIcons;
