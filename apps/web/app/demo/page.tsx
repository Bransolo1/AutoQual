"use client";

import Link from "next/link";

const steps = [
  {
    number: "1",
    title: "Configure your LLM",
    description:
      "Add your OpenAI or Anthropic API key in Settings. Your key stays in your workspace — we never store it externally.",
    links: [{ label: "Go to Settings →", href: "/settings" }],
  },
  {
    number: "2",
    title: "Design your study",
    description:
      "Create a discussion guide with system prompts and per-question LLM instructions. The prompt framework lets you control exactly how the AI moderator behaves.",
    links: [{ label: "Go to Studies →", href: "/studies" }],
  },
  {
    number: "3",
    title: "Run AI interviews",
    description:
      "Share the interview link with participants. The LLM conducts structured conversations, probes for detail, and records every response.",
    links: [{ label: "Go to Interview →", href: "/interview" }],
  },
  {
    number: "4",
    title: "Review insights",
    description:
      "The platform auto-generates themes and evidence-backed insights. Use the Insight Workbench to review, approve, and refine.",
    links: [{ label: "Go to Insights →", href: "/insights" }],
  },
  {
    number: "5",
    title: "Export & deliver",
    description:
      "Generate reports in Markdown, JSON, or PPT. Share with stakeholders through the Client Portal.",
    links: [
      { label: "Reports →", href: "/reports" },
      { label: "Client Portal →", href: "/client" },
    ],
  },
];

export default function DemoPage() {
  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">How OpenQual Works</h1>
      <p className="mt-2 text-sm text-gray-600">
        An open-source alternative to GetWhy. Bring your own LLM API key and run qualitative
        interviews at a fraction of the cost.
      </p>

      <div className="mt-6 grid gap-4">
        {steps.map((step) => (
          <div key={step.number} className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold">
              {step.number}. {step.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{step.description}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-sm">
              {step.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-brand-600 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Cost comparison</h2>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">GetWhy</h3>
          <p className="mt-2 text-sm font-medium text-gray-800">~$50–200 per interview</p>
          <p className="mt-1 text-sm text-gray-600">Closed platform, vendor lock-in</p>
        </div>
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">OpenQual</h3>
          <p className="mt-2 text-sm font-medium text-gray-800">~$0.30–0.80 per interview</p>
          <p className="mt-1 text-sm text-gray-600">
            Open source, bring your own key, own your data
          </p>
        </div>
      </div>
    </main>
  );
}
