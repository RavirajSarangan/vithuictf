"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, School } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { authFieldClassName, authSelectTriggerClassName } from "@/components/auth/auth-field-styles";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { checkUsernameAvailable } from "@/lib/actions/auth";
import { getRegistrationBackendStatus } from "@/lib/actions/registration-status";
import { useCourses } from "@/hooks/use-data";
import { useMarketingText } from "@/hooks/use-marketing-text";
import {
  EXAM_YEARS,
  formatNicInput,
  normalizeUsername,
  validateRegisterStudent,
  type IctGrade,
  type RegisterStudentInput,
  type StudyTrack,
} from "@/lib/validation/register-student";
import {
  getRegistrationCourses,
  isCourseEligibleForStudyTrack,
  pickDefaultRegistrationCourse,
} from "@/lib/registration/course-options";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface StudentRegisterFormProps {
  idPrefix?: string;
}

function RequiredLabel({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return (
    <Label htmlFor={htmlFor} className="text-sm font-semibold text-icvf-navy">
      {children} <span className="text-red-500">*</span>
    </Label>
  );
}

function StudyTrackCard({
  active,
  title,
  description,
  icon: Icon,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  icon: typeof GraduationCap;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-1 flex-col items-start rounded-xl border-2 p-4 text-left transition-all",
        active
          ? "border-icvf-accent bg-icvf-accent/10 ring-1 ring-icvf-accent/25"
          : "border-icvf-border bg-white hover:border-icvf-accent/35"
      )}
    >
      <Icon className={cn("size-5", active ? "text-icvf-accent" : "text-icvf-text-light")} />
      <p className="mt-3 text-sm font-semibold text-icvf-navy">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-icvf-text-light">{description}</p>
    </button>
  );
}

