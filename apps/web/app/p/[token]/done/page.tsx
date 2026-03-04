"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function DonePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const [studyName, setStudyName] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve study name from sessionStorage
    const cached = sessionStorage.getItem(`study:${token}`);
    if (cached) {
      const study = JSON.parse(cached) as { studyName: string };
      setStudyName(study.studyName);
    }

    // Notify completion
    const sessionId = sessionStorage.getItem(`session:${token}`);
    if (token && sessionId) {
      fetch("/api/p/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId }),
      }).catch(() => undefined);
    }

    // Clear session storage
    sessionStorage.removeItem(`study:${token}`);
    sessionStorage.removeItem(`session:${token}`);
  }, [token]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <div className="w-full max-w-md">
        {/* Checkmark */}
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">Thank you!</h1>
        <p className="mt-3 text-sm text-slate-500">
          Your responses for{" "}
          {studyName ? <strong className="text-slate-700">{studyName}</strong> : "this study"} have
          been recorded. We appreciate your time.
        </p>

        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs text-slate-400">
            Your answers are stored securely and will be analysed alongside other participants to
            generate insights. No personally identifiable information will be shared without your
            explicit consent.
          </p>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          Powered by{" "}
          <span className="font-medium text-slate-600">Sensehub</span>
        </p>
      </div>
    </main>
  );
}
