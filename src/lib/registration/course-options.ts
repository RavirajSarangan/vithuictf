import type { Course } from "@/types";
import type { IctGrade, StudyTrack } from "@/lib/validation/register-student";

/** Courses a student may pick during self-registration for their study track. */
export function getRegistrationCourses(courses: Course[], studyTrack: StudyTrack): Course[] {
  const targetLevel = studyTrack === "al" ? "AL" : "OL";
  return courses
    .filter((course) => course.level === targetLevel)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function pickDefaultRegistrationCourse(
  courses: Course[],
  studyTrack: StudyTrack,
  ictGrade?: IctGrade
): Course | null {
  const eligible = getRegistrationCourses(courses, studyTrack);
  if (eligible.length === 0) return null;
  if (eligible.length === 1) return eligible[0];

  if (studyTrack === "grade" && ictGrade) {
    const gradeToken = ictGrade === "grade_10" ? "10" : "11";
    const byGrade = eligible.find(
      (course) =>
        new RegExp(`grade\\s*${gradeToken}|g${gradeToken}|தரம்\\s*${gradeToken}`, "i").test(
          course.name
        )
    );
    if (byGrade) return byGrade;
  }

  const ictCourse = eligible.find((course) => /ict/i.test(course.name));
  return ictCourse ?? eligible[0];
}

export function isCourseEligibleForStudyTrack(
  courseId: string,
  courses: Course[],
  studyTrack: StudyTrack
): boolean {
  return getRegistrationCourses(courses, studyTrack).some((course) => course.id === courseId);
}
