import { z } from "zod";

export const resultLookupSchema = z.object({
  /** Absent = general/homepage lookup, not scoped to a course link. */
  slug: z.string().trim().max(64).optional(),
  username: z.string().trim().min(2, "Please enter your username.").max(60),
  studentId: z.string().trim().min(2, "Please enter your student ID.").max(40),
  /** Honeypot — real users never fill this in; any value fails validation. */
  website: z.string().max(0, "Unable to process request.").optional(),
});

export type ResultLookupInput = z.infer<typeof resultLookupSchema>;
