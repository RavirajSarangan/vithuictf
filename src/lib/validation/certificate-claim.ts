import { z } from "zod";

export const certificateClaimSchema = z.object({
  slug: z.string().trim().min(1),
  studentName: z.string().trim().min(2, "Please enter your full name.").max(120),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address.").max(254),
  /** Honeypot — real users never fill this in; any value fails validation. */
  website: z.string().max(0, "Unable to process request.").optional(),
});

export type CertificateClaimInput = z.infer<typeof certificateClaimSchema>;
