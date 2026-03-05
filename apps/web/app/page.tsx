import React from "react";
import Link from "next/link";
import { API_BASE, HEADERS } from "@/lib/api";

async function getRecentNotifications() {
  try {
    const response = await fetch(`${API_BASE}/notifications?userId=demo-user&limit=5`, {
      headers: HEADERS,
      cache: "no-store",
    });
    if (!response.ok) return [];
    return await response.json();
  } catch {
    return [];
  }
}

const cards = [
  { title: "Studies", description: "Design discussion guides with per-question LLM prompts." },
  { title: "Interviews", description: "AI-moderated sessions using your own API key." },
  { title: "Insights", description: "Evidence-backed findings with reviewer approval workflows." },
  { title: "Settings", description: "Configure your OpenAI or Anthropic API key." },
];

const stats = [
  { label: "Per interview", value: "~$0.50" },
  { label: "LLM support", value: "GPT-4o / Claude" },
  { label: "Study wizard", value: "7-step" },
  { label: "Open source", value: "100%" },
];

const features = [
  {
    title: "Bring your own key",
    description: "Use your OpenAI or Anthropic API key. No markup. Pay only what the LLM charges.",
  },
  {
    title: "Prompt framework",
    description: "Craft system prompts and per-question instructions that guide the AI interviewer.",
  },
  {
    title: "Auto interviews",
    description: "The LLM conducts structured qualitative interviews following your discussion guide.",
  },
  {
    title: "Evidence traceability",
    description: "Every insight links back to transcript spans and session recordings.",
  },
  {
    title: "Insight engine",
    description: "Auto-coded themes, confidence scores, and reviewer workflows.",
  },
  {
    title: "Export anything",
    description: "Markdown, JSON, PPT outlines, and evidence bundles — one click.",
  },
];

const steps = [
  {
    number: "01",
    title: "Design",
    description: "Create a study, write your discussion guide, and set system prompts for the LLM.",
  },
  {
    number: "02",
    title: "Interview",
    description: "Participants interact with the AI interviewer. It probes, follows up, and captures rich responses.",
  },
  {
    number: "03",
    title: "Analyse",
    description: "The LLM generates themes and insights with evidence-backed confidence scores.",
  },
  {
    number: "04",
    title: "Deliver",
    description: "Review, approve, and share reports with clients through the portal.",
  },
];

export default async function HomePage() {
  const recentNotifications: { id: string; type: string; payload: Record<string, unknown>; createdAt: string }[] =
    await getRecentNotifications();
  return (
    <main className="min-h-screen px-8 py-10">
      <div className="rounded-2xl gradient-bg p-8 text-white">
        <p className="text-sm uppercase tracking-wide text-white/80">Open source · bring your own LLM</p>
        <h1 className="mt-3 text-4xl font-semibold">OpenQual</h1>
        <p className="mt-2 text-lg">
          The open-source alternative to GetWhy. Run AI-powered qualitative interviews with your own API key. 10x cheaper. Full control.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/studies"
            className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-950"
          >
            Start a Study
          </Link>
          <Link
            href="/settings"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            Configure API Key
          </Link>
          <Link
            href="/demo"
            className="rounded-full border border-white px-4 py-2 text-sm font-medium"
          >
            How It Works
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
        <h2 className="text-2xl font-semibold">Why OpenQual?</h2>
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
