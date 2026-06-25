"use client";

import { useAdminStats } from "@/hooks/use-data";
import { StatCard } from "@/components/shared/stat-card";
import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, GraduationCap, CreditCard, BookOpen, Award, BookMarked } from "lucide-react";

export default function AdminDashboard() {
  const stats = useAdminStats();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Dashboard" description="Overview of tuition metrics" />
      {!stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-white/10" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <StatCard title="Total Students" value={stats.totalStudents} icon={Users} accent />
          <StatCard title="Total Teachers" value={stats.totalTeachers} icon={GraduationCap} accent />
          <StatCard title="Total Revenue" value={`Rs. ${stats.totalRevenue.toLocaleString()}`} icon={CreditCard} accent />
          <StatCard title="Total Resources" value={stats.totalResources} icon={BookOpen} accent />
          <StatCard title="Certificates Issued" value={stats.totalCertificates} icon={Award} accent />
          <StatCard title="Total Courses" value={stats.totalCourses} icon={BookMarked} accent />
        </div>
      )}
    </div>
  );
}
