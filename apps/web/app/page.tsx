import React from "react";
import Link from "next/link";

async function getRecentNotifications() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  try {
    const response = await fetch(`${API_BASE}/notifications?userId=demo-user&limit=5`, {
      headers: { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" },
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

const cards = [
  { title: "Projects", description: "Track delivery from intake to final report." },
  { title: "Studies", description: "Run AI moderated interviews and manage sessions." },
  { title: "Insights", description: "Evidence-backed insights with approvals." },
  { title: "Notifications", description: "Assignments, approvals, and reminders." },
];

const stats = [
  { label: "Simple steps", value: "4" },
  { label: "Insight stages", value: "5" },
  { label: "Speed options", value: "3" },
  { label: "Your workspaces", value: "∞" },
];

const features = [
  {
    title: "Smart inference",
    description: "Auto-coded themes and insights with defensible defaults.",
  },
  {
    title: "Runs in the background",
    description: "Processing and review workflows keep moving without blocking.",
  },
  {
    title: "Sensible defaults",
    description: "Templates, milestones, and roles set up the pipeline fast.",
  },
  {
    title: "Evidence traceability",
    description: "Video clips and transcript spans attached to every insight.",
  },
  {
    title: "Clear diagnostics",
    description: "Review states, comments, and diffs show what changed and why.",
  },
  {
    title: "One-click export",
    description: "Export reports to Markdown, JSON, or PPT outline.",
  },
];

const steps = [
  {
    number: "01",
    title: "Intake",
    description: "Create a project, set goals, and auto-generate milestones.",
  },
  {
    number: "02",
    title: "Fieldwork",
    description: "Run moderated sessions with secure video capture.",
  },
  {
    number: "03",
    title: "Analysis",
    description: "Generate themes and insights with evidence traceability.",
  },
  {
    number: "04",
    title: "Delivery",
    description: "Review, approve, and export deliverables for clients.",
  },
];

export default async function HomePage() {
  const recentNotifications: { id: string; type: string; payload: Record<string, unknown>; createdAt: string }[] =
    await getRecentNotifications();
  return (
    <main className="min-h-screen px-8 py-10">
      <div className="rounded-2xl gradient-bg p-8 text-white">
        <p className="text-sm uppercase tracking-wide text-white/80">Guided · enterprise ready</p>
        <h1 className="mt-3 text-4xl font-semibold">Sensehub Auto Qual</h1>
        <p className="mt-2 text-lg">
          Enterprise AI qualitative research with built-in delivery management.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/projects"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950"
          >
            View Projects
          </Link>
          <Link
            href="/studies"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Explore Features
          </Link>
          <Link
            href="/client"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Client Portal
          </Link>
          <Link
            href="/ops"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Ops Dashboard
          </Link>
          <Link
            href="/interview"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Interview Capture
          </Link>
          <Link
            href="/insights"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Insights Review
          </Link>
          <Link
            href="/evidence"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Evidence Viewer
          </Link>
          <Link
            href="/notifications"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Notifications
          </Link>
          <Link
            href="/embed-test"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Embed Test
          </Link>
        </div>
        <div className="mt-6 grid gap-4 rounded-2xl bg-white/10 p-4 text-white md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="text-2xl font-semibold">{stat.value}</p>
              <p className="text-xs uppercase tracking-wide text-white/80">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">What you get</h2>
        <p className="mt-2 text-sm text-gray-600">Clear outcomes without the jargon.</p>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">How it works</h2>
        <p className="mt-2 text-sm text-gray-600">Four steps from intake to delivery.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                {step.number}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10 grid gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.title} className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">{card.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold">Recent activity</h2>
        <p className="mt-2 text-sm text-gray-600">Latest assignments, approvals, and reminders.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {recentNotifications.length === 0 && (
            <div className="rounded-2xl bg-white p-6 text-sm text-gray-500 shadow-sm">
              No recent notifications yet.
            </div>
          )}
          {recentNotifications.map((notification) => (
            <div key={notification.id} className="rounded-2xl bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                  {notification.type}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(notification.createdAt).toLocaleString()}
                </span>
              </div>
              <pre className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                {JSON.stringify(notification.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
