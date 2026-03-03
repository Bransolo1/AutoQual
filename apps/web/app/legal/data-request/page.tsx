"use client";
import { useState } from "react";

type RequestType = "access" | "erasure" | "rectification" | "portability" | "objection";

const REQUEST_LABELS: Record<RequestType, string> = {
  access: "Access my data",
  erasure: "Erase my data (right to be forgotten)",
  rectification: "Correct inaccurate data",
  portability: "Download my data",
  objection: "Object to processing",
};

export default function DataRequestPage() {
  const [type, setType] = useState<RequestType>("access");
  const [email, setEmail] = useState("");
  const [details, setDetails] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    try {
      const res = await fetch("/api/legal/data-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, email, details }),
      });
      if (res.ok) {
        setStatus("done");
        setMessage("Your request has been submitted. We will respond within 30 days.");
      } else {
        setStatus("error");
        setMessage("Failed to submit. Please email privacy@sensehub.app directly.");
      }
    } catch {
      setStatus("error");
      setMessage("Failed to submit. Please email privacy@sensehub.app directly.");
    }
  }

  return (
    <main className="mx-auto max-w-xl px-6 py-16">
      <h1 className="text-2xl font-bold text-slate-950">Data subject request</h1>
      <p className="mt-2 text-sm text-gray-500">
        Exercise your rights under GDPR / UK GDPR. We respond within 30 days.
      </p>

      {status === "done" ? (
        <div className="mt-8 rounded-xl bg-green-50 p-6 text-sm text-green-800">{message}</div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Request type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RequestType)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              {Object.entries(REQUEST_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Your email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={4}
              placeholder="Describe the data you want us to action."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>

          {status === "error" && message && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{message}</p>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {status === "submitting" ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}
    </main>
  );
}
