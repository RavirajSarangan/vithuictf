"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail, MapPin, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { BRAND } from "@/lib/constants";
import { BrandLogo } from "@/components/shared/brand-logo";
import { LanguageToggle } from "@/components/landing/language-toggle";
import { SecurityComplianceBadges } from "@/components/shared/security-compliance-badges";
import { MarketingFooterJaffnaStrip } from "@/components/landing/marketing-footer-jaffna-strip";
import { FooterIctMarquee } from "@/components/landing/marketing-footer-ict-marquee";
import { FooterTechDecor } from "@/components/landing/marketing-footer-tech-decor";
import { socialIcons } from "@/components/shared/social-icons";
import { resolveMarketingHref } from "@/lib/marketing-nav";
import { handleMarketingSectionClick } from "@/lib/marketing-scroll";
import { PORTAL_ACCESS } from "@/lib/portal-access";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { cn } from "@/lib/utils";

const FOOTER_PORTAL_COMING_SOON = {
  "Parent Portal": {
    href: "/coming-soon/parent",
    enabled: !PORTAL_ACCESS.parent,
  },
  "Teacher Portal": {
    href: "/coming-soon/teacher",
    enabled: !PORTAL_ACCESS.teacher,
  },
} as const;

const SOCIAL_LINKS = Object.entries(BRAND.contact.social).filter(
  ([name]) => name !== "whatsappChannel" && name !== "whatsapp"
);

const EASE = [0.22, 1, 0.36, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: EASE },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

