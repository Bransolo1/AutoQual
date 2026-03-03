import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="flex min-h-[80vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl font-bold text-slate-200">403</p>
      <h1 className="mt-4 text-2xl font-semibold text-slate-950">Access denied</h1>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        You don&apos;t have permission to view this page. Contact your workspace admin if you
        believe this is a mistake.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
