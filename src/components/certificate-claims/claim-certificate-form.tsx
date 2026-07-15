"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getActionErrorMessage } from "@/lib/action-error";
import { claimCertificate } from "@/lib/actions/certificate-claims-public";

interface ClaimCertificateFormProps {
  slug: string;
}

type ClaimSuccess = {
  certificateNumber: string;
  studentName: string;
  courseName: string;
  imageUrl: string | null;
  alreadyIssued: boolean;
};

export function ClaimCertificateForm({ slug }: ClaimCertificateFormProps) {
  const [studentName, setStudentName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ClaimSuccess | null>(null);

  const handleSubmit = async () => {
    if (studentName.trim().length < 2) {
      toast.error("Enter your full name");
      return;
    }
    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }
    setSubmitting(true);
    try {
      const response = await claimCertificate({
        slug,
        studentName: studentName.trim(),
        email: email.trim(),
        website,
      });
      if (!response.ok) throw new Error(response.error);
      setResult(response);
    } catch (e) {
      toast.error(getActionErrorMessage(e, "Failed to generate certificate"));
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col gap-4 text-left">
        <p className="text-sm font-medium text-icvf-success">
          {result.alreadyIssued ? "Here's your certificate — already issued" : "Your certificate is ready"}
        </p>
        {result.imageUrl ? (
          <div className="overflow-hidden rounded-lg border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={result.imageUrl}
              alt={`Certificate for ${result.studentName}`}
              className="w-full object-contain"
            />
          </div>
        ) : null}
        <p className="font-mono text-xs text-icvf-text-light">Certificate ID: {result.certificateNumber}</p>
        <p className="text-xs text-icvf-text-light">We&apos;ve also emailed a copy to you.</p>
        <a
          href={`/verify/${result.certificateNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-icvf-accent hover:underline"
        >
          Verify online
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="space-y-2">
        <Label htmlFor="claim-name">Full name</Label>
        <Input
          id="claim-name"
          value={studentName}
          onChange={(e) => setStudentName(e.target.value)}
          placeholder="Your full name"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="claim-email">Email address</Label>
        <Input
          id="claim-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
        />
      </div>
      <div className="absolute left-[-9999px]" aria-hidden="true">
        <label htmlFor="claim-website">Website</label>
        <input
          id="claim-website"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
        />
      </div>
      <Button disabled={submitting} onClick={() => void handleSubmit()}>
        {submitting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Sparkles className="mr-2 size-4" />}
        Get my certificate
      </Button>
    </div>
  );
}
