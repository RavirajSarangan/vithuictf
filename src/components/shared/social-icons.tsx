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
} as const;

export type SocialIconKey = keyof typeof socialIcons;
