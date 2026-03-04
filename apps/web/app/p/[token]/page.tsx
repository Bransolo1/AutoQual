"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type ScreeningQuestion = { id: string; label: string; type: "text" | "radio" | "checkbox"; options?: string[] };
type ScreenOutRule = { field: string; operator: string; value: string; condition: string };
type ScreeningLogic = { screeningQuestions: ScreeningQuestion[]; screenOutRules: ScreenOutRule[] };
type Question = { id: string; prompt: string; type: string; followUp: string | null };
type StudyInfo = {
  studyId: string;
  studyName: string;
  mode: string;
  language: string;
  estimatedMinutes: number;
  questions: Question[];
  screeningLogic: ScreeningLogic | null;
};

type WelcomeStep = "welcome" | "screening" | "disqualified";

function evaluateScreening(
  rules: ScreenOutRule[],
  answers: Record<string, string>,
): boolean /* screened out */ {
  return rules.some((rule) => {
    const val = (answers[rule.field] ?? "").toLowerCase();
    const target = (rule.value ?? "").toLowerCase();
    const matches =
      rule.operator === "equals" ? val === target :
      rule.operator === "not_equals" ? val !== target :
      rule.operator === "contains" ? val.includes(target) :
      rule.operator === "is_empty" ? val === "" :
      false;
    return matches && rule.condition === "screen_out";
  });
}

export default function ParticipantWelcomePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();

  const [study, setStudy] = useState<StudyInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [starting, setStarting] = useState(false);
  const [welcomeStep, setWelcomeStep] = useState<WelcomeStep>("welcome");
  const [screenAnswers, setScreenAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!token) return;
    fetch(`/api/p/study-info?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: StudyInfo | null) => {
        if (data) {
          setStudy(data);
          sessionStorage.setItem(`study:${token}`, JSON.stringify(data));
        } else {
          setError("This interview link is invalid or has expired.");
        }
      })
      .catch(() => setError("Unable to load interview. Please check the link and try again."));
  }, [token]);

  async function handleConsentSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consented || !study) return;
    const hasScreening = study.screeningLogic?.screeningQuestions?.length ?? 0;
    if (hasScreening > 0) {
      setWelcomeStep("screening");
    } else {
      await beginInterview(false);
    }
  }

  async function handleScreeningSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!study?.screeningLogic) return;
    const screenedOut = evaluateScreening(study.screeningLogic.screenOutRules, screenAnswers);
    if (screenedOut) {
      // Record disqualified session and show disqualification message
      await fetch("/api/p/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email: email.trim() || undefined, screened: true }),
      }).catch(() => undefined);
      setWelcomeStep("disqualified");
    } else {
      await beginInterview(false);
    }
  }

  async function beginInterview(screened: boolean) {
    if (!study) return;
    setStarting(true);
    const res = await fetch("/api/p/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, email: email.trim() || undefined, screened }),
    });
    if (!res.ok) {
      setError("Failed to start session. Please try again.");
      setStarting(false);
      return;
    }
    const { sessionId } = await res.json();
    sessionStorage.setItem(`session:${token}`, sessionId);
    router.push(`/p/${token}/q/0`);
  }

  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-900">Link unavailable</h1>
          <p className="mt-2 text-sm text-slate-500">{error}</p>
        </div>
      </main>
    );
  }

  if (!study) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </main>
    );
  }

  // ── Disqualified ────────────────────────────────────────────────────────────
  if (welcomeStep === "disqualified") {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
            Sensehub Research
          </p>
          <div className="rounded-2xl bg-white p-8 shadow-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100">
              <svg className="h-6 w-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900">Thank you for your interest</h1>
            <p className="mt-3 text-sm text-slate-500">
              Based on your responses, you don't meet the criteria for this particular study. This is not a reflection of anything personal — we simply need specific experience for this research.
            </p>
            <p className="mt-4 text-sm text-slate-400">You may close this window.</p>
          </div>
        </div>
      </main>
    );
  }

  // ── Screening form ──────────────────────────────────────────────────────────
  if (welcomeStep === "screening") {
    const questions = study.screeningLogic?.screeningQuestions ?? [];
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6">
        <div className="w-full max-w-lg">
          <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
            Sensehub Research
          </p>
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            <h1 className="text-xl font-bold text-slate-900">A few quick questions</h1>
            <p className="mt-2 text-sm text-slate-500">
              Help us make sure this study is the right fit for you.
            </p>
            <form onSubmit={handleScreeningSubmit} className="mt-6 space-y-5">
              {questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium text-slate-700">{q.label}</label>
                  {q.type === "text" && (
                    <input
                      type="text"
                      value={screenAnswers[q.id] ?? ""}
                      onChange={(e) => setScreenAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                    />
                  )}
                  {q.type === "radio" && q.options?.map((opt) => (
                    <label key={opt} className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="radio"
                        name={q.id}
                        value={opt}
                        checked={screenAnswers[q.id] === opt}
                        onChange={() => setScreenAnswers((prev) => ({ ...prev, [q.id]: opt }))}
                        className="accent-slate-800"
                      />
                      {opt}
                    </label>
                  ))}
                  {q.type === "checkbox" && q.options?.map((opt) => (
                    <label key={opt} className="mt-2 flex cursor-pointer items-center gap-2 text-sm text-slate-600">
                      <input
                        type="checkbox"
                        checked={(screenAnswers[q.id] ?? "").split(",").includes(opt)}
                        onChange={(e) => {
                          const current = (screenAnswers[q.id] ?? "").split(",").filter(Boolean);
                          const next = e.target.checked ? [...current, opt] : current.filter((v) => v !== opt);
                          setScreenAnswers((prev) => ({ ...prev, [q.id]: next.join(",") }));
                        }}
                        className="accent-slate-800"
                      />
                      {opt}
                    </label>
                  ))}
                </div>
              ))}
              <button
                type="submit"
                disabled={starting}
                className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
              >
                {starting ? "Checking…" : "Continue →"}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  // ── Welcome / consent ───────────────────────────────────────────────────────
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <p className="mb-6 text-center text-xs font-medium uppercase tracking-widest text-slate-400">
          Sensehub Research
        </p>
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">{study.studyName}</h1>
          <p className="mt-2 text-sm text-slate-500">
            This interview takes approximately{" "}
            <strong className="text-slate-700">{study.estimatedMinutes} minutes</strong>. Your
            responses are confidential and used only for research purposes.
          </p>
          <ul className="mt-5 space-y-2">
            {[
              "Choose a quiet space with good lighting.",
              "Allow microphone access if prompted.",
              "Answer each question in your own words — there are no wrong answers.",
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 text-sm text-slate-600">
                <span className="mt-0.5 text-green-500">✓</span>
                {tip}
              </li>
            ))}
          </ul>
          <form onSubmit={handleConsentSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Your email address <span className="text-slate-400">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                Only used to send you a copy of the summary if requested.
              </p>
            </div>
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-slate-800"
              />
              <span className="text-sm text-slate-600">
                I understand my responses will be recorded and used for research purposes in accordance with the{" "}
                <a href="/legal/privacy" target="_blank" className="underline hover:text-slate-900">
                  privacy policy
                </a>.
              </span>
            </label>
            <button
              type="submit"
              disabled={!consented || starting}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {starting ? "Starting…" : study.screeningLogic?.screeningQuestions?.length ? "Continue →" : "Begin interview →"}
            </button>
          </form>
        </div>
        <p className="mt-4 text-center text-xs text-slate-400">
          {study.questions.length} question{study.questions.length !== 1 ? "s" : ""}
        </p>
      </div>
    </main>
  );
}
