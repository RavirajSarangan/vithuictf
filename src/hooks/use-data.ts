"use client";

export {
  useStudentData,
  useStudentResults,
  useAchievements,
  useNotifications,
  useLeaderboard,
  useResources,
  useCourseById,
  useExams,
  useActivities,
  useParentData,
  usePlatformSettings,
  useCurrentTeacher,
} from "./use-student-data";

export {
  useCourses,
  useSiteStats,
  useSuccessStories,
  useFaqs,
  useClassPrograms,
  usePaperCenters,
  useNetworkStats,
  useFeaturedRankings,
  useHomeAbout,
} from "./use-marketing-data-hooks";

export {
  useAdminStats,
  useAdminStudents,
  useAdminCourses,
  useAdminTeachers,
  useAdminStaff,
  useAdminParents,
  useAdminPayments,
  useAdminResources,
  useAdminResults,
  useAdminCertificates,
  useAdminCompanies,
  useAdminClassPrograms,
  useAdminPaperCenters,
  useAdminFeaturedRankings,
  useAdminMarketingAnnouncements,
  useAdminBlogPosts,
  useAdminBlogCategories,
  useAdminAnalytics,
  useAdminRevenueTrend,
  useContactInquiries,
} from "./use-admin-data";

export { useSocialTracking, useContentManagers } from "./use-social-tracking";
export { useTeacherDashboardStats, useTeacherDashboardData } from "./use-teacher-dashboard";
export { useAdminDashboardOverview } from "./use-admin-dashboard";
export { usePeopleRoster } from "./use-people-roster";
