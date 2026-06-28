"use client";

import { PageHeader } from "@/components/shared/page-header";
import { CourseCard } from "@/components/courses/course-card";
import { useCourses } from "@/hooks/use-data";

export default function StaffCoursesPage() {
  const courses = useCourses();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Course catalog"
        description="Preview ICT programs and their cover images for marketing and content work"
      />

      {courses.length === 0 ? (
        <p className="text-sm text-muted-foreground">No courses in the catalog yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard
              key={course.id}
              compact
              title={course.name}
              description={course.description}
              coverImageUrl={course.coverImageUrl}
              category={course.category}
              durationMonths={course.durationMonths}
              teacherName={course.teacherName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
