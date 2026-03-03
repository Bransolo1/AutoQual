export const metadata = { title: "Privacy Policy – Sensehub" };

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: 3 March 2026</p>

      <section className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-gray-700">
        <h2>1. Who we are</h2>
        <p>
          Sensehub (&ldquo;we&rdquo;, &ldquo;us&rdquo;) provides an AI qualitative research
          platform. This policy explains what personal data we collect, how we use it, and your
          rights.
        </p>

        <h2>2. Data we collect</h2>
        <ul>
          <li>
            <strong>Account data</strong> – name, email address, and workspace membership.
          </li>
          <li>
            <strong>Research data</strong> – interview transcripts, audio/video files, and
            participant records you upload.
          </li>
          <li>
            <strong>Usage data</strong> – pages visited, features used, and access logs for
            security and performance monitoring.
          </li>
          <li>
            <strong>Cookies</strong> – an httpOnly session cookie to maintain your authenticated
            session. We do not use advertising or third-party tracking cookies.
          </li>
        </ul>

        <h2>3. How we use your data</h2>
        <ul>
          <li>To provide, maintain, and improve the Service.</li>
          <li>To send transactional emails (invitations, password resets, notifications).</li>
          <li>To detect and prevent fraud and security incidents.</li>
          <li>To comply with legal obligations.</li>
        </ul>

        <h2>4. Data sharing</h2>
        <p>
          We do not sell your personal data. We share data only with sub-processors necessary to
          operate the Service (e.g. cloud infrastructure, email delivery) and always under
          appropriate data protection agreements.
        </p>

        <h2>5. International transfers</h2>
        <p>
          We store data in the EU and US. For transfers outside the EEA we rely on EU Standard
          Contractual Clauses.
        </p>

        <h2>6. Retention</h2>
        <p>
          We retain personal data for as long as your account is active or as needed to provide
          the Service. You can request deletion at any time.
        </p>

        <h2>7. Your rights (GDPR)</h2>
        <p>
          If you are based in the EEA or UK, you have the right to access, rectify, erase, object
          to, or restrict processing of your personal data, and the right to data portability.
          Submit requests to{" "}
          <a href="mailto:privacy@sensehub.app" className="text-slate-700 underline">
            privacy@sensehub.app
          </a>
          . We respond within 30 days.
        </p>

        <h2>8. Cookies</h2>
        <p>
          We use a single first-party session cookie (<code>__session</code>) to keep you signed
          in. It is httpOnly, Secure, and SameSite=Lax. No third-party cookies are set unless you
          have given consent via our cookie banner.
        </p>

        <h2>9. Changes to this policy</h2>
        <p>
          We will notify you of significant changes by email or in-app notice at least 30 days
          before they take effect.
        </p>

        <h2>10. Contact</h2>
        <p>
          Data controller: Sensehub Ltd.{" "}
          <a href="mailto:privacy@sensehub.app" className="text-slate-700 underline">
            privacy@sensehub.app
          </a>
        </p>
      </section>
    </main>
  );
}
