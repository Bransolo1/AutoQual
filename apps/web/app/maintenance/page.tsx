export default function MaintenancePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <div className="rounded-full bg-amber-100 p-4">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-8 w-8 text-amber-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437l1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008z"
          />
        </svg>
      </div>
      <h1 className="mt-6 text-2xl font-semibold text-slate-950">Down for maintenance</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        We&apos;re performing scheduled maintenance and will be back shortly. Thank you for your
        patience.
      </p>
      <p className="mt-6 text-xs text-gray-400">
        Check{" "}
        <a
          href="https://status.sensehub.app"
          className="underline hover:text-gray-600"
          target="_blank"
          rel="noopener noreferrer"
        >
          status.sensehub.app
        </a>{" "}
        for updates.
      </p>
    </main>
  );
}
