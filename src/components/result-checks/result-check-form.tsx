"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getActionErrorMessage } from "@/lib/action-error";
import { checkStudentResult, type ResultLookupResponse } from "@/lib/actions/results-check-public";
import { useMarketingText } from "@/hooks/use-marketing-text";
import { ResultRevealPanel } from "@/components/result-checks/result-reveal-panel";

interface ResultCheckFormProps {
  slug?: string;
}

type SuccessResult = Extract<ResultLookupResponse, { ok: true }>;

export function ResultCheckForm({ slug }: ResultCheckFormProps) {
  const { t } = useMarketingText();
  const [username, setUsername] = useState("");
  const [studentId, setStudentId] = useState("");
  const [website, setWebsite] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SuccessResult | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (username.trim().length < 2) {
      setError(t("results.checkUsernameLabel"));
      return;
    }
    if (studentId.trim().length < 2) {
      setError(t("results.checkStudentIdLabel"));
      return;
    }
    setSubmitting(true);
    try {
      const response = await checkStudentResult({
        slug,
        username: username.trim(),
        studentId: studentId.trim(),
        website,
      });
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setResult(response);
    } catch (e) {
      setError(getActionErrorMessage(e, "Something went wrong. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  const reset = () => {
    setResult(null);
    setUsername("");
    setStudentId("");
    setError(null);
  };

  return (
    <AnimatePresence mode="wait">
      {result ? (
        <motion.div
          key="result"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <ResultRevealPanel student={result.student} results={result.results} onReset={reset} />
        </motion.div>
      ) : (
        <motion.div
          key="form"
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 12 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="flex flex-col gap-4 text-left"
        >
          <div className="space-y-2">
            <Label htmlFor="result-check-username">{t("results.checkUsernameLabel")}</Label>
            <Input
              id="result-check-username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder={t("results.checkUsernameLabel")}
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="result-check-student-id">{t("results.checkStudentIdLabel")}</Label>
            <Input
              id="result-check-student-id"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder={t("results.checkStudentIdLabel")}
              autoComplete="off"
            />
          </div>
          <div className="absolute left-[-9999px]" aria-hidden="true">
            <label htmlFor="result-check-website">Website</label>
            <input
              id="result-check-website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button disabled={submitting} onClick={() => void handleSubmit()}>
            {submitting ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Search className="mr-2 size-4" />
            )}
            {t("results.checkSubmit")}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
