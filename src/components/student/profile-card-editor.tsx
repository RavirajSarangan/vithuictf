"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { uploadStudentPhoto, updateStudentProfileCard } from "@/lib/actions/profile-card";
import { GlassCard } from "@/components/shared/glass-card";
import { FlipCard, studentToFlipCardData } from "@/components/student/flip-card";
import { ShareCardButtons } from "@/components/student/share-card-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { BRAND } from "@/lib/constants";
import type { Student, StudentSocialLinks } from "@/types";

interface ProfileCardEditorProps {
  student: Student;
}

export function ProfileCardEditor({ student }: ProfileCardEditorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [photoURL, setPhotoURL] = useState(student.photoURL ?? "");
  const [bio, setBio] = useState(student.bio ?? "");
  const [cardPublic, setCardPublic] = useState(student.cardPublic ?? false);
  const [socialLinks, setSocialLinks] = useState<StudentSocialLinks>({
    linkedin: student.socialLinks?.linkedin ?? "",
    github: student.socialLinks?.github ?? "",
    twitter: student.socialLinks?.twitter ?? "",
    whatsapp: student.socialLinks?.whatsapp ?? "",
  });

  const previewData = studentToFlipCardData({
    displayName: student.displayName,
    studentId: student.studentId,
    username: student.username,
    photoURL: photoURL || undefined,
    courseName: student.courseName,
    bio,
    points: student.points,
    rank: student.rank,
    streak: student.streak,
    socialLinks,
  });

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/card/${student.studentId}`
      : `/card/${student.studentId}`;

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const url = await uploadStudentPhoto(formData);
      setPhotoURL(url);
      toast.success("Photo uploaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateStudentProfileCard({ bio, socialLinks, cardPublic });
      toast.success("Profile card saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const updateSocial = (key: keyof StudentSocialLinks, value: string) => {
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <GlassCard className="bg-white">
        <h2 className="mb-6 text-xl font-semibold text-icvf-text-dark">Edit Profile Card</h2>
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label>Profile Photo</Label>
            <div className="flex items-center gap-4">
              <div className="relative size-20 overflow-hidden rounded-full border-2 border-icvf-navy/20 bg-muted">
                {photoURL ? (
                  <Image src={photoURL} alt="Profile" fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex size-full items-center justify-center text-lg font-semibold text-icvf-navy">
                    {student.displayName.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUpload(file);
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                onClick={() => inputRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Upload Photo"}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="bio">About</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 280))}
              placeholder="Tell others about yourself…"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">{bio.length}/280</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="linkedin">LinkedIn</Label>
              <Input
                id="linkedin"
                value={socialLinks.linkedin ?? ""}
                onChange={(e) => updateSocial("linkedin", e.target.value)}
                placeholder="https://linkedin.com/in/…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="github">GitHub</Label>
              <Input
                id="github"
                value={socialLinks.github ?? ""}
                onChange={(e) => updateSocial("github", e.target.value)}
                placeholder="https://github.com/…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="twitter">X (Twitter)</Label>
              <Input
                id="twitter"
                value={socialLinks.twitter ?? ""}
                onChange={(e) => updateSocial("twitter", e.target.value)}
                placeholder="https://x.com/…"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                value={socialLinks.whatsapp ?? ""}
                onChange={(e) => updateSocial("whatsapp", e.target.value)}
                placeholder="https://wa.me/…"
              />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-border p-4">
            <div>
              <Label htmlFor="card-public" className="font-medium">Make card public</Label>
              <p className="text-sm text-muted-foreground">
                Allow anyone with the link to view your card
              </p>
            </div>
            <Switch id="card-public" checked={cardPublic} onCheckedChange={setCardPublic} />
          </div>

          <Button variant="icvf" onClick={() => void handleSave()} disabled={saving}>
            {saving ? "Saving…" : "Save Changes"}
          </Button>
        </div>
      </GlassCard>

      <div className="flex flex-col items-center gap-6">
        <GlassCard className="w-full bg-white">
          <h2 className="mb-6 text-center text-xl font-semibold text-icvf-text-dark">Preview</h2>
          <div className="flex justify-center">
            <FlipCard data={previewData} />
          </div>
        </GlassCard>

        {cardPublic && (
          <GlassCard className="w-full bg-white">
            <h3 className="mb-4 font-semibold text-icvf-text-dark">Share Your Card</h3>
            <ShareCardButtons
              shareUrl={shareUrl}
              title={`${student.displayName} — ${BRAND.name} Student Card`}
              description={bio || student.courseName}
            />
          </GlassCard>
        )}
      </div>
    </div>
  );
}
