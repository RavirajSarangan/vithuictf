"use client";

import { useState } from "react";
import { sendResendTestEmail } from "@/lib/actions/email";
import { GlassCard } from "@/components/shared/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { toast } from "sonner";

export function AdminEmailTestPanel() {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    const target = email.trim();
    if (!target.includes("@")) {
      toast.error("Enter a valid email address");
      return;
    }

    setSending(true);
    try {
      const result = await sendResendTestEmail(target);
      if (result.emailSent) {
        toast.success(`Test email sent to ${target}`);
      } else {
        toast.error(result.error ?? "Failed to send test email");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <GlassCard className="max-w-xl border-white/10 bg-white/5 p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Mail className="size-5 text-icvf-accent" aria-hidden />
            <h3 className="text-lg font-semibold">Resend email test</h3>
          </div>
          <p className="text-sm text-white/60">
            Send a branded welcome-style test after verifying <code className="text-white/80">ictf.lk</code> in
            Resend and setting environment variables.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 border-white/20 text-white/80">
          Resend
        </Badge>
      </div>

      <div className="mt-6 space-y-2">
        <Label htmlFor="resend-test-email" className="text-white">
          Send test to
        </Label>
        <Input
          id="resend-test-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border-white/10 bg-black/20 text-white placeholder:text-white/40"
        />
      </div>

      <Button
        className="mt-6 bg-icvf-accent text-icvf-navy hover:bg-icvf-accent/90"
        onClick={onSend}
        disabled={sending}
      >
        {sending ? (
          <>
            <Loader2 className="mr-2 size-4 animate-spin" />
            Sending…
          </>
        ) : (
          "Send test email"
        )}
      </Button>
    </GlassCard>
  );
}
