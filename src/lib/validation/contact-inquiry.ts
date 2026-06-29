import { z } from "zod";

export const contactInquirySchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(100),
  email: z.string().trim().email("Please enter a valid email address.").max(254),
  phone: z
    .string()
    .trim()
    .max(20)
    .transform((value) => value || undefined)
    .optional(),
  message: z.string().trim().min(10, "Use at least 10 characters.").max(2000),
  locale: z.string().trim().min(2).max(5).default("en"),
});

export type ContactInquiryInput = z.infer<typeof contactInquirySchema>;