export function StudentRegisterForm({ idPrefix = "register" }: StudentRegisterFormProps) {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [nicNumber, setNicNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [studyTrack, setStudyTrack] = useState<StudyTrack>("al");
  const [examYear, setExamYear] = useState("");
  const [ictGrade, setIctGrade] = useState<IctGrade | "">("");
  const [courseId, setCourseId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [missingServiceRole, setMissingServiceRole] = useState(false);
  const [usernameCheck, setUsernameCheck] = useState<"available" | "taken" | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);

  const { signUp } = useAuth();
  const router = useRouter();
  const { t } = useMarketingText();
  const courses = useCourses();

  const registrationCourses = useMemo(
    () => getRegistrationCourses(courses, studyTrack),
    [courses, studyTrack]
  );

  const selectedCourse =
    registrationCourses.find((course) => course.id === courseId) ??
    courses.find((course) => course.id === courseId);

  useEffect(() => {
    const defaultCourse = pickDefaultRegistrationCourse(
      courses,
      studyTrack,
      studyTrack === "grade" ? (ictGrade as IctGrade) || undefined : undefined
    );
    if (!defaultCourse) {
      setCourseId("");
      return;
    }
    setCourseId((current) =>
      current && isCourseEligibleForStudyTrack(current, courses, studyTrack)
        ? current
        : defaultCourse.id
    );
  }, [courses, studyTrack, ictGrade]);

  useEffect(() => {
    void getRegistrationBackendStatus()
      .then((status) => {
        setMissingServiceRole(status.missingServiceRole);
      })
      .catch(() => {
        setMissingServiceRole(false);
      });
  }, []);

  const normalizedUsername = normalizeUsername(username);
  const usernameStatus =
    normalizedUsername.length < 3
      ? "idle"
      : checkingUsername
        ? "checking"
        : usernameCheck === "available"
          ? "available"
          : usernameCheck === "taken"
            ? "taken"
            : "idle";

  const handleUsernameBlur = async () => {
    if (normalizedUsername.length < 3) {
      setUsernameCheck(null);
      return;
    }

    setCheckingUsername(true);
    try {
      const available = await checkUsernameAvailable(normalizedUsername);
      setUsernameCheck(available ? "available" : "taken");
    } catch {
      setUsernameCheck(null);
    } finally {
      setCheckingUsername(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error(t("auth.passwordMismatch"));
      return;
    }

    const input: RegisterStudentInput = {
      displayName: name.trim(),
      username: username.trim(),
      nicNumber: nicNumber.trim(),
      phone: phone.trim() || undefined,
      studyTrack,
      examYear: studyTrack === "al" ? examYear : undefined,
      ictGrade: studyTrack === "grade" ? (ictGrade as IctGrade) : undefined,
      courseId,
      courseName: selectedCourse?.name ?? "",
      email: email.trim().toLowerCase(),
      password,
    };

    const validationError = validateRegisterStudent(input);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    if (!isCourseEligibleForStudyTrack(courseId, courses, studyTrack)) {
      toast.error(t("auth.registerCourseMismatch"));
      return;
    }

    if (usernameStatus === "taken") {
      toast.error(t("auth.usernameTaken"));
      return;
    }

    setLoading(true);
    try {
      await signUp(input);
      toast.success(t("auth.registerSuccess"));
      router.push("/onboarding");
    } catch (err) {
      const message =
        err instanceof Error && err.message.includes("Server Components render")
          ? t("auth.registerFailed")
          : err instanceof Error
            ? err.message
            : t("auth.registerFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {missingServiceRole ? (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-50 p-3 text-sm text-amber-900">
          Registration backend is incomplete. Add{" "}
          <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> to{" "}
          <code className="text-xs">.env.local</code>, then restart{" "}
          <code className="text-xs">npm run dev</code>.
        </div>
      ) : null}

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-icvf-navy sm:text-3xl">{t("auth.registerHeading")}</h1>
        <p className="mt-2 text-sm text-icvf-text-light sm:text-base">{t("auth.registerSub")}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <RequiredLabel htmlFor={`${idPrefix}-name`}>{t("auth.fullName")}</RequiredLabel>
            <Input
              id={`${idPrefix}-name`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={authFieldClassName}
              placeholder={t("auth.fullNamePlaceholder")}
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <RequiredLabel htmlFor={`${idPrefix}-username`}>{t("auth.username")}</RequiredLabel>
            <Input
              id={`${idPrefix}-username`}
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.replace(/\s/g, ""));
                setUsernameCheck(null);
              }}
              onBlur={() => void handleUsernameBlur()}
              className={authFieldClassName}
              placeholder={t("auth.usernamePlaceholder")}
              autoComplete="username"
              required
            />
            {usernameStatus === "checking" ? (
              <p className="text-xs text-icvf-text-light">Checking availability…</p>
            ) : null}
            {usernameStatus === "available" ? (
              <p className="text-xs text-icvf-success">{t("auth.usernameAvailable")}</p>
            ) : null}
            {usernameStatus === "taken" ? (
              <p className="text-xs text-red-600">{t("auth.usernameTaken")}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <RequiredLabel htmlFor={`${idPrefix}-nic`}>{t("auth.nicNumber")}</RequiredLabel>
            <Input
              id={`${idPrefix}-nic`}
              value={nicNumber}
              onChange={(e) => setNicNumber(formatNicInput(e.target.value))}
              className={authFieldClassName}
              placeholder={t("auth.nicNumberPlaceholder")}
              autoComplete="off"
              inputMode="text"
              required
            />
            <p className="text-xs text-icvf-text-light">{t("auth.nicNumberHint")}</p>
          </div>

          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor={`${idPrefix}-phone`} className="text-sm font-semibold text-icvf-navy">
              {t("auth.phone")}
            </Label>
            <Input
              id={`${idPrefix}-phone`}
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={authFieldClassName}
              placeholder={t("auth.phonePlaceholder")}
            />
          </div>
        </div>

        <p className="rounded-xl border border-icvf-accent/25 bg-icvf-accent/8 px-4 py-3 text-sm text-icvf-navy">
          {t("auth.indexAutoNote")}
        </p>

        <div className="flex flex-col gap-3">
          <RequiredLabel htmlFor={`${idPrefix}-study-track`}>{t("auth.studyProgram")}</RequiredLabel>
          <div id={`${idPrefix}-study-track`} className="flex flex-col gap-3 sm:flex-row">
            <StudyTrackCard
              active={studyTrack === "al"}
              title={t("auth.studyTrackAl")}
              description={t("auth.studyTrackAlDesc")}
              icon={GraduationCap}
              onClick={() => setStudyTrack("al")}
            />
            <StudyTrackCard
              active={studyTrack === "grade"}
              title={t("auth.studyTrackGrade")}
              description={t("auth.studyTrackGradeDesc")}
              icon={School}
              onClick={() => setStudyTrack("grade")}
            />
          </div>
        </div>

        {studyTrack === "al" ? (
          <div className="flex flex-col gap-2">
            <RequiredLabel htmlFor={`${idPrefix}-exam-year`}>{t("auth.examYear")}</RequiredLabel>
            <Select value={examYear} onValueChange={(value) => setExamYear(value ?? "")}>
              <SelectTrigger id={`${idPrefix}-exam-year`} className={authSelectTriggerClassName}>
                <SelectValue placeholder={t("auth.selectExamYear")} />
              </SelectTrigger>
              <SelectContent>
                {EXAM_YEARS.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <RequiredLabel htmlFor={`${idPrefix}-ict-grade`}>{t("auth.ictGrade")}</RequiredLabel>
            <div id={`${idPrefix}-ict-grade`} className="grid gap-3 sm:grid-cols-2">
              {(["grade_10", "grade_11"] as const).map((grade) => (
                <button
                  key={grade}
                  type="button"
                  onClick={() => setIctGrade(grade)}
                  className={cn(
                    "rounded-xl border-2 px-4 py-3 text-left text-sm font-semibold transition-all",
                    ictGrade === grade
                      ? "border-icvf-accent bg-icvf-accent/10 text-icvf-navy"
                      : "border-icvf-border bg-icvf-surface text-icvf-navy hover:border-icvf-accent/35"
                  )}
                >
                  {grade === "grade_10" ? t("auth.grade10Ict") : t("auth.grade11Ict")}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <RequiredLabel htmlFor={`${idPrefix}-course`}>{t("auth.course")}</RequiredLabel>
          {registrationCourses.length === 0 ? (
            <p className="rounded-xl border border-amber-500/30 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {t("auth.registerNoCoursesForTrack")}
            </p>
          ) : registrationCourses.length === 1 && selectedCourse ? (
            <div
              id={`${idPrefix}-course`}
              className="rounded-xl border border-icvf-border bg-icvf-surface/60 px-4 py-3"
            >
              <p className="text-sm font-semibold text-icvf-navy">{selectedCourse.name}</p>
              <p className="mt-1 text-xs text-icvf-text-light">{t("auth.registerCourseAuto")}</p>
            </div>
          ) : (
            <Select value={courseId || null} onValueChange={(value) => setCourseId(value ?? "")}>
              <SelectTrigger id={`${idPrefix}-course`} className={authSelectTriggerClassName}>
                <SelectValue placeholder={t("auth.selectCourse")} />
              </SelectTrigger>
              <SelectContent>
                {registrationCourses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <p className="text-xs leading-relaxed text-icvf-text-light">
            {t("auth.registerCourseMultiNote")}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2 sm:col-span-2">
            <RequiredLabel htmlFor={`${idPrefix}-email`}>{t("auth.email")}</RequiredLabel>
            <Input
              id={`${idPrefix}-email`}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={authFieldClassName}
              placeholder={t("auth.emailPlaceholder")}
              required
            />
          </div>

          <PasswordField
            id={`${idPrefix}-password`}
            label={t("auth.password")}
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            inputClassName={cn(authFieldClassName, "pr-11")}
            placeholder={t("auth.passwordMinHint")}
          />

          <PasswordField
            id={`${idPrefix}-confirm-password`}
            label={t("auth.confirmPassword")}
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
            minLength={8}
            inputClassName={cn(authFieldClassName, "pr-11")}
            placeholder={t("auth.confirmPasswordPlaceholder")}
          />
        </div>

        <Button
          type="submit"
          variant="icvf"
          className="h-12 w-full rounded-xl text-base font-semibold"
          disabled={loading || missingServiceRole || usernameStatus === "taken" || registrationCourses.length === 0}
        >
          {loading ? t("auth.registering") : t("auth.createAccount")}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-icvf-text-light">
        {t("auth.haveAccount")}{" "}
        <Link href="/login" className="font-semibold text-icvf-navy hover:text-icvf-accent hover:underline">
          {t("auth.signIn")}
        </Link>
      </p>
    </>
  );
}
