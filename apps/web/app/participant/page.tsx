"use client";

import React, { useMemo, useState, useCallback, FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex < 1) return false;
  const domain = trimmed.slice(atIndex + 1);
  return domain.includes(".") && domain.indexOf(".") < domain.length - 1;
}

export default function ParticipantPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const studyId = useMemo(() => searchParams.get("studyId") ?? "", [searchParams]);

  const [email, setEmail] = useState("");
  const [consented, setConsented] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailValid = isValidEmail(email);
  const canSubmit = emailValid && consented;

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      if (!isValidEmail(email)) {
        setEmailError("Please enter a valid email address");
        return;
      }
      setEmailError(null);
      const href = token
        ? `/interview?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email.trim())}`
        : `/interview?email=${encodeURIComponent(email.trim())}`;
      router.push(href);
    },
    [email, token, router],
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-slate-50 px-6 py-12">
      <div className="mx-auto max-w-3xl">
        {/* Hero */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50">
            <span className="text-3xl">💬</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome to your research interview
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base text-slate-500">
            You&rsquo;ll have a conversation with our AI research assistant. It takes about 5–7 minutes.
          </p>
        </div>

        {/* Instruction cards */}
        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
              🗣️
            </div>
            <h3 className="font-semibold text-slate-900">Speak naturally</h3>
            <p className="mt-1 text-sm text-slate-500">
              Answer in your own words. There are no right or wrong answers.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
              ⏳
            </div>
            <h3 className="font-semibold text-slate-900">Take your time</h3>
            <p className="mt-1 text-sm text-slate-500">
              The AI will wait for you to finish before moving on.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-lg">
              🎯
            </div>
            <h3 className="font-semibold text-slate-900">Be specific</h3>
            <p className="mt-1 text-sm text-slate-500">
              Share real examples and experiences when you can.
            </p>
          </div>
        </div>

        {/* Before you start */}
        <div className="mt-8 rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Before you start
          </h2>
          <ul className="mt-4 space-y-3">
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-600">
                🎤
              </span>
              Allow microphone access when prompted
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-600">
                🔇
              </span>
              Use a quiet space for best results
            </li>
            <li className="flex items-start gap-3 text-sm text-slate-600">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs text-brand-600">
                🔒
              </span>
              Your responses are recorded and kept confidential
            </li>
          </ul>
          {studyId && <p className="mt-4 text-xs text-slate-400">Study ID: {studyId}</p>}
        </div>

        {/* Email + Consent + CTA */}
        <form onSubmit={handleSubmit} className="mt-10">
          <div className="mx-auto max-w-md space-y-6">
            {/* Email input */}
            <div>
              <label htmlFor="participant-email" className="block text-sm font-medium text-slate-700">
                Your email
              </label>
              <input
                id="participant-email"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                className="mt-1 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
              {emailError && (
                <p className="mt-1 text-xs text-red-600">{emailError}</p>
              )}
            </div>

            {/* Consent checkbox */}
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consented}
                onChange={(e) => setConsented(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-sm text-slate-600">
                I agree to participate in this research interview and understand my responses will be recorded.
              </span>
            </label>

            {/* CTA */}
            <div className="text-center">
              <button
                type="submit"
                disabled={!canSubmit}
                className="inline-flex items-center justify-center rounded-full bg-brand-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-brand-500/25 transition-all hover:bg-brand-600 hover:shadow-xl hover:shadow-brand-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Begin interview
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <p className="mt-12 text-center text-xs text-slate-400">
          Powered by <span className="font-medium text-slate-500">OpenQual</span> — open-source qualitative research
        </p>
      </div>
    </main>
  );
}
