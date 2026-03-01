"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useMemo } from "react";

export default function ParticipantPage() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") ?? "", [searchParams]);
  const studyId = useMemo(() => searchParams.get("studyId") ?? "", [searchParams]);
  const interviewHref = token ? `/interview?token=${encodeURIComponent(token)}` : "/interview";

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-900">Welcome to your interview</h1>
          <p className="mt-2 text-sm text-slate-600">
            Thank you for participating. Your responses will be kept confidential and used for research purposes
            only.
          </p>
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">Before you begin</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Choose a quiet space and allow 5–7 minutes.</li>
              <li>Use headphones if possible for clearer audio.</li>
              <li>Keep your camera at eye level for the best experience.</li>
            </ul>
            {studyId && <p className="mt-2 text-xs text-slate-500">Study ID: {studyId}</p>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={interviewHref}
              className="rounded-full bg-brand-500 px-5 py-2 text-sm font-medium text-white"
            >
              Start interview
            </Link>
            <span className="text-xs text-slate-500">
              If prompted, please allow camera and microphone access.
            </span>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
          <p className="font-semibold text-slate-900">Need help?</p>
          <p className="mt-2">
            If you have technical issues, refresh the page and re-run the device check. You can stop and restart
            the interview at any time.
          </p>
        </div>
      </div>
    </main>
  );
}
