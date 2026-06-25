"use client";

import { useActionState } from "react";
import { submitContactInquiry, type ContactInquiryState } from "@/lib/actions/contact";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MarketingPanel } from "@/components/landing/marketing-layout";
import { cn } from "@/lib/utils";

const initialState: ContactInquiryState = { success: false, message: "" };

export function ContactInquiryForm() {
  const { t, locale } = useMarketingText();
  const [state, formAction, pending] = useActionState(submitContactInquiry, initialState);
  const formKey = state.success ? state.message : "draft";

  return (
    <MarketingPanel>
      <h3 className="text-lg font-semibold text-icvf-navy">{t("contact.formTitle")}</h3>
      <p className="mt-1 text-sm text-icvf-text-light">{t("contact.formSubtitle")}</p>

      <form key={formKey} action={formAction} className="mt-6 space-y-4">
        <input type="hidden" name="locale" value={locale} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="contact-name">{t("contact.formName")}</Label>
            <Input id="contact-name" name="name" required minLength={2} placeholder={t("contact.formName")} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contact-email">{t("contact.formEmail")}</Label>
            <Input
              id="contact-email"
              name="email"
              type="email"
              required
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-phone">{t("contact.formPhone")}</Label>
          <Input id="contact-phone" name="phone" type="tel" placeholder="+94 77 000 0000" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact-message">{t("contact.formMessage")}</Label>
          <Textarea
            id="contact-message"
            name="message"
            required
            minLength={10}
            rows={4}
            placeholder={t("contact.formMessagePlaceholder")}
          />
        </div>

        {state.message ? (
          <p
            className={cn(
              "text-sm",
              state.success ? "text-icvf-success" : "text-icvf-danger"
            )}
            role="status"
          >
            {state.message}
          </p>
        ) : null}

        <Button type="submit" variant="icvf" disabled={pending} className="w-full sm:w-auto">
          {pending ? t("contact.formSending") : t("contact.formSubmit")}
        </Button>
      </form>
    </MarketingPanel>
  );
}
