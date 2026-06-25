"use client";

import { MarketingPanel, MarketingSection, MarketingSectionIntro } from "@/components/landing/marketing-layout";
import { BRAND } from "@/lib/constants";
import { Mail, Phone, MapPin } from "lucide-react";
import { socialIcons } from "@/components/shared/social-icons";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { ContactInquiryForm } from "@/components/landing/contact-inquiry-form";
import { LazyMapEmbed } from "@/components/landing/lazy-map-embed";

export function ContactSection() {
  const { t } = useMarketingText();

  const contactCards = [
    {
      href: `mailto:${BRAND.contact.email}`,
      icon: Mail,
      iconClass: "text-icvf-accent",
      title: t("contact.email"),
      value: BRAND.contact.email,
    },
    {
      href: `tel:${BRAND.contact.phone}`,
      icon: Phone,
      iconClass: "text-icvf-navy",
      title: t("contact.phone"),
      value: BRAND.contact.phone,
    },
    {
      href: undefined,
      icon: MapPin,
      iconClass: "text-icvf-accent",
      title: t("contact.location"),
      value: BRAND.contact.address,
    },
  ];

  return (
    <MarketingSection id="contact" tone="light">
      <MarketingSectionIntro
        badge={t("contact.badge")}
        title={t("contact.title")}
        accent={t("contact.accent")}
        subtitle={t("contact.subtitle")}
        light={false}
        badgeVariant="accent"
      />
      <p className="-mt-10 mb-10 text-sm text-icvf-text-light">{t("contact.registrationNote")}</p>

      <div className="grid gap-8 lg:grid-cols-2 lg:gap-10">
        <div className="flex flex-col gap-4">
          {contactCards.map((card) => {
            const Icon = card.icon;
            const inner = (
              <MarketingPanel className="flex h-full items-center gap-4">
                <Icon className={`size-8 shrink-0 ${card.iconClass}`} />
                <div>
                  <p className="font-semibold text-icvf-navy">{card.title}</p>
                  <p className="text-sm text-icvf-text-light">{card.value}</p>
                </div>
              </MarketingPanel>
            );
            return card.href ? (
              <a key={card.title} href={card.href} target="_blank" rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <div key={card.title}>{inner}</div>
            );
          })}

          <MarketingPanel className="overflow-hidden p-0">
            <LazyMapEmbed
              src={BRAND.contact.mapEmbed}
              title={`${BRAND.name} Location`}
            />
          </MarketingPanel>

          <div className="flex flex-wrap gap-3">
            {Object.entries(BRAND.contact.social)
              .filter(([name]) => name !== "whatsappChannel" && name !== "whatsapp")
              .map(([name, url]) => {
                const Icon = socialIcons[name as keyof typeof socialIcons];
                if (!Icon) return null;
                return (
                  <a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="flex size-11 items-center justify-center rounded-full border border-icvf-border bg-white text-icvf-navy shadow-sm transition-colors hover:border-icvf-accent/40 hover:text-icvf-accent"
                  >
                    <Icon className="size-5" />
                  </a>
                );
              })}
          </div>
        </div>

        <ContactInquiryForm />
      </div>
    </MarketingSection>
  );
}
