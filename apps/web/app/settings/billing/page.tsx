"use client";
import { useEffect, useState } from "react";
import { useApi } from "../../../lib/use-api";

type BillingStatus = "trialing" | "active" | "suspended" | "past_due" | "cancelled" | string;

interface WorkspaceData {
  billingStatus: BillingStatus;
  trialEndsAt: string | null;
  stripeSubscriptionId: string | null;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  trialing: { label: "Free Trial", color: "bg-blue-100 text-blue-800" },
  active: { label: "Active", color: "bg-green-100 text-green-800" },
  past_due: { label: "Past Due", color: "bg-amber-100 text-amber-800" },
  suspended: { label: "Suspended", color: "bg-red-100 text-red-800" },
  cancelled: { label: "Cancelled", color: "bg-slate-100 text-slate-600" },
};

export default function BillingSettingsPage() {
  const { apiFetch, user } = useApi();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.workspaceId) return;
    apiFetch(`/workspaces/${user.workspaceId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) setWorkspace(data);
      })
      .catch(() => setError("Failed to load billing info"))
      .finally(() => setLoading(false));
  }, [user?.workspaceId]);

  async function handleUpgrade() {
    if (!user?.workspaceId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/billing/checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: user.workspaceId, returnOrigin: window.location.origin }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Billing is not configured. Contact support.");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Failed to start checkout. Please try again.");
    } finally {
      setActionLoading(false);
    }
  }

  async function handlePortal() {
    if (!user?.workspaceId) return;
    setActionLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/billing/portal?workspaceId=${user.workspaceId}&returnOrigin=${encodeURIComponent(window.location.origin)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.message ?? "Failed to open billing portal.");
        return;
      }
      const { url } = await res.json();
      window.location.href = url;
    } catch {
      setError("Failed to open billing portal.");
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading billing info…</div>;

  const status = workspace?.billingStatus ?? "unknown";
  const statusMeta = STATUS_LABELS[status] ?? { label: status, color: "bg-slate-100 text-slate-600" };
  const trialDays = workspace?.trialEndsAt ? daysUntil(workspace.trialEndsAt) : null;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Billing</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your subscription and payment details.</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">Current plan</p>
            <p className="mt-1 text-xl font-semibold text-slate-900">Sensehub Professional</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusMeta.color}`}>
            {statusMeta.label}
          </span>
        </div>

        {status === "trialing" && trialDays !== null && (
          <p className="mt-3 text-sm text-slate-600">
            {trialDays > 0
              ? `Your free trial ends in ${trialDays} day${trialDays !== 1 ? "s" : ""}.`
              : "Your free trial has ended."}
          </p>
        )}

        {status === "past_due" && (
          <p className="mt-3 text-sm text-amber-700">
            Your payment is overdue. Please update your billing details to avoid suspension.
          </p>
        )}

        {status === "suspended" && (
          <p className="mt-3 text-sm text-red-700">
            Your workspace has been suspended.{" "}
            <a href="mailto:support@sensehub.app" className="underline">
              Contact support
            </a>{" "}
            to restore access.
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {(!workspace?.stripeSubscriptionId || status === "trialing" || status === "cancelled") && (
            <button
              onClick={handleUpgrade}
              disabled={actionLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {actionLoading ? "Loading…" : "Upgrade to Pro"}
            </button>
          )}

          {workspace?.stripeSubscriptionId && status !== "trialing" && (
            <button
              onClick={handlePortal}
              disabled={actionLoading}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              {actionLoading ? "Loading…" : "Manage billing"}
            </button>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-700">What's included</h2>
        <ul className="mt-3 space-y-2 text-sm text-slate-600">
          {[
            "Unlimited studies and participants",
            "AI-powered insights generation",
            "Voice and video interview support",
            "Team collaboration with role-based access",
            "Export to PDF, CSV, and slides",
            "SOC 2-ready audit logging",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
