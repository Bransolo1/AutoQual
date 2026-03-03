"use client";
import { useEffect, useState } from "react";
import { useApi } from "../lib/use-api";

type WorkspaceSummary = {
  id: string;
  name: string;
  slug: string;
  billingStatus: string;
  trialEndsAt: string | null;
  createdAt: string;
  _count?: { users: number; projects: number };
};

export default function AdminPage() {
  const { apiFetch, user } = useApi();
  const [workspaces, setWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [provisionName, setProvisionName] = useState("");
  const [provisionSlug, setProvisionSlug] = useState("");
  const [provisionEmail, setProvisionEmail] = useState("");
  const [provisioning, setProvisioning] = useState(false);
  const [provisionResult, setProvisionResult] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const res = await apiFetch(`/admin/workspaces?q=${encodeURIComponent(search)}`);
    if (res.ok) {
      setWorkspaces(await res.json());
    } else {
      setError("Failed to load workspaces. Ensure you have operator role.");
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function provision(e: React.FormEvent) {
    e.preventDefault();
    setProvisioning(true);
    setProvisionResult(null);
    const res = await apiFetch(`/admin/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: provisionName.trim(),
        slug: provisionSlug.trim() || undefined,
        ownerEmail: provisionEmail.trim() || undefined,
      }),
    });
    if (res.ok) {
      const ws = await res.json();
      setProvisionResult(`Created workspace "${ws.name}" (${ws.id})`);
      setProvisionName("");
      setProvisionSlug("");
      setProvisionEmail("");
      await load();
    } else {
      const body = await res.json().catch(() => ({}));
      setProvisionResult(`Error: ${(body as { message?: string }).message ?? "Unknown error"}`);
    }
    setProvisioning(false);
  }

  async function suspendWorkspace(id: string) {
    await apiFetch(`/admin/workspaces/${id}/suspend`, { method: "POST" });
    await load();
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Operator panel</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage workspaces and provisioning. Requires operator role.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">
          Internal
        </span>
      </div>

      {/* Provision */}
      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Provision workspace</h2>
        <form onSubmit={provision} className="mt-4 space-y-3">
          <input
            required
            value={provisionName}
            onChange={(e) => setProvisionName(e.target.value)}
            placeholder="Workspace name"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={provisionSlug}
            onChange={(e) => setProvisionSlug(e.target.value)}
            placeholder="Slug (auto-generated if blank)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="email"
            value={provisionEmail}
            onChange={(e) => setProvisionEmail(e.target.value)}
            placeholder="Owner email (optional)"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={provisioning}
            className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {provisioning ? "Creating…" : "Create workspace"}
          </button>
          {provisionResult && (
            <p className="text-xs text-gray-500">{provisionResult}</p>
          )}
        </form>
      </section>

      {/* Workspace list */}
      <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-base font-semibold text-slate-950">All workspaces</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
            placeholder="Search by name or slug…"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          />
          <button
            type="button"
            onClick={load}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            Search
          </button>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {loading ? (
          <p className="mt-6 text-sm text-gray-400">Loading…</p>
        ) : workspaces.length === 0 ? (
          <p className="mt-6 text-sm text-gray-400">No workspaces found.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left text-xs font-medium uppercase text-gray-400">
                  <th className="pb-2 pr-4">Name</th>
                  <th className="pb-2 pr-4">Slug</th>
                  <th className="pb-2 pr-4">Billing</th>
                  <th className="pb-2 pr-4">Trial ends</th>
                  <th className="pb-2 pr-4">Users</th>
                  <th className="pb-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.map((ws) => (
                  <tr key={ws.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800">{ws.name}</td>
                    <td className="py-2 pr-4 font-mono text-xs text-gray-500">{ws.slug}</td>
                    <td className="py-2 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          ws.billingStatus === "active"
                            ? "bg-green-100 text-green-700"
                            : ws.billingStatus === "trialing"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {ws.billingStatus}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-500">
                      {ws.trialEndsAt ? new Date(ws.trialEndsAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2 pr-4 text-xs text-gray-500">
                      {ws._count?.users ?? "—"}
                    </td>
                    <td className="py-2">
                      <button
                        type="button"
                        onClick={() => suspendWorkspace(ws.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Suspend
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
