"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">End-to-End Demo</h1>
      <p className="mt-2 text-sm text-gray-600">
        Guided path through intake → fieldwork → insights → approvals → delivery.
      </p>
      <div className="mt-6 grid gap-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">1. Project intake</h2>
          <p className="mt-2 text-sm text-gray-600">Create and review milestones + tasks.</p>
          <Link href="/projects" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Projects →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">2. Study builder</h2>
          <p className="mt-2 text-sm text-gray-600">
            Generate interview guides, screening, and synthetic previews.
          </p>
          <Link href="/studies" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Studies →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">3. Interview capture</h2>
          <p className="mt-2 text-sm text-gray-600">Record and upload a session video.</p>
          <Link href="/interview" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Interview Capture →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">4. Evidence + insights</h2>
          <p className="mt-2 text-sm text-gray-600">Review clips, insight statements, and evidence.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/evidence" className="text-brand-600 hover:underline">
              Evidence Viewer →
            </Link>
            <Link href="/insights" className="text-brand-600 hover:underline">
              Insights →
            </Link>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">5. Approvals</h2>
          <p className="mt-2 text-sm text-gray-600">Create, review, and decide approvals.</p>
          <Link href="/approvals" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Approvals →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">6. Reports</h2>
          <p className="mt-2 text-sm text-gray-600">Preview segment and theme summaries.</p>
          <Link href="/reports" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Reports →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">7. Search</h2>
          <p className="mt-2 text-sm text-gray-600">Search insights across studies.</p>
          <Link href="/search" className="mt-3 inline-block text-sm text-brand-600 hover:underline">
            Go to Search →
          </Link>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold">8. Ops + audit</h2>
          <p className="mt-2 text-sm text-gray-600">Check workload, blockers, and audit trail.</p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            <Link href="/ops" className="text-brand-600 hover:underline">
              Ops Dashboard →
            </Link>
            <Link href="/audit" className="text-brand-600 hover:underline">
              Audit Log →
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
