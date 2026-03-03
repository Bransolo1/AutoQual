"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApi } from "../../lib/use-api";

type Member = {
  id: string;
  email: string;
  name: string;
  roles: Array<{ id: string; role: string }>;
};

type Invitation = {
  id: string;
  email: string;
  role: string;
  status: string;
  expiresAt: string;
  createdAt: string;
};

export default function TeamPage() {
  const { apiFetch, user } = useApi();
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("researcher");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null);
  const [roleStatus, setRoleStatus] = useState<string | null>(null);

  const workspaceId = user?.workspaceId ?? "";

  async function loadMembers() {
    setLoadingMembers(true);
    const res = await apiFetch(`/users?workspaceId=${workspaceId}`);
    if (res.ok) setMembers(await res.json());
    setLoadingMembers(false);
  }

  async function loadInvitations() {
    setLoadingInvites(true);
    const res = await apiFetch(`/workspaces/${workspaceId}/invitations`);
    if (res.ok) setInvitations(await res.json());
    setLoadingInvites(false);
  }

  useEffect(() => {
    if (!workspaceId) return;
    loadMembers();
    loadInvitations();
  }, [workspaceId]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError(null);
    setInviteSuccess(null);
    const res = await apiFetch(`/workspaces/${workspaceId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });
    if (res.ok) {
      setInviteEmail("");
      setInviteSuccess(`Invitation sent to ${inviteEmail.trim()}`);
      await loadInvitations();
    } else {
      const body = await res.json().catch(() => ({}));
      setInviteError((body as { message?: string }).message ?? "Failed to send invitation");
    }
    setInviting(false);
  }

  async function revokeInvitation(inviteId: string) {
    await apiFetch(`/workspaces/${workspaceId}/invitations/${inviteId}`, { method: "DELETE" });
    await loadInvitations();
  }

  async function updateRole(userId: string, roles: string[]) {
    setRoleStatus("Saving...");
    const res = await apiFetch(`/users/${userId}/roles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    });
    setRoleStatus(res.ok ? "Roles saved." : "Failed to save roles.");
    if (res.ok) loadMembers();
  }

  return (
    <main className="min-h-screen px-8 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">Team</h1>
          <p className="mt-1 text-sm text-gray-500">Manage members and pending invitations.</p>
        </div>
        <Link href="/settings" className="text-sm text-gray-500 hover:text-gray-700">
          ← Settings
        </Link>
      </div>

      {/* Invite form */}
      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Invite a teammate</h2>
        <form onSubmit={handleInvite} className="mt-4 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email address</label>
            <input
              type="email"
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Role</label>
            <select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value)}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            >
              <option value="admin">Admin</option>
              <option value="researcher">Researcher</option>
              <option value="client">Client</option>
            </select>
          </div>
          {inviteError && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{inviteError}</p>
          )}
          {inviteSuccess && (
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{inviteSuccess}</p>
          )}
          <button
            type="submit"
            disabled={inviting}
            className="w-full rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {inviting ? "Sending…" : "Send invitation"}
          </button>
        </form>
      </section>

      {/* Pending invitations */}
      <section className="mt-6 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Pending invitations</h2>
        {loadingInvites ? (
          <p className="mt-4 text-sm text-gray-400">Loading…</p>
        ) : invitations.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No pending invitations.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {invitations.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
              >
                <div>
                  <div className="text-sm font-medium text-slate-800">{inv.email}</div>
                  <div className="mt-0.5 text-xs text-gray-400">
                    {inv.role} · expires {new Date(inv.expiresAt).toLocaleDateString()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => revokeInvitation(inv.id)}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Members */}
      <section className="mt-6 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-950">Members</h2>
        {loadingMembers ? (
          <p className="mt-4 text-sm text-gray-400">Loading…</p>
        ) : members.length === 0 ? (
          <p className="mt-4 text-sm text-gray-400">No members yet.</p>
        ) : (
          <ul className="mt-4 space-y-3">
            {members.map((member) => {
              const currentRoles = member.roles.map((r) => r.role).join(", ");
              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-2 rounded-lg border border-gray-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-800">{member.name}</div>
                    <div className="mt-0.5 text-xs text-gray-400">{member.email}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      defaultValue={currentRoles}
                      placeholder="admin, researcher"
                      className="w-36 rounded-lg border border-gray-200 px-2 py-1 text-xs"
                      onBlur={(e) =>
                        updateRole(
                          member.id,
                          e.target.value.split(",").map((r) => r.trim()).filter(Boolean),
                        )
                      }
                    />
                    {member.id === user?.sub && (
                      <span className="text-xs text-gray-400">(you)</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {roleStatus && <p className="mt-3 text-xs text-gray-400">{roleStatus}</p>}
      </section>
    </main>
  );
}
