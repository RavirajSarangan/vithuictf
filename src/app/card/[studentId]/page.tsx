import type { Metadata } from "next";
import Link from "next/link";
import { getPublicStudentCard } from "@/lib/actions/profile-card";
import { FlipCard } from "@/components/student/flip-card";
import { BRAND } from "@/lib/constants";

interface PublicCardPageProps {
  params: Promise<{ studentId: string }>;
}

export async function generateMetadata({ params }: PublicCardPageProps): Promise<Metadata> {
  const { studentId } = await params;
  const card = await getPublicStudentCard(studentId);

  if (!card) {
    return { title: `Card Not Available | ${BRAND.name}` };
  }

  return {
    title: `${card.name} | ${BRAND.name} Student Card`,
    description: card.bio || `Student profile card for ${card.name}`,
    openGraph: {
      title: `${card.name} | ${BRAND.name} Student Card`,
      description: card.bio || `Student at ${BRAND.name} — ${card.courseName ?? ""}`,
      images: card.image ? [{ url: card.image }] : undefined,
      type: "profile",
    },
    twitter: {
      card: card.image ? "summary_large_image" : "summary",
      title: `${card.name} | ${BRAND.name} Student Card`,
      description: card.bio || undefined,
      images: card.image ? [card.image] : undefined,
    },
  };
}

export default async function PublicCardPage({ params }: PublicCardPageProps) {
  const { studentId } = await params;
  const card = await getPublicStudentCard(studentId);

  if (!card) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-icvf-navy to-icvf-navy-dark px-4">
        <div className="max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-md">
          <h1 className="text-2xl font-bold text-white">Card Not Available</h1>
          <p className="mt-2 text-white/70">
            This student card is private or does not exist.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-icvf-accent px-6 py-2 text-sm font-medium text-white hover:bg-icvf-accent/90"
          >
            Visit {BRAND.name}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-icvf-navy to-icvf-navy-dark px-4 py-12">
      <Link href="/" className="mb-8 text-lg font-semibold text-white hover:text-icvf-accent">
        {BRAND.name}
      </Link>
      <FlipCard data={card} />
      <p className="mt-6 text-sm text-white/50">Tap the card to flip</p>
    </div>
  );
}
