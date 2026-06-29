import type { MarketingLocale } from "@/contexts/marketing-language-context";
import { SINHALA_UI_OVERRIDES } from "@/lib/i18n/marketing-ui-sinhala";

export type MarketingUiKey =
  | "nav.results"
  | "nav.companies"
  | "nav.programs"
  | "nav.about"
  | "nav.platform"
  | "nav.centers"
  | "nav.faq"
  | "nav.contact"
  | "nav.blog"
  | "nav.passPapers"
  | "nav.passPapersFreeDownload"
  | "nav.register"
  | "nav.institute"
  | "btn.login"
  | "btn.dashboard"
  | "btn.signOut"
  | "btn.apply"
  | "btn.register"
  | "btn.registerNav"
  | "btn.learnMore"
  | "btn.viewCenters"
  | "btn.viewPrograms"
  | "apply.title"
  | "apply.subtitle"
  | "apply.name"
  | "apply.email"
  | "apply.password"
  | "apply.submit"
  | "apply.submitting"
  | "apply.haveAccount"
  | "lang.en"
  | "lang.ta"
  | "lang.si"
  | "hero.studentsEnrolled"
  | "hero.expertFaculty"
  | "hero.coursesOffered"
  | "hero.placementRate"
  | "hero.yearsExperience"
  | "hero.badge"
  | "hero.title"
  | "hero.accent"
  | "hero.subtitle"
  | "hero.subtitleMobile"
  | "hero.liveZoom"
  | "hero.lmsPortal"
  | "hero.topicWebDev"
  | "hero.expertFacultyLabel"
  | "hero.community"
  | "hero.passRate"
  | "hero.mobileProofTitle"
  | "hero.abGrades"
  | "hero.scrollHint"
  | "btn.whatsapp"
  | "results.badge"
  | "results.title"
  | "results.subtitle"
  | "results.viewHistory"
  | "results.topRankings"
  | "results.totalAchievers"
  | "results.cta"
  | "results.islandRank"
  | "results.districtTop10"
  | "results.aGrades"
  | "results.bGrades"
  | "results.fullHistoryTitle"
  | "results.fullHistorySubtitle"
  | "results.backToHome"
  | "results.noRankings"
  | "companies.badge"
  | "companies.title"
  | "companies.subtitle"
  | "marketing.comingSoon.eyebrow"
  | "marketing.comingSoon.title"
  | "marketing.comingSoon.titleLead"
  | "marketing.comingSoon.titleAccent"
  | "marketing.comingSoon.subtitle"
  | "marketing.comingSoon.chipPrograms"
  | "marketing.comingSoon.chipResults"
  | "marketing.comingSoon.chipCenters"
  | "marketing.comingSoon.chipFaq"
  | "marketing.comingSoon.statusBadge"
  | "marketing.comingSoon.sectionStatus"
  | "marketing.comingSoon.focusLabel"
  | "marketing.comingSoon.building"
  | "marketing.comingSoon.rotatorSuffix"
  | "marketing.siteStatus.comingSoon.eyebrow"
  | "marketing.siteStatus.comingSoon.title"
  | "marketing.siteStatus.comingSoon.subtitle"
  | "marketing.siteStatus.comingSoon.contact"
  | "marketing.siteStatus.maintenance.eyebrow"
  | "marketing.siteStatus.maintenance.title"
  | "marketing.siteStatus.maintenance.subtitle"
  | "programs.badge"
  | "programs.title"
  | "programs.subtitle"
  | "programs.ready"
  | "programs.readySub"
  | "programs.registerNote"
  | "programs.tab.all"
  | "programs.tab.classes"
  | "programs.tab.courses"
  | "programs.tab.centers"
  | "programs.viewProgram"
  | "programs.applyProgram"
  | "programs.months"
  | "about.badge"
  | "about.title"
  | "about.subtitle"
  | "about.yearsAt"
  | "about.studentsGuided"
  | "about.resultsProduced"
  | "about.islandFirst"
  | "platform.badge"
  | "platform.title"
  | "platform.subtitle"
  | "platform.videoLibrary"
  | "platform.videoLibraryDesc"
  | "platform.liveClasses"
  | "platform.liveClassesDesc"
  | "platform.leaderboard"
  | "platform.leaderboardDesc"
  | "platform.studyMaterials"
  | "platform.studyMaterialsDesc"
  | "platform.aiTutor"
  | "platform.aiTutorDesc"
  | "platform.progressTracking"
  | "platform.latestScore"
  | "platform.batchRank"
  | "platform.papersDone"
  | "platform.topicProgramming"
  | "platform.topicDatabases"
  | "platform.topicNetworking"
  | "join.badge"
  | "join.title"
  | "join.subtitle"
  | "join.liveClasses"
  | "join.massClasses"
  | "join.ourStudents"
  | "join.tagline"
  | "join.step1Desc"
  | "join.step2Desc"
  | "join.step3Desc"
  | "faq.badge"
  | "faq.title"
  | "faq.accent"
  | "faq.subtitle"
  | "faq.empty"
  | "footer.youtube"
  | "footer.telegram"
  | "footer.whatsapp"
  | "footer.quickLinks"
  | "footer.programs"
  | "footer.portal"
  | "footer.heritage"
  | "footer.description"
  | "footer.marquee.lms"
  | "footer.marquee.results"
  | "footer.builtBy"
  | "contact.badge"
  | "contact.title"
  | "contact.accent"
  | "contact.subtitle"
  | "contact.whatsapp"
  | "contact.email"
  | "contact.phone"
  | "contact.location"
  | "contact.registrationNote"
  | "contact.formTitle"
  | "contact.formSubtitle"
  | "contact.formName"
  | "contact.formEmail"
  | "contact.formPhone"
  | "contact.formMessage"
  | "contact.formMessagePlaceholder"
  | "contact.formSubmit"
  | "contact.formSending"
  | "apply.badge"
  | "apply.trustSecure"
  | "apply.trustInstant"
  | "apply.trustStudents"
  | "apply.whatsappNote"
  | "centers.badge"
  | "centers.paperCenters"
  | "centers.acrossSriLanka"
  | "centers.realExam"
  | "centers.spotlightTitle"
  | "centers.spotlightDesc"
  | "centers.districts"
  | "centers.passRate"
  | "centers.papersWritten"
  | "rank.island"
  | "rank.district"
  | "rank.class"
  | "parent.badge"
  | "parent.title"
  | "parent.subtitle"
  | "parent.trackPerformance"
  | "parent.trackPerformanceDesc"
  | "parent.monitorGrades"
  | "parent.monitorGradesDesc"
  | "parent.notifications"
  | "parent.notificationsDesc"
  | "parent.reports"
  | "parent.reportsDesc"
  | "parent.dashboardTitle"
  | "parent.sampleStudent"
  | "parent.attendance"
  | "parent.presentToday"
  | "parent.latestResult"
  | "parent.login"
  | "stories.title"
  | "stories.subtitle"
  | "stories.prev"
  | "stories.next"
  | "stories.goTo"
  | "auth.portalBadge"
  | "auth.loginTitle"
  | "auth.loginSubtitle"
  | "auth.registerBadge"
  | "auth.registerTitle"
  | "auth.registerSubtitle"
  | "auth.onlineNetwork"
  | "auth.studentPortal"
  | "auth.studentPortalDesc"
  | "auth.parentAccess"
  | "auth.parentPortal"
  | "auth.parentPortalDesc"
  | "auth.facultyAccess"
  | "auth.teacherPortal"
  | "auth.teacherPortalDesc"
  | "auth.comingSoon"
  | "auth.signInHeading"
  | "auth.signInSub"
  | "auth.fullName"
  | "auth.email"
  | "auth.password"
  | "auth.registerHeading"
  | "auth.registerSub"
  | "auth.registering"
  | "auth.haveAccount"
  | "auth.signingIn"
  | "auth.loginSuccess"
  | "auth.loginFailed"
  | "auth.continueGoogle"
  | "auth.newStudent"
  | "auth.registerNow"
  | "auth.registerCardDesc"
  | "auth.islandwide"
  | "auth.paperCenters"
  | "auth.paperCentersDesc"
  | "auth.classes"
  | "auth.viewPrograms"
  | "auth.viewProgramsDesc"
  | "auth.nameRequired"
  | "auth.passwordMin"
  | "auth.username"
  | "auth.indexNumber"
  | "auth.indexAutoNote"
  | "auth.phone"
  | "auth.whatsapp"
  | "auth.schoolName"
  | "auth.schoolNamePlaceholder"
  | "auth.nicNumber"
  | "auth.nicNumberOptional"
  | "auth.nicNumberPlaceholder"
  | "auth.nicNumberHint"
  | "auth.course"
  | "auth.confirmPassword"
  | "auth.sectionPersonal"
  | "auth.sectionProgram"
  | "auth.sectionAccount"
  | "auth.sectionPreferences"
  | "auth.notifyEmail"
  | "auth.termsAgree"
  | "auth.usernameRequired"
  | "auth.indexRequired"
  | "auth.courseRequired"
  | "auth.passwordMismatch"
  | "auth.usernameTaken"
  | "auth.indexTaken"
  | "auth.selectCourse"
  | "auth.registerCourseAuto"
  | "auth.registerCourseMultiNote"
  | "auth.registerNoCoursesForTrack"
  | "auth.registerCourseMismatch"
  | "auth.usernameAvailable"
  | "auth.registerSuccess"
  | "auth.registerFailed"
  | "auth.back"
  | "auth.needHelp"
  | "auth.allRightsReserved"
  | "auth.registerHere"
  | "auth.welcomeBack"
  | "auth.loginWithEmail"
  | "auth.staffAdminLogin"
  | "auth.staffPortalLogin"
  | "auth.adminPortalLogin"
  | "auth.staffUsername"
  | "auth.staffUsernamePlaceholder"
  | "auth.optionalForAdmins"
  | "auth.staffUsernameInvalid"
  | "auth.staffUsernameNotFound"
  | "auth.staffEmailMismatch"
  | "auth.staffPortalOnly"
  | "auth.adminPortalOnly"
  | "auth.adminUseAdminLogin"
  | "auth.signInSubStaffLink"
  | "auth.signInSubStaffPortal"
  | "auth.signInSubAdminPortal"
  | "auth.adminLoginPrompt"
  | "auth.staffDedicatedLoginHelp"
  | "auth.continueToStaffLogin"
  | "auth.contentTeamLogin"
  | "auth.socialTrackingLogin"
  | "auth.signInSubStaff"
  | "auth.signInSubContentTeam"
  | "auth.signInSubSocialTracking"
  | "auth.studentIdMissingHelp"
  | "auth.invalidEmail"
  | "auth.studentIdNotFound"
  | "auth.studentIdInvalid"
  | "auth.staffEmailOnly"
  | "auth.contentTeamOnly"
  | "auth.paperCenterOnly"
  | "auth.studentIdOnly"
  | "auth.studentId"
  | "auth.studentIdPlaceholder"
  | "auth.secureLogin"
  | "auth.signIn"
  | "auth.emailPlaceholder"
  | "auth.passwordPlaceholder"
  | "auth.forgotPassword"
  | "auth.noAccount"
  | "auth.createAccount"
  | "auth.loginHeroTitle"
  | "auth.loginHeroAccent"
  | "auth.loginHeroSub"
  | "auth.loginFeature1Title"
  | "auth.loginFeature1Desc"
  | "auth.loginFeature2Title"
  | "auth.loginFeature2Desc"
  | "auth.loginFeature3Title"
  | "auth.loginFeature3Desc"
  | "auth.registerHeroTitle"
  | "auth.registerHeroSub"
  | "auth.registerBenefit1"
  | "auth.registerBenefit2"
  | "auth.registerBenefit3"
  | "auth.registerBenefit4"
  | "auth.studyProgram"
  | "auth.studyTrackAl"
  | "auth.studyTrackAlDesc"
  | "auth.studyTrackGrade"
  | "auth.studyTrackGradeDesc"
  | "auth.examYear"
  | "auth.selectExamYear"
  | "auth.ictGrade"
  | "auth.grade10Ict"
  | "auth.grade11Ict"
  | "auth.fullNamePlaceholder"
  | "auth.usernamePlaceholder"
  | "auth.indexPlaceholder"
  | "auth.phonePlaceholder"
  | "auth.passwordMinHint"
  | "auth.confirmPasswordPlaceholder";

