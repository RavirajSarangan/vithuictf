"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapStudent } from "@/lib/supabase/mappers";
import { sendProfilePhotoWhatsApp } from "@/lib/actions/whatsapp";
import { getAppUrl } from "@/lib/email/resend";
import { normalizeSriLankaWhatsApp } from "@/lib/validation/sri-lanka-phone";
import type { FlipCardData, StudentSocialLinks } from "@/types";

async function requireStudentUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

function normalizeSocialLinks(links: StudentSocialLinks): StudentSocialLinks {
  const normalized: StudentSocialLinks = {};
  for (const key of ["linkedin", "github", "twitter", "whatsapp"] as const) {
    const value = links[key]?.trim();
    if (value) normalized[key] = value;
  }
  return normalized;
}

export async function uploadStudentPhoto(formData: FormData): Promise<string> {
  const userId = await requireStudentUserId();
  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("No file provided");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files are allowed");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be under 5MB");
  }

  const { prepareRasterImageUpload } = await import("@/lib/images/process-raster-upload");
  const { buffer, contentType, ext } = await prepareRasterImageUpload(file, "avatar");
  const path = `${userId}/${Date.now()}.${ext}`;

  const supabase = await createClient();
  const { error: uploadError } = await supabase.storage.from("avatars").upload(
    path,
    Uint8Array.from(buffer),
    {
      contentType,
      upsert: true,
    }
  );

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const photoUrl = data.publicUrl;

  const { error: updateError } = await supabase
    .from("students")
    .update({ photo_url: photoUrl })
    .eq("user_id", userId);

  if (updateError) throw new Error(updateError.message);

  const { data: studentRow } = await supabase
    .from("students")
    .select("display_name, student_id, phone")
    .eq("user_id", userId)
    .maybeSingle();

  if (studentRow?.phone) {
    const normalizedPhone = normalizeSriLankaWhatsApp(studentRow.phone);
    if (normalizedPhone) {
      const cardUrl = `${getAppUrl()}/card/${studentRow.student_id}`;
      const whatsappResult = await sendProfilePhotoWhatsApp({
        phone: normalizedPhone,
        displayName: studentRow.display_name,
        cardUrl,
      });
      if (!whatsappResult.whatsappSent) {
        console.warn("[whatsapp] Profile photo confirmation not sent:", whatsappResult.error);
      }
    }
  }

  revalidatePath("/profile-card");
  revalidatePath("/dashboard");
  return photoUrl;
}

export async function updateStudentProfileCard(data: {
  bio: string;
  socialLinks: StudentSocialLinks;
  cardPublic: boolean;
}) {
  const userId = await requireStudentUserId();
  const supabase = await createClient();

  const { error } = await supabase
    .from("students")
    .update({
      bio: data.bio.trim().slice(0, 280),
      social_links: normalizeSocialLinks(data.socialLinks),
      card_public: data.cardPublic,
    })
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  revalidatePath("/profile-card");
  return { ok: true as const };
}

export async function getPublicStudentCard(studentId: string): Promise<FlipCardData | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("*")
    .eq("student_id", studentId)
    .eq("card_public", true)
    .maybeSingle();

  if (error || !data) return null;

  const student = mapStudent(data);
  const cardUsername = student.username ?? student.studentId;
  return {
    name: student.displayName,
    username: cardUsername,
    image: student.photoURL,
    courseName: student.courseName,
    bio: student.bio ?? "",
    stats: {
      points: student.points,
      rank: student.rank,
      streak: student.streak,
    },
    socialLinks: student.socialLinks,
  };
}