function FooterComingSoonBadge({ label }: { label: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.span
      className="ml-2 inline-flex shrink-0 rounded-full bg-icvf-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-icvf-accent"
      animate={reduceMotion ? undefined : { opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
    >
      {label}
    </motion.span>
  );
}

function FooterColumnTitle({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <div>
      <h4 className="text-[0.6875rem] font-bold uppercase tracking-[0.24em] text-icvf-accent">
        {children}
      </h4>
      <motion.span
        className="mt-2.5 block h-0.5 rounded-full bg-gradient-to-r from-icvf-accent to-icvf-accent/20"
        initial={reduceMotion ? false : { width: 0, opacity: 0 }}
        whileInView={{ width: 36, opacity: 1 }}
        viewport={{ once: true, amount: 0.5 }}
        transition={{ duration: 0.5, ease: EASE }}
      />
    </div>
  );
}

function FooterLink({
  href,
  label,
  pathname,
}: {
  href: string;
  label: string;
  pathname: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.a
      href={resolveMarketingHref(href, pathname)}
      className="group inline-flex items-center gap-2 text-sm text-white/60 transition-colors hover:text-white"
      onClick={(event) => handleMarketingSectionClick(event, href, pathname)}
      whileHover={reduceMotion ? undefined : { x: 3 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      <span
        className="size-1 shrink-0 rounded-full bg-icvf-accent/0 transition-colors group-hover:bg-icvf-accent"
        aria-hidden
      />
      {label}
    </motion.a>
  );
}

function FooterContactItem({
  href,
  icon: Icon,
  label,
  value,
}: {
  href?: string;
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  const reduceMotion = useReducedMotion();

  const content = (
    <>
      <motion.span
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.06] text-icvf-accent"
        whileHover={reduceMotion ? undefined : { scale: 1.05 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
      >
        <Icon className="size-3.5" strokeWidth={1.75} aria-hidden />
      </motion.span>
      <span className="min-w-0">
        <span className="block text-[0.6875rem] font-semibold uppercase tracking-wide text-white/40">
          {label}
        </span>
        <span className="mt-0.5 block text-sm leading-snug text-white/75">{value}</span>
      </span>
    </>
  );

  const className =
    "flex items-start gap-3 rounded-xl border border-transparent p-1 transition-colors hover:border-white/8 hover:bg-white/[0.03]";

  if (href) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
}

export function MarketingFooter() {
  const pathname = usePathname();
  const { t } = useMarketingText();
  const reduceMotion = useReducedMotion();
  const comingSoonLabel = t("auth.comingSoon");

  return (
    <footer className="marketing-footer-shell relative overflow-hidden border-t border-white/10 text-white">
      <FooterTechDecor />
      <div className="marketing-footer-accent-bar relative z-10" aria-hidden />
      <div
        className="marketing-footer-glow-orb pointer-events-none absolute -left-12 top-20 z-0 size-48 rounded-full bg-icvf-accent/10 blur-3xl motion-reduce:hidden"
        aria-hidden
      />
      <div
        className="marketing-footer-glow-orb pointer-events-none absolute -right-8 top-32 z-0 size-40 rounded-full bg-white/5 blur-3xl motion-reduce:hidden"
        style={{ animationDelay: "2s" }}
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:py-20">
        <motion.div
          className="grid gap-10 md:grid-cols-2 lg:grid-cols-4"
          initial={reduceMotion ? false : "hidden"}
          whileInView="visible"
          viewport={{ once: true, amount: 0.08 }}
          variants={stagger}
        >
          <motion.div
            className="marketing-footer-brand flex flex-col items-start"
            variants={fadeUp}
          >
            <motion.div
              className="self-start"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, ease: EASE }}
            >
              <BrandLogo size="footer" light priority />
            </motion.div>
            <p className="mt-4 text-base font-semibold tracking-tight text-white">
              {BRAND.name}{" "}
              <span className="font-medium text-white/55">— {BRAND.fullName}</span>
            </p>
            <motion.p
              className="mt-1 text-sm text-icvf-accent/90"
              animate={reduceMotion ? undefined : { opacity: [0.82, 1, 0.82] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
            >
              {BRAND.tagline}
            </motion.p>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              {t("footer.description")}
            </p>

            <motion.div
              className="mt-5 w-full space-y-2.5"
              variants={stagger}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
            >
              <motion.div variants={fadeUp}>
                <FooterContactItem
                  href={`mailto:${BRAND.contact.email}`}
                  icon={Mail}
                  label={t("contact.email")}
                  value={BRAND.contact.email}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <FooterContactItem
                  href={`tel:${BRAND.contact.phone}`}
                  icon={Phone}
                  label={t("contact.phone")}
                  value={BRAND.contact.phone}
                />
              </motion.div>
              <motion.div variants={fadeUp}>
                <FooterContactItem
                  icon={MapPin}
                  label={t("contact.location")}
                  value={BRAND.contact.address}
                />
              </motion.div>
            </motion.div>

            <motion.div
              className="mt-5 flex flex-wrap items-center gap-2"
              variants={stagger}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
            >
              {SOCIAL_LINKS.map(([name, url]) => {
                const Icon = socialIcons[name as keyof typeof socialIcons];
                if (!Icon) return null;
                return (
                  <motion.a
                    key={name}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={name}
                    className="flex size-9 items-center justify-center rounded-full border border-white/12 bg-white/[0.05] text-white/70 transition-colors hover:border-icvf-accent/45 hover:bg-icvf-accent/12 hover:text-icvf-accent"
                    variants={fadeUp}
                    whileHover={reduceMotion ? undefined : { y: -3, scale: 1.05 }}
                    whileTap={reduceMotion ? undefined : { scale: 0.96 }}
                  >
                    <Icon className="size-4" />
                  </motion.a>
                );
              })}
            </motion.div>
          </motion.div>

          {[
            { title: t("footer.quickLinks"), links: BRAND.footerLinks.quick },
            { title: t("footer.programs"), links: BRAND.footerLinks.courses },
          ].map((column) => (
            <motion.div key={column.title} variants={fadeUp}>
              <FooterColumnTitle>{column.title}</FooterColumnTitle>
              <motion.ul
                className="mt-4 space-y-2.5"
                variants={stagger}
                initial={reduceMotion ? false : "hidden"}
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
              >
                {column.links.map((link) => (
                  <motion.li key={link.label} variants={fadeUp}>
                    <FooterLink href={link.href} label={link.label} pathname={pathname} />
                  </motion.li>
                ))}
              </motion.ul>
            </motion.div>
          ))}

          <motion.div variants={fadeUp}>
            <FooterColumnTitle>{t("footer.portal")}</FooterColumnTitle>
            <motion.ul
              className="mt-4 space-y-2.5"
              variants={stagger}
              initial={reduceMotion ? false : "hidden"}
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
            >
              {BRAND.footerLinks.portal.map((link) => {
                const comingSoon =
                  FOOTER_PORTAL_COMING_SOON[link.label as keyof typeof FOOTER_PORTAL_COMING_SOON];
                const href = comingSoon?.enabled ? comingSoon.href : link.href;

                if (link.href.startsWith("#") || link.href.includes("#")) {
                  return (
                    <motion.li key={link.label} variants={fadeUp}>
                      <FooterLink href={link.href} label={link.label} pathname={pathname} />
                    </motion.li>
                  );
                }

                return (
                  <motion.li key={link.label} variants={fadeUp}>
                    <Link
                      href={href}
                      className={cn(
                        "group inline-flex flex-wrap items-center gap-x-1 text-sm text-white/60 transition-colors hover:text-white"
                      )}
                    >
                      <span
                        className="size-1 shrink-0 rounded-full bg-icvf-accent/0 transition-colors group-hover:bg-icvf-accent"
                        aria-hidden
                      />
                      {link.label}
                      {comingSoon?.enabled ? (
                        <FooterComingSoonBadge label={comingSoonLabel} />
                      ) : null}
                    </Link>
                  </motion.li>
                );
              })}
            </motion.ul>
          </motion.div>
        </motion.div>

        <FooterIctMarquee />

        <motion.div
          className="mt-10"
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.45, ease: EASE }}
        >
          <SecurityComplianceBadges variant="marketing" className="w-full max-w-full" />
        </motion.div>

        <motion.div
          className="mt-10 flex flex-col items-center gap-3 border-t border-white/10 pt-8 md:flex-row md:justify-between"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.08 }}
        >
          <p className="text-center text-sm text-white/40 md:text-left">
            &copy; {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <LanguageToggle />
          </div>
        </motion.div>
      </div>

      <MarketingFooterJaffnaStrip />
    </footer>
  );
}
