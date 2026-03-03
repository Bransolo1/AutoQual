export const metadata = { title: "Terms of Service – Sensehub" };

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold text-slate-950">Terms of Service</h1>
      <p className="mt-2 text-sm text-gray-400">Last updated: 3 March 2026</p>

      <section className="prose prose-slate mt-10 max-w-none text-sm leading-relaxed text-gray-700">
        <h2>1. Acceptance of terms</h2>
        <p>
          By accessing or using Sensehub (&ldquo;Service&rdquo;), you agree to be bound by these Terms
          of Service (&ldquo;Terms&rdquo;). If you are using the Service on behalf of an organisation,
          you represent that you are authorised to accept these Terms on its behalf.
        </p>

        <h2>2. Description of service</h2>
        <p>
          Sensehub provides an AI-assisted qualitative research platform, including interview
          management, transcript analysis, insight generation, and delivery governance tooling.
        </p>

        <h2>3. Accounts and workspaces</h2>
        <p>
          You are responsible for maintaining the security of your account credentials. You must
          notify us immediately of any unauthorised use. Workspaces are isolated environments;
          data from one workspace is never accessible to another.
        </p>

        <h2>4. Acceptable use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Use the Service for any unlawful purpose or in violation of any regulation.</li>
          <li>Upload content that infringes intellectual property rights of third parties.</li>
          <li>Attempt to probe, scan, or test the vulnerability of the Service.</li>
          <li>Interfere with or disrupt the integrity or performance of the Service.</li>
        </ul>

        <h2>5. Data processing</h2>
        <p>
          You retain ownership of all data you upload. We process your data only as necessary to
          provide the Service and as described in our Privacy Policy and, where applicable, our
          Data Processing Agreement (DPA).
        </p>

        <h2>6. Confidentiality</h2>
        <p>
          Each party agrees to keep the other&apos;s confidential information confidential and to
          use it only as permitted under these Terms.
        </p>

        <h2>7. Intellectual property</h2>
        <p>
          All intellectual property in the Service (excluding your content) belongs to Sensehub or
          its licensors. Nothing in these Terms transfers any IP rights to you.
        </p>

        <h2>8. Limitation of liability</h2>
        <p>
          To the maximum extent permitted by applicable law, Sensehub is not liable for indirect,
          incidental, special, consequential or punitive damages, or loss of profits or data.
        </p>

        <h2>9. Changes to terms</h2>
        <p>
          We may update these Terms. We will notify you of material changes at least 30 days before
          they take effect. Continued use constitutes acceptance.
        </p>

        <h2>10. Contact</h2>
        <p>
          For questions about these Terms, email{" "}
          <a href="mailto:legal@sensehub.app" className="text-slate-700 underline">
            legal@sensehub.app
          </a>
          .
        </p>
      </section>
    </main>
  );
}
