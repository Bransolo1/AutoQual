export const metadata = { title: "Help & Support – Sensehub" };

const FAQ = [
  {
    q: "How do I create a workspace?",
    a: "On your first sign-in, you will be taken to the workspace creation page. Enter a name and URL slug, and click 'Create workspace'.",
  },
  {
    q: "How do I invite teammates?",
    a: "Go to Settings → Team, enter your colleague's email, choose their role, and click 'Send invitation'. They will receive an email with a link to accept.",
  },
  {
    q: "What roles are available?",
    a: "Admin – full access including settings and billing. Researcher – can create projects, studies, and insights. Client – read-only access to reports and approvals.",
  },
  {
    q: "How do I upload interview recordings?",
    a: "Open a study, create a session, and use the 'Upload media' button. Supported formats: mp4, mov, mp3, m4a, wav.",
  },
  {
    q: "How is my data stored?",
    a: "All data is stored encrypted at rest (AWS KMS) in the EU-West-1 region. Transcripts and media are stored in isolated S3 buckets per workspace.",
  },
  {
    q: "How do I request my data or account deletion?",
    a: "Visit the Data Request page (linked in the footer) and submit a deletion or access request. We respond within 30 days.",
  },
  {
    q: "How do I contact support?",
    a: "Email support@sensehub.app or use the chat widget (bottom-right of this page). We typically respond within one business day.",
  },
];

export default function HelpPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-950">Help & Support</h1>
      <p className="mt-2 text-sm text-gray-500">
        Find answers to common questions or reach out to our team.
      </p>

      {/* Quick links */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          {
            title: "Email support",
            description: "support@sensehub.app",
            href: "mailto:support@sensehub.app",
          },
          {
            title: "Status page",
            description: "status.sensehub.app",
            href: "https://status.sensehub.app",
          },
          {
            title: "Data request",
            description: "GDPR / data rights",
            href: "/legal/data-request",
          },
        ].map((link) => (
          <a
            key={link.href}
            href={link.href}
            target={link.href.startsWith("http") ? "_blank" : undefined}
            rel={link.href.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm hover:border-slate-300 hover:shadow"
          >
            <p className="text-sm font-semibold text-slate-950">{link.title}</p>
            <p className="mt-1 text-xs text-gray-400">{link.description}</p>
          </a>
        ))}
      </div>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-xl font-semibold text-slate-950">Frequently asked questions</h2>
        <dl className="mt-6 space-y-6">
          {FAQ.map((item) => (
            <div key={item.q} className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
              <dt className="text-sm font-semibold text-slate-950">{item.q}</dt>
              <dd className="mt-2 text-sm text-gray-600">{item.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </main>
  );
}
