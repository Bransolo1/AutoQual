"use client";
import { useEffect, useState } from "react";

const CONSENT_KEY = "sh_cookie_consent";

type ConsentStatus = "accepted" | "declined" | null;

export function CookieConsent() {
  const [status, setStatus] = useState<ConsentStatus | "loading">("loading");

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY) as ConsentStatus | null;
    setStatus(stored);
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, "accepted");
    setStatus("accepted");
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, "declined");
    setStatus("declined");
  }

  if (status === "loading" || status !== null) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white/95 px-6 py-4 shadow-lg backdrop-blur sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-sm sm:rounded-2xl sm:border"
    >
      <p className="text-sm text-gray-700">
        We use a single session cookie to keep you signed in. We don&apos;t use advertising or
        tracking cookies.{" "}
        <a href="/legal/privacy" className="underline hover:text-slate-900">
          Privacy policy
        </a>
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={accept}
          className="flex-1 rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Accept
        </button>
        <button
          type="button"
          onClick={decline}
          className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
        >
          Decline
        </button>
      </div>
    </div>
  );
}
