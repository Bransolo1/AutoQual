"use client";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to your error tracking service here (e.g. Sentry)
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-slate-200">500</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-950">Something went wrong</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        An unexpected error occurred. Our team has been notified.
        {error.digest && (
          <span className="mt-1 block text-xs text-gray-400">Reference: {error.digest}</span>
        )}
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
