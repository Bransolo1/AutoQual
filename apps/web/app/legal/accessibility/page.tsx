export const metadata = { title: "Accessibility Statement – Sensehub" };

export default function AccessibilityPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-950">Accessibility statement</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: 3 March 2026</p>

      <section className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-gray-700">
        <p>
          Sensehub is committed to making its platform accessible to everyone, including people
          with disabilities. We target WCAG 2.1 Level AA conformance.
        </p>

        <h2>Our approach</h2>
        <ul>
          <li>Skip-to-content link at the top of every page.</li>
          <li>Semantic HTML landmarks (<code>header</code>, <code>nav</code>, <code>main</code>, <code>footer</code>).</li>
          <li>All interactive controls meet the 3:1 contrast ratio minimum.</li>
          <li>Focus indicators are visible on all interactive elements.</li>
          <li>Modal dialogs use native <code>&lt;dialog&gt;</code> with focus trapping.</li>
          <li>Status messages use <code>aria-live</code> regions.</li>
          <li>Images have descriptive <code>alt</code> text; decorative images use <code>aria-hidden</code>.</li>
          <li>Form inputs are associated with labels via <code>htmlFor</code>/<code>id</code>.</li>
        </ul>

        <h2>Known limitations</h2>
        <p>
          Some data visualisation charts may not yet have full ARIA descriptions. We are working
          to add text alternatives for all charts.
        </p>

        <h2>Feedback and contact</h2>
        <p>
          If you experience accessibility barriers, please email{" "}
          <a href="mailto:accessibility@sensehub.app" className="text-slate-700 underline">
            accessibility@sensehub.app
          </a>
          . We aim to respond within five business days.
        </p>
      </section>
    </main>
  );
}