type UiEntry = { en: string; ta: string; si?: string };

const UI: Record<MarketingUiKey, UiEntry> = {
  "nav.results": { en: "Results", ta: "முடிவுகள்" },
  "nav.companies": { en: "Centers", ta: "மையங்கள்" },
  "nav.programs": { en: "Programs", ta: "திட்டங்கள்" },
  "nav.about": { en: "About", ta: "பற்றி" },
  "nav.platform": { en: "Platform", ta: "தளம்" },
  "nav.centers": { en: "Network", ta: "நெட்வொர்க்" },
  "nav.faq": { en: "FAQ", ta: "கேள்விகள்" },
  "nav.contact": { en: "Contact", ta: "தொடர்பு" },
  "nav.blog": { en: "Blog", ta: "வலைப்பதிவு", si: "Blog" },
  "nav.passPapers": { en: "Pass Papers", ta: "கடந்த வினாத்தாள்கள்", si: "Pass Papers" },
  "nav.passPapersFreeDownload": {
    en: "Free Download",
    ta: "இலவச பதிவிறக்கம்",
    si: "Free Download",
  },
  "nav.register": { en: "Register", ta: "பதிவு" },
  "nav.institute": { en: "Institute", ta: "நிறுவனம்" },
  "btn.login": { en: "Login", ta: "உள்நுழை" },
  "btn.dashboard": { en: "Dashboard", ta: "டாஷ்போர்டு" },
  "btn.signOut": { en: "Sign out", ta: "வெளியேறு" },
  "btn.apply": { en: "Register Now", ta: "இப்போது பதிவு செய்" },
  "btn.register": { en: "Register Now", ta: "இப்போது பதிவு செய்" },
  "btn.registerNav": { en: "Register", ta: "பதிவு" },
  "btn.learnMore": { en: "Learn more", ta: "மேலும் அறிக" },
  "btn.viewCenters": { en: "View Paper Centers", ta: "பேப்பர் மையங்களைப் பார்க்க" },
  "btn.viewPrograms": { en: "View Programs", ta: "திட்டங்களைப் பார்க்க" },
  "apply.title": { en: "Register for a class", ta: "வகுப்புக்கு பதிவு செய்யுங்கள்" },
  "apply.subtitle": {
    en: "Create your ICTF student account online to access classes, materials, and your student portal.",
    ta: "வகுப்புகள், படிப்பொருட்கள் மற்றும் மாணவர் தளத்தை அணுக ICTF மாணவர் கணக்கை ஆன்லைனில் உருவாக்குங்கள்.",
  },
  "apply.name": { en: "Full Name", ta: "முழு பெயர்" },
  "apply.email": { en: "Email", ta: "மின்னஞ்சல்" },
  "apply.password": { en: "Password", ta: "கடவுச்சொல்" },
  "apply.submit": { en: "Submit Application", ta: "விண்ணப்பத்தை சமர்ப்பி" },
  "apply.submitting": { en: "Submitting...", ta: "சமர்ப்பிக்கிறது..." },
  "apply.haveAccount": { en: "Already have an account?", ta: "ஏற்கனவே கணக்கு உள்ளதா?" },
  "lang.en": { en: "English", ta: "English", si: "English" },
  "lang.ta": { en: "தமிழ்", ta: "தமிழ்", si: "தமிழ்" },
  "lang.si": { en: "සිංහල", ta: "සිංහල", si: "සිංහල" },
  "hero.studentsEnrolled": { en: "Students Enrolled", ta: "பதிவு செய்த மாணவர்கள்" },
  "hero.expertFaculty": { en: "Expert Faculty", ta: "நிபுணர் ஆசிரியர்கள்" },
  "hero.coursesOffered": { en: "Courses Offered", ta: "வழங்கப்படும் பாடங்கள்" },
  "hero.placementRate": { en: "Placement Rate", ta: "வேலைவாய்ப்பு விகிதம்" },
  "hero.yearsExperience": { en: "Years Experience", ta: "அனுபவ ஆண்டுகள்" },
  "hero.badge": { en: "ICTF Institute · Jaffna", ta: "ICTF நிறுவனம் · யாழ்ப்பாணம்" },
  "hero.title": { en: "O/L & A/L ICT Institute", ta: "O/L & A/L ICT நிறுவனம்" },
  "hero.accent": { en: "Islandwide", ta: "தீவு முழுவதும்" },
  "hero.subtitle": {
    en: "Live Zoom classes, paper center practice, revision programs, and the ICTF student portal. Register online to join a class today.",
    ta: "நேரடி Zoom வகுப்புகள், பேப்பர் மைய பயிற்சி, மறுபரிசீலனை திட்டங்கள் மற்றும் ICTF மாணவர் தளம். வகுப்பில் சேர ஆன்லைனில் பதிவு செய்யுங்கள்.",
  },
  "hero.subtitleMobile": {
    en: "Live Zoom classes, paper centers, and the ICTF student portal — register online today.",
    ta: "நேரடி Zoom வகுப்புகள், பேப்பர் மையங்கள் மற்றும் ICTF மாணவர் தளம் — இன்றே ஆன்லைனில் பதிவு செய்யுங்கள்.",
  },
  "hero.liveZoom": { en: "Live Zoom Classes", ta: "நேரடி Zoom வகுப்புகள்" },
  "hero.lmsPortal": { en: "ICTF Student Portal", ta: "ICTF மாணவர் தளம்" },
  "hero.topicWebDev": { en: "Web Development", ta: "வலை மேம்பாடு" },
  "hero.expertFacultyLabel": { en: "Expert Faculty", ta: "நிபுணர் ஆசிரியர்கள்" },
  "hero.community": { en: "Join Our Community", ta: "எங்கள் சமூகத்தில் சேருங்கள்" },
  "hero.passRate": { en: "Pass Rate", ta: "வெற்றி விகிதம்" },
  "hero.mobileProofTitle": { en: "Proven results", ta: "நிரூபிக்கப்பட்ட முடிவுகள்" },
  "hero.abGrades": { en: "A/B Grades", ta: "A/B தரங்கள்" },
  "hero.scrollHint": { en: "Scroll to explore", ta: "ஆராய உருட்டவும்" },
  "btn.whatsapp": { en: "WhatsApp Us", ta: "WhatsApp செய்யுங்கள்" },
  "results.badge": { en: "Results", ta: "முடிவுகள்" },
  "results.title": { en: "Exam results our students are proud of", ta: "எங்கள் மாணவர்கள் பெருமைப்படும் தேர்வு முடிவுகள்" },
  "results.subtitle": {
    en: "Island ranks, district top tens, and A/B grades from recent O/L and A/L ICT examinations.",
    ta: "சமீபத்திய O/L மற்றும் A/L ICT தேர்வுகளில் தீவு தரவரிசை, மாவட்ட முதல் பத்து மற்றும் A/B தரங்கள்.",
  },
  "results.viewHistory": { en: "View full results history", ta: "முழு முடிவு வரலாற்றைப் பார்க்க" },
  "results.topRankings": { en: "Top Achievers", ta: "சிறந்த சாதனையாளர்கள்" },
  "results.totalAchievers": { en: "achievers", ta: "சாதனையாளர்கள்" },
  "results.cta": {
    en: "You can achieve results like these — register today.",
    ta: "இதுபோன்ற முடிவுகளை நீங்களும் பெறலாம் — இன்றே பதிவு செய்யுங்கள்.",
  },
  "results.islandRank": { en: "Island Rank", ta: "தீவு தரவரிசை" },
  "results.districtTop10": { en: "District Top 10", ta: "மாவட்ட முதல் 10" },
  "results.aGrades": { en: "A Grades", ta: "A தரங்கள்" },
  "results.bGrades": { en: "B Grades", ta: "B தரங்கள்" },
  "results.fullHistoryTitle": { en: "Full results hall of fame", ta: "முழு முடிவுகள் புகழ்பெற்ற பட்டியல்" },
  "results.fullHistorySubtitle": {
    en: "All featured rankings from recent ICT examinations.",
    ta: "சமீபத்திய ICT தேர்வுகளின் அனைத்து சிறப்பு தரவரிசைகள்.",
  },
  "results.backToHome": { en: "Back to homepage", ta: "முகப்புக்குத் திரும்பு" },
  "results.noRankings": { en: "Rankings will be published soon.", ta: "தரவரிசைகள் விரைவில் வெளியிடப்படும்." },
  "companies.badge": { en: "Islandwide Presence", ta: "தீவு முழுவதும்" },
  "companies.title": {
    en: "Reaching students across Sri Lanka's key education cities",
    ta: "இலங்கையின் முக்கிய கல்வி நகரங்களில் மாணவர்களை அடைவது",
  },
  "companies.subtitle": {
    en: "Physical centers and online classrooms working together for every learner.",
    ta: "ஒவ்வொரு மாணவருக்கும் உடல் மையங்களும் ஆன்லைன் வகுப்பறைகளும் ஒன்றிணைந்து.",
  },
  "marketing.comingSoon.eyebrow": { en: "ICTF Institute", ta: "ICTF நிறுவனம்" },
  "marketing.comingSoon.title": { en: "Coming Soon", ta: "விரைவில் வருகிறது" },
  "marketing.comingSoon.titleLead": { en: "Coming", ta: "விரைவில்" },
  "marketing.comingSoon.titleAccent": { en: "Soon", ta: "வருகிறது" },
  "marketing.comingSoon.subtitle": {
    en: "New sections are being prepared for O/L & A/L ICT students across Sri Lanka. Please check back shortly.",
    ta: "இலங்கை முழுவதும் உள்ள O/L & A/L ICT மாணவர்களுக்கான புதிய பிரிவுகள் தயாரிக்கப்படுகின்றன. விரைவில் மீண்டும் பார்வையிடுங்கள்.",
  },
  "marketing.comingSoon.chipPrograms": { en: "Programs & Courses", ta: "திட்டங்கள் & வகுப்புகள்" },
  "marketing.comingSoon.chipResults": { en: "Results & Rankings", ta: "முடிவுகள் & தரவரிசை" },
  "marketing.comingSoon.chipCenters": { en: "Islandwide Centers", ta: "தீவு முழுவதும் மையங்கள்" },
  "marketing.comingSoon.chipFaq": { en: "FAQ & Help", ta: "கேள்விகள் & உதவி" },
  "marketing.comingSoon.statusBadge": {
    en: "Site expansion in progress",
    ta: "தள விரிவாக்கம் நடப்பில் உள்ளது",
  },
  "marketing.comingSoon.sectionStatus": {
    en: "Ongoing",
    ta: "நடப்பில்",
  },
  "marketing.comingSoon.focusLabel": {
    en: "Currently preparing",
    ta: "தற்போது தயாராகிறது",
  },
  "marketing.comingSoon.building": {
    en: "New sections are loading",
    ta: "புதிய பிரிவுகள் ஏற்றப்படுகின்றன",
  },
  "marketing.comingSoon.rotatorSuffix": {
    en: "coming soon",
    ta: "விரைவில் வருகிறது",
  },
  "marketing.siteStatus.comingSoon.eyebrow": { en: "ICTF Institute", ta: "ICTF நிறுவனம்" },
  "marketing.siteStatus.comingSoon.title": { en: "Coming Soon", ta: "விரைவில் வருகிறது" },
  "marketing.siteStatus.comingSoon.subtitle": {
    en: "We are preparing something great for students across Sri Lanka. The full site will open shortly.",
    ta: "இலங்கை முழுவதும் உள்ள மாணவர்களுக்காக நாங்கள் சிறந்ததை தயாரிக்கிறோம். முழு தளம் விரைவில் திறக்கப்படும்.",
  },
  "marketing.siteStatus.comingSoon.contact": {
    en: "Questions? Email us at info@ictf.lk",
    ta: "கேள்விகள்? info@ictf.lk இல் எங்களை தொடர்பு கொள்ளுங்கள்",
  },
  "marketing.siteStatus.maintenance.eyebrow": { en: "Scheduled maintenance", ta: "திட்டமிடப்பட்ட பராமரிப்பு" },
  "marketing.siteStatus.maintenance.title": { en: "We will be back shortly", ta: "விரைவில் திரும்புவோம்" },
  "marketing.siteStatus.maintenance.subtitle": {
    en: "The site is temporarily unavailable while we apply updates. Thank you for your patience.",
    ta: "புதுப்பிப்புகளைச் செய்யும் போது தளம் தற்காலிகமாக கிடைக்காது. உங்கள் பொறுமைக்கு நன்றி.",
  },
  "programs.badge": { en: "Our Classes", ta: "எங்கள் வகுப்புகள்" },
  "programs.title": { en: "Programs you can join today", ta: "இன்றே சேரக்கூடிய திட்டங்கள்" },
  "programs.subtitle": {
    en: "O/L & A/L ICT class programs, degree pathways, and partner paper centers across Sri Lanka — all managed through ICTF.",
    ta: "O/L & A/L ICT வகுப்பு திட்டங்கள், பட்டப் பாதைகள் மற்றும் இலங்கை முழுவதும் கூட்டாளர் பேப்பர் மையங்கள் — அனைத்தும் ICTF மூலம் நிர்வகிக்கப்படுகின்றன.",
  },
  "programs.ready": { en: "Want to join a class?", ta: "வகுப்பில் சேர விரும்புகிறீர்களா?" },
  "programs.readySub": {
    en: "Register online — we will guide you to the right program and nearest paper center.",
    ta: "கீழே ஆன்லைனில் விண்ணப்பிக்கவும் — சரியான திட்டம் மற்றும் அருகிலுள்ள பேப்பர் மையத்திற்கு வழிகாட்டுவோம்.",
  },
  "programs.registerNote": { en: "5 structured programs for exam excellence", ta: "தேர்வு சிறப்புக்கான 5 கட்டமைக்கப்பட்ட திட்டங்கள்" },
  "programs.tab.all": { en: "All", ta: "அனைத்தும்" },
  "programs.tab.classes": { en: "Class Programs", ta: "வகுப்பு திட்டங்கள்" },
  "programs.tab.courses": { en: "Degree Courses", ta: "பட்டப் பாடங்கள்" },
  "programs.tab.centers": { en: "Partner Centers", ta: "கூட்டாளர் மையங்கள்" },
  "programs.viewProgram": { en: "View Program", ta: "திட்டத்தைப் பார்க்க" },
  "programs.applyProgram": { en: "Register for a Program", ta: "திட்டத்திற்கு பதிவு செய்" },
  "programs.months": { en: "Months", ta: "மாதங்கள்" },
  "about.badge": { en: "The Architect", ta: "கட்டமைப்பாளர்" },
  "about.title": { en: "About the Founder", ta: "நிறுவனர் பற்றி" },
  "about.subtitle": { en: "Experience built at ICTF", ta: "ICTF-இல் உருவாக்கப்பட்ட அனுபவம்" },
  "about.yearsAt": { en: "Years at ICTF", ta: "ICTF-இல் ஆண்டுகள்" },
  "about.studentsGuided": { en: "Students Guided", ta: "வழிநடத்திய மாணவர்கள்" },
  "about.resultsProduced": { en: "Results Produced", ta: "உருவாக்கிய முடிவுகள்" },
  "about.islandFirst": { en: "Island 1st", ta: "தீவு முதல்" },
  "platform.badge": { en: "ICTF Student Portal", ta: "ICTF மாணவர் தளம்" },
  "platform.title": { en: "A complete digital learning platform", ta: "முழுமையான டிஜிட்டல் கற்றல் தளம்" },
  "platform.subtitle": {
    en: "Video lessons, live classes, study materials, and AI support — all in one place.",
    ta: "வீடியோ பாடங்கள், நேரடி வகுப்புகள், படிப்பொருட்கள் மற்றும் AI ஆதரவு — ஒரே இடத்தில்.",
  },
  "platform.videoLibrary": { en: "Video Library", ta: "வீடியோ நூலகம்" },
  "platform.videoLibraryDesc": {
    en: "Replay class recordings anytime from the video library.",
    ta: "வீடியோ நூலகத்திலிருந்து வகுப்பு பதிவுகளை எப்போதும் மீண்டும் பார்க்கலாம்.",
  },
  "platform.liveClasses": { en: "Live Classes", ta: "நேரடி வகுப்புகள்" },
  "platform.liveClassesDesc": {
    en: "Join live online sessions and resolve doubts with expert teachers.",
    ta: "நேரடி ஆன்லைன் அமர்வுகளில் சேர்ந்து நிபுணர் ஆசிரியர்களுடன் சந்தேகங்களைத் தீர்க்கலாம்.",
  },
  "platform.leaderboard": { en: "Leaderboard", ta: "தரவரிசைப் பலகை" },
  "platform.leaderboardDesc": {
    en: "Compare performance and climb the ranks with your batch.",
    ta: "உங்கள் குழுவுடன் செயல்திறனை ஒப்பிட்டு தரவரிசையில் ஏறுங்கள்.",
  },
  "platform.studyMaterials": { en: "Study Materials", ta: "படிப்பொருட்கள்" },
  "platform.studyMaterialsDesc": {
    en: "Download notes, PDFs, and diagrams with ease.",
    ta: "குறிப்புகள், PDF மற்றும் வரைபடங்களை எளிதாகப் பதிவிறக்கம் செய்யுங்கள்.",
  },
  "platform.aiTutor": { en: "AI Learning Assistant", ta: "AI கற்றல் உதவியாளர்" },
  "platform.aiTutorDesc": {
    en: "Get 24/7 help with concepts, past papers, and revision.",
    ta: "கருத்துகள், பழைய வினாத்தாள்கள் மற்றும் மறுபரிசீலனைக்கு 24/7 உதவி.",
  },
  "platform.progressTracking": { en: "Progress Tracking", ta: "முன்னேற்ற கண்காணிப்பு" },
  "platform.latestScore": { en: "Latest Score", ta: "சமீபத்திய மதிப்பெண்" },
  "platform.batchRank": { en: "Batch Rank", ta: "குழு தரவரிசை" },
  "platform.papersDone": { en: "Papers Done", ta: "முடித்த வினாத்தாள்கள்" },
  "platform.topicProgramming": { en: "Programming", ta: "நிரலாக்கம்" },
  "platform.topicDatabases": { en: "Databases", ta: "தரவுத்தளங்கள்" },
  "platform.topicNetworking": { en: "Networking", ta: "நெட்வொர்க்கிங்" },
  "join.badge": { en: "ICT Foundation", ta: "ICT அடித்தளம்" },
  "join.title": { en: "Be the next success story", ta: "அடுத்த வெற்றிக் கதையாக இருங்கள்" },
  "join.subtitle": { en: "Join us today", ta: "இன்றே எங்களுடன் சேருங்கள்" },
  "join.liveClasses": { en: "Live Classes", ta: "நேரடி வகுப்புகள்" },
  "join.massClasses": { en: "Island-wide Reach", ta: "தீவு முழுவதும்" },
  "join.ourStudents": { en: "Our Students", ta: "எங்கள் மாணவர்கள்" },
  "join.tagline": {
    en: "Achieve your dreams with Sri Lanka's trusted ICT education platform.",
    ta: "இலங்கையின் நம்பகமான ICT கல்வி தளத்துடன் உங்கள் கனவுகளை நிறைவேற்றுங்கள்.",
  },
  "join.step1Desc": {
    en: "Join live Zoom sessions with expert faculty across Sri Lanka.",
    ta: "இலங்கை முழுவதும் நிபுணர் ஆசிரியர்களுடன் நேரடி Zoom அமர்வுகளில் சேருங்கள்.",
  },
  "join.step2Desc": {
    en: "Access programs from Jaffna to Colombo through our islandwide network.",
    ta: "எங்கள் தீவு முழுவதும் நெட்வொர்க் மூலம் யாழ்ப்பாணம் முதல் கொழும்பு வரை திட்டங்களை அணுகுங்கள்.",
  },
  "join.step3Desc": {
    en: "Track progress, earn ranks, and grow with thousands of ICTF students.",
    ta: "முன்னேற்றத்தைக் கண்காணித்து, தரவரிசை பெற்று, ஆயிரக்கணக்கான ICTF மாணவர்களுடன் வளருங்கள்.",
  },
  "faq.badge": { en: "FAQ", ta: "கேள்விகள்" },
  "faq.title": { en: "Questions,", ta: "கேள்விகள்," },
  "faq.accent": { en: "answered.", ta: "பதிலளிக்கப்பட்டன." },
  "faq.subtitle": {
    en: "Everything you need to know about ICTF and the student portal.",
    ta: "ICTF மற்றும் மாணவர் தளம் பற்றி நீங்கள் தெரிந்து கொள்ள வேண்டிய அனைத்தும்.",
  },
  "faq.empty": {
    en: "FAQs will appear here soon. Contact us if you have a question in the meantime.",
    ta: "கேள்விகள் விரைவில் இங்கே தோன்றும். இதற்கிடையில் கேள்வி இருந்தால் எங்களை தொடர்பு கொள்ளுங்கள்.",
  },
  "footer.youtube": { en: "YouTube Channel", ta: "YouTube சேனல்" },
  "footer.telegram": { en: "Telegram Channel", ta: "Telegram சேனல்" },
  "footer.whatsapp": { en: "WhatsApp", ta: "WhatsApp" },
  "footer.quickLinks": { en: "Quick Links", ta: "விரைவு இணைப்புகள்" },
  "footer.programs": { en: "Our Programs", ta: "எங்கள் திட்டங்கள்" },
  "footer.portal": { en: "Portal Access", ta: "போர்டல் அணுகல்" },
  "footer.heritage": {
    en: "Rooted in Jaffna · Serving ICT students islandwide",
    ta: "யாழில் வேரூன்றியது · தீவு முழுவதும் ICT மாணவர்களுக்கு",
  },
  "footer.description": {
    en: "O/L & A/L ICT institute — Zoom classes, paper centers, and the student portal across Sri Lanka.",
    ta: "O/L & A/L ICT நிறுவனம் — Zoom வகுப்புகள், பேப்பர் மையங்கள் மற்றும் மாணவர் போர்டல்.",
  },
  "footer.marquee.lms": { en: "LMS Portal", ta: "LMS போர்டல்" },
  "footer.marquee.results": { en: "Student Results", ta: "மாணவர் முடிவுகள்" },
  "footer.builtBy": {
    en: "Built by ICTF Digital",
    ta: "ICTF Digital மூலம் உருவாக்கப்பட்டது",
  },
  "contact.badge": { en: "Contact", ta: "தொடர்பு" },
  "contact.title": { en: "Contact ICTF", ta: "ICTF-ஐ தொடர்பு கொள்ளுங்கள்" },
  "contact.accent": { en: "for registration help", ta: "பதிவு உதவிக்கு" },
  "contact.subtitle": {
    en: "Call or email us for class registration, paper center locations, and enrollment support.",
    ta: "வகுப்பு பதிவு, பேப்பர் மைய இடங்கள் மற்றும் சேர்க்கை ஆதரவுக்கு அழைக்கவும் அல்லது மின்னஞ்சல் செய்யவும்.",
  },
  "contact.whatsapp": { en: "WhatsApp", ta: "WhatsApp" },
  "contact.email": { en: "Email", ta: "மின்னஞ்சல்" },
  "contact.phone": { en: "Phone", ta: "தொலைபேசி" },
  "contact.location": { en: "Location", ta: "இடம்" },
  "contact.registrationNote": {
    en: "Call or email us for class registration and enrollment support.",
    ta: "வகுப்பு பதிவு மற்றும் சேர்க்கை ஆதரவுக்கு அழைக்கவும் அல்லது மின்னஞ்சல் செய்யவும்.",
  },
  "contact.formTitle": { en: "Send us a message", ta: "எங்களுக்கு செய்தி அனுப்புங்கள்" },
  "contact.formSubtitle": {
    en: "We typically reply within one business day.",
    ta: "பொதுவாக ஒரு வேலை நாளுக்குள் பதிலளிப்போம்.",
  },
  "contact.formName": { en: "Your name", ta: "உங்கள் பெயர்" },
  "contact.formEmail": { en: "Email", ta: "மின்னஞ்சல்" },
  "contact.formPhone": { en: "Phone (optional)", ta: "தொலைபேசி (விருப்பம்)" },
  "contact.formMessage": { en: "Message", ta: "செய்தி" },
  "contact.formMessagePlaceholder": {
    en: "How can we help you with enrollment or classes?",
    ta: "பதிவு அல்லது வகுப்புகள் தொடர்பாக எப்படி உதவலாம்?",
  },
  "contact.formSubmit": { en: "Send message", ta: "செய்தி அனுப்பு" },
  "contact.formSending": { en: "Sending…", ta: "அனுப்புகிறது…" },
  "apply.badge": { en: "Apply", ta: "விண்ணப்பி" },
  "apply.trustSecure": { en: "Secure registration", ta: "பாதுகாப்பான பதிவு" },
  "apply.trustInstant": { en: "Instant portal access", ta: "உடனடி தள அணுகல்" },
  "apply.trustStudents": { en: "students enrolled", ta: "மாணவர்கள் பதிவு செய்துள்ளனர்" },
  "apply.whatsappNote": {
    en: "Prefer to register by phone? WhatsApp us with your name, grade, and district — we will complete your enrollment.",
    ta: "தொலைபேசி மூலம் பதிவு செய்ய விரும்புகிறீர்களா? உங்கள் பெயர், தரம் மற்றும் மாவட்டத்துடன் WhatsApp செய்யுங்கள் — சேர்க்கையை முடித்து விடுவோம்.",
  },
  "centers.badge": { en: "Island Wide", ta: "தீவு முழுவதும்" },
  "centers.paperCenters": { en: "Paper Centers", ta: "பேப்பர் மையங்கள்" },
  "centers.acrossSriLanka": { en: "Across Sri Lanka", ta: "இலங்கை முழுவதும்" },
  "centers.realExam": { en: "Real Exam Environment", ta: "உண்மையான தேர்வு சூழல்" },
  "centers.spotlightTitle": { en: "Featured Center", ta: "சிறப்பு மையம்" },
  "centers.spotlightDesc": {
    en: "Structured papers, timed halls, and island-wide reach for every learner.",
    ta: "ஒவ்வொரு மாணவருக்கும் கட்டமைக்கப்பட்ட வினாத்தாள்கள், நேர வரம்பு மற்றும் தீவு முழுவதும் அடைவு.",
  },
  "centers.districts": { en: "Districts Covered", ta: "மாவட்டங்கள்" },
  "centers.passRate": { en: "Pass Rate", ta: "வெற்றி விகிதம்" },
  "centers.papersWritten": { en: "Papers Written", ta: "எழுதப்பட்ட வினாத்தாள்கள்" },
  "rank.island": { en: "Island Rank", ta: "தீவு தரவரிசை" },
  "rank.district": { en: "District Rank", ta: "மாவட்ட தரவரிசை" },
  "rank.class": { en: "Class Rank", ta: "வகுப்பு தரவரிசை" },
  "parent.badge": { en: "Parent Portal", ta: "பெற்றோர் தளம்" },
  "parent.title": { en: "Stay connected with your child's progress", ta: "உங்கள் பிள்ளையின் முன்னேற்றத்துடன் இணைந்திருங்கள்" },
  "parent.subtitle": {
    en: "Monitor attendance, results, and announcements through the ICTF parent dashboard.",
    ta: "ICTF பெற்றோர் தளம் மூலம் வருகை, முடிவுகள் மற்றும் அறிவிப்புகளைக் கண்காணிக்கலாம்.",
  },
  "parent.trackPerformance": { en: "Track Performance", ta: "செயல்திறனைக் கண்காணி" },
  "parent.trackPerformanceDesc": {
    en: "Real-time performance updates and progress reports.",
    ta: "நேரடி செயல்திறன் புதுப்பிப்புகள் மற்றும் முன்னேற்ற அறிக்கைகள்.",
  },
  "parent.monitorGrades": { en: "Monitor Grades", ta: "தரங்களைக் கண்காணி" },
  "parent.monitorGradesDesc": {
    en: "Grade trends and exam analytics at a glance.",
    ta: "தரப் போக்குகள் மற்றும் தேர்வு பகுப்பாய்வுகள் ஒரு பார்வையில்.",
  },
  "parent.notifications": { en: "Receive Notifications", ta: "அறிவிப்புகளைப் பெறு" },
  "parent.notificationsDesc": {
    en: "Instant alerts for results and announcements.",
    ta: "முடிவுகள் மற்றும் அறிவிப்புகளுக்கான உடனடி எச்சரிக்கைகள்.",
  },
  "parent.reports": { en: "View Progress Reports", ta: "முன்னேற்ற அறிக்கைகளைப் பார்" },
  "parent.reportsDesc": {
    en: "Detailed monthly progress reports for each child.",
    ta: "ஒவ்வொரு பிள்ளைக்கும் விரிவான மாதாந்திர முன்னேற்ற அறிக்கைகள்.",
  },
  "parent.dashboardTitle": { en: "Parent Dashboard", ta: "பெற்றோர் டாஷ்போர்டு" },
  "parent.sampleStudent": { en: "Student", ta: "மாணவர்" },
  "parent.attendance": { en: "Attendance", ta: "வருகை" },
  "parent.presentToday": { en: "Present Today", ta: "இன்று வந்துள்ளார்" },
  "parent.latestResult": { en: "Latest Result", ta: "சமீபத்திய முடிவு" },
  "parent.login": { en: "Parent Login", ta: "பெற்றோர் உள்நுழைவு" },
  "stories.title": { en: "Student Success Stories", ta: "மாணவர் வெற்றிக் கதைகள்" },
  "stories.subtitle": {
    en: "Real achievements from students across Sri Lanka.",
    ta: "இலங்கை முழுவதும் உள்ள மாணவர்களின் உண்மையான சாதனைகள்.",
  },
  "stories.prev": { en: "Previous story", ta: "முந்தைய கதை" },
  "stories.next": { en: "Next story", ta: "அடுத்த கதை" },
  "stories.goTo": { en: "Go to story", ta: "கதைக்குச் செல்" },
  "auth.portalBadge": { en: "ICTF Portal Access", ta: "ICTF தள அணுகல்" },
  "auth.loginTitle": { en: "Choose your portal", ta: "உங்கள் தளத்தைத் தேர்ந்தெடுக்கவும்" },
  "auth.loginSubtitle": {
    en: "Select how you access the ICTF portal — student classes, parent updates, or staff tools.",
    ta: "ICTF தளத்தை எவ்வாறு அணுகுகிறீர்கள் என்பதைத் தேர்ந்தெடுக்கவும் — மாணவர் வகுப்புகள், பெற்றோர் புதுப்பிப்புகள் அல்லது staff கருவிகள்.",
  },
  "auth.registerBadge": { en: "Select your portal", ta: "உங்கள் தளத்தைத் தேர்ந்தெடுக்கவும்" },
  "auth.registerTitle": { en: "Choose where you study", ta: "நீங்கள் எங்கு படிக்கிறீர்கள் என்பதைத் தேர்வு செய்யுங்கள்" },
  "auth.registerSubtitle": {
    en: "Select the student portal below, then complete your registration form.",
    ta: "கீழே மாணவர் தளத்தைத் தேர்ந்தெடுத்து, உங்கள் பதிவு படிவத்தை நிரப்பவும்.",
  },
  "auth.onlineNetwork": { en: "Online Network", ta: "ஆன்லைன் நெட்வொர்க்" },
  "auth.studentPortal": { en: "ICTF Student Portal", ta: "ICTF மாணவர் தளம்" },
  "auth.studentPortalDesc": {
    en: "Access live classes, video lessons, past papers, and your learning dashboard.",
    ta: "நேரடி வகுப்புகள், வீடியோ பாடங்கள், பழைய வினாத்தாள்கள் மற்றும் உங்கள் கற்றல் டாஷ்போர்டை அணுகுங்கள்.",
  },
  "auth.parentAccess": { en: "Parent Access", ta: "பெற்றோர் அணுகல்" },
  "auth.parentPortal": { en: "Parent Portal", ta: "பெற்றோர் தளம்" },
  "auth.parentPortalDesc": {
    en: "Track your child's attendance, results, and school announcements.",
    ta: "உங்கள் பிள்ளையின் வருகை, முடிவுகள் மற்றும் பள்ளி அறிவிப்புகளைக் கண்காணிக்கவும்.",
  },
  "auth.facultyAccess": { en: "Staff Access", ta: "Staff அணுகல்" },
  "auth.teacherPortal": { en: "Staff", ta: "Staff" },
  "auth.teacherPortalDesc": {
    en: "Manage classes, upload materials, and monitor student progress.",
    ta: "வகுப்புகளை நிர்வகித்து, பொருட்களை பதிவேற்றி, மாணவர் முன்னேற்றத்தைக் கண்காணிக்கவும்.",
  },
  "auth.comingSoon": { en: "Coming Soon", ta: "விரைவில் வருகிறது" },
  "auth.signInHeading": { en: "Sign in to continue", ta: "தொடர உள்நுழையுங்கள்" },
  "auth.signInSub": {
    en: "Sign in with your Student ID only. Email login is not available for students.",
    ta: "உங்கள் மாணவர் அடையாளத்துடன் மட்டும் உள்நுழையுங்கள். மாணவர்களுக்கு மின்னஞ்சல் உள்நுழைவு இல்லை.",
  },
  "auth.fullName": { en: "Full Name", ta: "முழு பெயர்" },
  "auth.email": { en: "Email", ta: "மின்னஞ்சல்" },
  "auth.password": { en: "Password", ta: "கடவுச்சொல்" },
  "auth.registerHeading": { en: "Create your account", ta: "உங்கள் கணக்கை உருவாக்குங்கள்" },
  "auth.registerSub": {
    en: "Fill in your details to get started with ICTF.",
    ta: "ICTF-ஐத் தொடங்க உங்கள் விவரங்களை நிரப்பவும்.",
  },
  "auth.registering": { en: "Creating account…", ta: "கணக்கு உருவாக்கப்படுகிறது…" },
  "auth.haveAccount": { en: "Already have an account?", ta: "ஏற்கனவே கணக்கு உள்ளதா?" },
  "auth.signingIn": { en: "Signing in…", ta: "உள்நுழைகிறது…" },
  "auth.loginSuccess": { en: "Welcome back!", ta: "மீண்டும் வரவேற்கிறோம்!" },
  "auth.loginFailed": { en: "Invalid Student ID or password", ta: "தவறான மாணவர் அடையாளம் அல்லது கடவுச்சொல்" },
  "auth.continueGoogle": { en: "Continue with Google", ta: "Google உடன் தொடரவும்" },
  "auth.newStudent": { en: "New student?", ta: "புதிய மாணவரா?" },
  "auth.registerNow": { en: "Register Now", ta: "இப்போது பதிவு செய்" },
  "auth.registerCardDesc": {
    en: "Islandwide online ICT institute — study from anywhere through ICTF.",
    ta: "தீவு முழுவதும் ஆன்லைன் ICT நிறுவனம் — ICTF மூலம் எங்கிருந்தும் படியுங்கள்.",
  },
  "auth.islandwide": { en: "Islandwide", ta: "தீவு முழுவதும்" },
  "auth.paperCenters": { en: "Paper Centers", ta: "பேப்பர் மையங்கள்" },
  "auth.paperCentersDesc": {
    en: "Find a paper center near you for real exam practice.",
    ta: "உண்மையான தேர்வு பயிற்சிக்கு அருகிலுள்ள பேப்பர் மையத்தைக் கண்டறியுங்கள்.",
  },
  "auth.classes": { en: "Our Classes", ta: "எங்கள் வகுப்புகள்" },
  "auth.viewPrograms": { en: "View Programs", ta: "திட்டங்களைப் பார்க்க" },
  "auth.viewProgramsDesc": {
    en: "Browse O/L, A/L, revision, and degree pathways.",
    ta: "O/L, A/L, மறுபரிசீலனை மற்றும் பட்டப் பாதைகளைப் பாருங்கள்.",
  },
  "auth.nameRequired": { en: "Enter your full name", ta: "உங்கள் முழு பெயரை உள்ளிடவும்" },
  "auth.passwordMin": { en: "Use at least 8 characters", ta: "குறைந்தது 8 எழுத்துகள் பயன்படுத்தவும்" },
  "auth.username": { en: "Username", ta: "பயனர் பெயர்" },
  "auth.indexNumber": { en: "Index Number", ta: "அட்டவணை எண்" },
  "auth.indexAutoNote": {
    en: "Your index number will be generated automatically and sent to your email after registration.",
    ta: "உங்கள் அட்டவணை எண் தானாக உருவாக்கப்பட்டு, பதிவுக்குப் பிறகு உங்கள் மின்னஞ்சலுக்கு அனுப்பப்படும்.",
  },
  "auth.phone": { en: "Phone (optional)", ta: "தொலைபேசி (விருப்பம்)" },
  "auth.whatsapp": { en: "WhatsApp Number", ta: "WhatsApp எண்" },
  "auth.schoolName": { en: "School Name", ta: "பாடசாலை பெயர்" },
  "auth.schoolNamePlaceholder": {
    en: "e.g. Jaffna Hindu College",
    ta: "எ.கா. யாழ்ப்பாண இந்துக் கல்லூரி",
  },
  "auth.nicNumber": { en: "NIC Number", ta: "தேசிய அடையாள அட்டை எண்" },
  "auth.nicNumberOptional": {
    en: "NIC Number (optional)",
    ta: "தேசிய அடையாள அட்டை எண் (விருப்பம்)",
  },
  "auth.nicNumberPlaceholder": { en: "123456789V or 200012345678", ta: "123456789V அல்லது 200012345678" },
  "auth.nicNumberHint": {
    en: "Sri Lankan NIC: 9 digits + V/X, or the new 12-digit format.",
    ta: "இலங்கை NIC: 9 இலக்கங்கள் + V/X, அல்லது புதிய 12 இலக்க வடிவம்.",
  },
  "auth.course": { en: "Course", ta: "பாடநெறி" },
  "auth.confirmPassword": { en: "Confirm Password", ta: "கடவுச்சொல்லை உறுதிப்படுத்தவும்" },
  "auth.sectionPersonal": { en: "Personal details", ta: "தனிப்பட்ட விவரங்கள்" },
  "auth.sectionProgram": { en: "Program", ta: "நிரல்" },
  "auth.sectionAccount": { en: "Account", ta: "கணக்கு" },
  "auth.sectionPreferences": { en: "Preferences", ta: "விருப்பத்தேர்வுகள்" },
  "auth.notifyEmail": {
    en: "Send account details to my email",
    ta: "எனது மின்னஞ்சலுக்கு கணக்கு விவரங்களை அனுப்பு",
  },
  "auth.termsAgree": {
    en: "I agree to receive course updates and announcements by email.",
    ta: "மின்னஞ்சல் மூலம் பாடநெறி புதுப்பிப்புகள் மற்றும் அறிவிப்புகளைப் பெற ஒப்புக்கொள்கிறேன்.",
  },
  "auth.usernameRequired": {
    en: "Username needs 3–20 letters, numbers, or underscores",
    ta: "பயனர் பெயரில் 3–20 எழுத்துகள், எண்கள் அல்லது அடிக்கோடு இருக்க வேண்டும்",
  },
  "auth.indexRequired": { en: "Enter your index number", ta: "உங்கள் அட்டவணை எண்ணை உள்ளிடவும்" },
  "auth.courseRequired": { en: "Select a course", ta: "ஒரு பாடநெறியைத் தேர்ந்தெடுக்கவும்" },
  "auth.passwordMismatch": { en: "Passwords do not match", ta: "கடவுச்சொற்கள் பொருந்தவில்லை" },
  "auth.usernameTaken": { en: "This username is already taken", ta: "இந்த பயனர் பெயர் ஏற்கனவே பயன்பாட்டில் உள்ளது" },
  "auth.indexTaken": { en: "This index number is already registered", ta: "இந்த அட்டவணை எண் ஏற்கனவே பதிவு செய்யப்பட்டுள்ளது" },
  "auth.selectCourse": { en: "Select your course", ta: "உங்கள் பாடநெறியைத் தேர்ந்தெடுக்கவும்" },
  "auth.registerCourseAuto": {
    en: "Your course is set from the study program you chose above.",
    ta: "மேலே தேர்ந்தெடுத்த படிப்பு நிரலின் அடிப்படையில் உங்கள் பாடநெறி தானாக அமைக்கப்படும்.",
  },
  "auth.registerCourseMultiNote": {
    en: "Starting another program later? Keep the same login — staff can add more courses to your account.",
    ta: "பிறகு வேறு நிரலில் சேர வேண்டுமா? அதே உள்நுழைவைப் பயன்படுத்துங்கள் — ஊழியர்கள் உங்கள் கணக்கில் மேலும் பாடங்களைச் சேர்க்கலாம்.",
  },
  "auth.registerNoCoursesForTrack": {
    en: "No courses are open for this study program yet. Please contact ICTF to register.",
    ta: "இந்த படிப்பு நிரலுக்கு இன்னும் பாடங்கள் திறக்கப்படவில்லை. பதிவு செய்ய ICTF-ஐ தொடர்பு கொள்ளவும்.",
  },
  "auth.registerCourseMismatch": {
    en: "Selected course does not match your study program. Please choose again.",
    ta: "தேர்ந்தெடுத்த பாடம் உங்கள் படிப்பு நிரலுடன் பொருந்தவில்லை. மீண்டும் தேர்ந்தெடுக்கவும்.",
  },
  "auth.usernameAvailable": { en: "Username is available", ta: "பயனர் பெயர் கிடைக்கிறது" },
  "auth.registerSuccess": {
    en: "Account created! Check your email for your index number and login details.",
    ta: "கணக்கு உருவாக்கப்பட்டது! உங்கள் அட்டவணை எண் மற்றும் உள்நுழைவு விவரங்களுக்கு மின்னஞ்சலைப் பாருங்கள்.",
  },
  "auth.registerFailed": { en: "Registration failed", ta: "பதிவு தோல்வியடைந்தது" },
  "auth.back": { en: "Back", ta: "பின்செல்" },
  "auth.needHelp": { en: "Need help? Contact us at", ta: "உதவி வேண்டுமா? எங்களை தொடர்பு கொள்ளுங்கள்" },
  "auth.allRightsReserved": { en: "All rights reserved.", ta: "அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை." },
  "auth.registerHere": { en: "Register here", ta: "இங்கே பதிவு செய்" },
  "auth.welcomeBack": { en: "Welcome back", ta: "மீண்டும் வரவேற்கிறோம்" },
  "auth.loginWithEmail": { en: "Email", ta: "மின்னஞ்சல்" },
  "auth.staffAdminLogin": { en: "Staff", ta: "Staff" },
  "auth.staffPortalLogin": { en: "Staff Portal", ta: "Staff Portal" },
  "auth.adminPortalLogin": { en: "Admin Portal", ta: "Admin Portal" },
  "auth.staffUsername": { en: "Staff username", ta: "Staff username" },
  "auth.staffUsernamePlaceholder": { en: "Enter your staff username", ta: "உங்கள் staff username-ஐ உள்ளிடவும்" },
  "auth.optionalForAdmins": { en: "optional for admins", ta: "நிர்வாகிகளுக்கு விரும்பினால்" },
  "auth.signInSubStaffLink": {
    en: "Staff sign-in uses a private link from your administrator.",
    ta: "Staff உள்நுழைவு நிர்வாகியின் தனிப்பட்ட இணைப்பைப் பயன்படுத்துகிறது.",
  },
  "auth.signInSubStaffPortal": {
    en: "Teachers: staff username, email, and password. Administrators: email and password only.",
    ta: "ஆசிரியர்கள்: staff username, மின்னஞ்சல் மற்றும் கடவுச்சொல். நிர்வாகிகள்: மின்னஞ்சல் மற்றும் கடவுச்சொல் மட்டும்.",
  },
  "auth.signInSubAdminPortal": {
    en: "Administrator email sign-in only.",
    ta: "நிர்வாகி மின்னஞ்சல் உள்நுழைவு மட்டும்.",
  },
  "auth.adminLoginPrompt": {
    en: "Administrator?",
    ta: "நிர்வாகியா?",
  },
  "auth.staffDedicatedLoginHelp": {
    en: "Staff members must use the dedicated staff login page. Ask your administrator for the link if you do not have it.",
    ta: "Staff உறுப்பினர்கள் தனிப்பட்ட staff login பக்கத்தைப் பயன்படுத்த வேண்டும். இணைப்பு இல்லை என்றால் நிர்வாகியிடம் கேளுங்கள்.",
  },
  "auth.continueToStaffLogin": { en: "Continue to staff login", ta: "Staff login-க்கு தொடரவும்" },
  "auth.staffUsernameInvalid": {
    en: "Enter a valid staff username (3–20 letters, numbers, or underscores).",
    ta: "சரியான staff username-ஐ உள்ளிடவும் (3–20 எழுத்துகள், எண்கள் அல்லது underscore).",
  },
  "auth.staffUsernameNotFound": {
    en: "Staff username not found. Contact your administrator if you need access.",
    ta: "Staff username கிடைக்கவில்லை. அணுகல் தேவைப்பட்டால் நிர்வாகியைத் தொடர்பு கொள்ளுங்கள்.",
  },
  "auth.staffEmailMismatch": {
    en: "Email does not match this staff username.",
    ta: "மின்னஞ்சல் இந்த staff username-உடன் பொருந்தவில்லை.",
  },
  "auth.staffPortalOnly": {
    en: "Use the Staff Portal login page with your staff username, email, and password.",
    ta: "Staff username, மின்னஞ்சல் மற்றும் கடவுச்சொல்லுடன் Staff Portal login பக்கத்தைப் பயன்படுத்துங்கள்.",
  },
  "auth.adminPortalOnly": {
    en: "This account is not an administrator. Use the correct login link for your role.",
    ta: "இந்த கணக்கு நிர்வாகி அல்ல. உங்கள் பாத்திரத்திற்கான சரியான login இணைப்பைப் பயன்படுத்துங்கள்.",
  },
  "auth.adminUseAdminLogin": {
    en: "Administrators must use the admin login page (email and password only). Redirecting you now…",
    ta: "நிர்வாகிகள் admin login பக்கத்தைப் பயன்படுத்த வேண்டும் (மின்னஞ்சல் மற்றும் கடவுச்சொல் மட்டும்). இப்போது அங்கே அனுப்பப்படுகிறீர்கள்…",
  },
  "auth.contentTeamLogin": { en: "Content", ta: "Content" },
  "auth.socialTrackingLogin": { en: "Social Tracking", ta: "Social Tracking" },
  "auth.signInSubStaff": {
    en: "Email sign-in for institute administrators and staff.",
    ta: "நிறுவன நிர்வாகிகள் மற்றும் staff-க்கான மின்னஞ்சல் உள்நுழைவு.",
  },
  "auth.signInSubContentTeam": {
    en: "Content team sign-in for social media tracking.",
    ta: "சமூக ஊடக கண்காணிப்புக்கான content team உள்நுழைவு.",
  },
  "auth.signInSubSocialTracking": {
    en: "Admin-assigned accounts only. You will go straight to social tracking after sign-in.",
    ta: "நிர்வாகியால் ஒதுக்கப்பட்ட கணக்குகள் மட்டும். உள்நுழைந்த பிறகு நேரடியாக social tracking-க்கு செல்வீர்கள்.",
  },
  "auth.studentIdMissingHelp": {
    en: "Don't have a Student ID yet? Contact admin for help.",
    ta: "உங்களிடம் மாணவர் அடையாளம் இல்லையா? உதவிக்கு நிர்வாகியைத் தொடர்பு கொள்ளுங்கள்.",
  },
  "auth.invalidEmail": {
    en: "Enter a valid email address.",
    ta: "சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.",
  },
  "auth.studentIdNotFound": {
    en: "Student ID not found. If you are missing your ID, contact admin.",
    ta: "மாணவர் அடையாளம் கிடைக்கவில்லை. உங்கள் அடையாளம் இல்லை என்றால் நிர்வாகியைத் தொடர்பு கொள்ளுங்கள்.",
  },
  "auth.studentIdInvalid": {
    en: "Enter a valid Student ID.",
    ta: "சரியான மாணவர் அடையாளத்தை உள்ளிடவும்.",
  },
  "auth.staffEmailOnly": {
    en: "This email is not a staff account. Use Student ID on the main login page or contact admin.",
    ta: "இந்த மின்னஞ்சல் staff கணக்கு அல்ல. முதன்மை உள்நுழைவில் Student ID-ஐப் பயன்படுத்துங்கள் அல்லது நிர்வாகியைத் தொடர்பு கொள்ளுங்கள்.",
  },
  "auth.contentTeamOnly": {
    en: "This email is not assigned for social tracking. Use the social tracking login link from your admin or contact them for access.",
    ta: "இந்த மின்னஞ்சல் social tracking-க்கு ஒதுக்கப்படவில்லை. நிர்வாகியிடமிருந்து social tracking உள்நுழைவு இணைப்பைப் பயன்படுத்துங்கள்.",
  },
  "auth.paperCenterOnly": {
    en: "Use the paper center login portal for exam paper uploads.",
    ta: "தேர்வுத் தாள் பதிவேற்றத்திற்கு paper center உள்நுழைவைப் பயன்படுத்துங்கள்.",
  },
  "auth.studentIdOnly": {
    en: "Students must sign in with Student ID on the main login page.",
    ta: "மாணவர்கள் முதன்மை உள்நுழைவில் மாணவர் அடையாளத்துடன் மட்டும் உள்நுழைய வேண்டும்.",
  },
  "auth.studentId": { en: "Student ID", ta: "மாணவர் அடையாளம்" },
  "auth.studentIdPlaceholder": { en: "Enter your Student ID", ta: "உங்கள் மாணவர் அடையாளத்தை உள்ளிடவும்" },
  "auth.secureLogin": { en: "Secure 256-bit SSL encryption", ta: "பாதுகாப்பான 256-bit SSL குறியாக்கம்" },
  "auth.signIn": { en: "Sign In", ta: "உள்நுழை" },
  "auth.emailPlaceholder": { en: "Enter your email address", ta: "உங்கள் மின்னஞ்சல் முகவரியை உள்ளிடவும்" },
  "auth.passwordPlaceholder": { en: "Enter your password", ta: "உங்கள் கடவுச்சொல்லை உள்ளிடவும்" },
  "auth.forgotPassword": { en: "Forgot password?", ta: "கடவுச்சொல் மறந்துவிட்டதா?" },
  "auth.noAccount": { en: "Don't have an account?", ta: "கணக்கு இல்லையா?" },
  "auth.createAccount": { en: "Create account", ta: "கணக்கை உருவாக்கு" },
  "auth.loginHeroTitle": { en: "Master ICT.", ta: "ICT-ஐ மேம்படுத்துங்கள்." },
  "auth.loginHeroAccent": { en: "Ace your exams.", ta: "உங்கள் தேர்வுகளில் வெற்றி பெறுங்கள்." },
  "auth.loginHeroSub": {
    en: "Join students across Sri Lanka learning with ICTF's islandwide online ICT platform.",
    ta: "ICTF-ன் தீவு முழுவதும் ஆன்லைன் ICT தளத்தில் படிக்கும் மாணவர்களுடன் சேருங்கள்.",
  },
  "auth.loginFeature1Title": { en: "Expert Video Lessons", ta: "நிபுணர் வீடியோ பாடங்கள்" },
  "auth.loginFeature1Desc": {
    en: "HD recorded lectures and structured lesson paths for O/L and A/L ICT.",
    ta: "O/L மற்றும் A/L ICT-க்கான HD பதிவு செய்யப்பட்ட விரிவுரைகள் மற்றும் கட்டமைக்கப்பட்ட பாடப் பாதைகள்.",
  },
  "auth.loginFeature2Title": { en: "Live Interactive Classes", ta: "நேரடி ஊடாடும் வகுப்புகள்" },
  "auth.loginFeature2Desc": {
    en: "Real-time sessions with instant doubt clearing and class recordings.",
    ta: "உடனடி சந்தேக தீர்வு மற்றும் வகுப்பு பதிவுகளுடன் நேரடி அமர்வுகள்.",
  },
  "auth.loginFeature3Title": { en: "AI Study Assistant", ta: "AI படிப்பு உதவியாளர்" },
  "auth.loginFeature3Desc": {
    en: "Get instant answers and revision help anytime from the ICTF portal.",
    ta: "ICTF தளத்திலிருந்து எந்நேரமும் உடனடி பதில்கள் மற்றும் மறுபரிசீலனை உதவியைப் பெறுங்கள்.",
  },
  "auth.registerHeroTitle": { en: "Join students across Sri Lanka", ta: "தீவு முழுவதும் உள்ள மாணவர்களுடன் சேருங்கள்" },
  "auth.registerHeroSub": {
    en: "Create your account and get instant access to islandwide online ICT education.",
    ta: "உங்கள் கணக்கை உருவாக்கி, தீவு முழுவதும் ஆன்லைன் ICT கல்விக்கு உடனடி அணுகலைப் பெறுங்கள்.",
  },
  "auth.registerBenefit1": {
    en: "Auto-enrolled in your class batch — attendance and portal ready from day one",
    ta: "உங்கள் வகுப்பு பாச்சில் தானாகப் பதிவு — முதல் நாளிலிருந்தே வருகை மற்றும் தளம் தயார்",
  },
  "auth.registerBenefit2": { en: "Join live interactive ICT sessions", ta: "நேரடி ஊடாடும் ICT வகுப்புகளில் சேருங்கள்" },
  "auth.registerBenefit3": { en: "Get AI-powered study help anytime", ta: "எந்நேரமும் AI படிப்பு உதவியைப் பெறுங்கள்" },
  "auth.registerBenefit4": { en: "Download study materials and notes", ta: "படிப்பு பொருட்கள் மற்றும் குறிப்புகளைப் பதிவிறக்குங்கள்" },
  "auth.studyProgram": { en: "Study program", ta: "படிப்பு நிரல்" },
  "auth.studyTrackAl": { en: "A/L ICT", ta: "A/L ICT" },
  "auth.studyTrackAlDesc": { en: "Advanced Level ICT batches", ta: "உயர் தர ICT பாச்சுகள்" },
  "auth.studyTrackGrade": { en: "Grade 10 / 11 ICT", ta: "தரம் 10 / 11 ICT" },
  "auth.studyTrackGradeDesc": { en: "O/L ICT for Grade 10 or Grade 11", ta: "தரம் 10 அல்லது 11-க்கான O/L ICT" },
  "auth.examYear": { en: "A/L Exam Year", ta: "A/L தேர்வு ஆண்டு" },
  "auth.selectExamYear": { en: "Select your A/L exam year", ta: "உங்கள் A/L தேர்வு ஆண்டைத் தேர்ந்தெடுக்கவும்" },
  "auth.ictGrade": { en: "ICT Grade", ta: "ICT தரம்" },
  "auth.grade10Ict": { en: "Grade 10 — ICT", ta: "தரம் 10 — ICT" },
  "auth.grade11Ict": { en: "Grade 11 — ICT", ta: "தரம் 11 — ICT" },
  "auth.fullNamePlaceholder": { en: "Enter your full name", ta: "உங்கள் முழு பெயரை உள்ளிடவும்" },
  "auth.usernamePlaceholder": { en: "Choose a username", ta: "பயனர் பெயரைத் தேர்ந்தெடுக்கவும்" },
  "auth.indexPlaceholder": { en: "Enter your index number", ta: "உங்கள் அட்டவணை எண்ணை உள்ளிடவும்" },
  "auth.phonePlaceholder": { en: "07X XXX XXXX", ta: "07X XXX XXXX" },
  "auth.passwordMinHint": { en: "Minimum 8 characters", ta: "குறைந்தது 8 எழுத்துகள்" },
  "auth.confirmPasswordPlaceholder": { en: "Re-enter your password", ta: "கடவுச்சொல்லை மீண்டும் உள்ளிடவும்" },
};

export function getMarketingUi(key: MarketingUiKey, locale: MarketingLocale): string {
  const entry = UI[key];
  if (locale === "si") {
    return SINHALA_UI_OVERRIDES[key] ?? entry.si ?? entry.en;
  }
  return entry[locale];
}
