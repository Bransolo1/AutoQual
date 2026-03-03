"use client";
import { useState } from "react";
import { redirect } from "next/navigation";
import { useApi } from "../../lib/use-api";

export default function OnboardingPage() {
  const { apiFetch, user } = useApi();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  function handleNameChange(value: string) {
    setName(value);
    setSlug(value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/workspaces", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), slug: slug.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { message?: string }).message ?? "Failed to create workspace");
      }
      const workspace = await res.json() as { id: string; slug: string };
      // Workspace created — redirect to SSO to get a scoped token
      window.location.href = `/api/auth/login?workspaceId=${workspace.id}&returnTo=/`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Create your workspace</h1>
          <p className="mt-2 text-sm text-gray-500">
            A workspace is your team&apos;s home on Sensehub. You can invite colleagues after setup.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                Workspace name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                minLength={3}
                maxLength={64}
                placeholder="Acme Research"
                className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="slug" className="block text-sm font-medium text-slate-700">
                Workspace URL
              </label>
              <div className="mt-1 flex items-center gap-1">
                <span className="text-sm text-gray-400">sensehub.app/</span>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  required
                  minLength={2}
                  maxLength={48}
                  pattern="[a-z0-9-]+"
                  className="block flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading ? "Creating…" : "Create workspace"}
            </button>
          </form>

          {user && (
            <p className="mt-6 text-center text-xs text-gray-400">
              Signed in as {user.email ?? user.sub}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
