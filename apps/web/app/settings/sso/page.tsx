"use client";
import { useEffect, useState } from "react";
import { useApi } from "../../../lib/use-api";

interface SsoConfig {
  issuerUrl: string;
  clientId: string;
  allowedDomains: string[];
  requireSso: boolean;
}

const EMPTY: SsoConfig = {
  issuerUrl: "",
  clientId: "",
  allowedDomains: [],
  requireSso: false,
};

export default function SsoSettingsPage() {
  const { apiFetch, user } = useApi();
  const [config, setConfig] = useState<SsoConfig>(EMPTY);
  const [clientSecret, setClientSecret] = useState("");
  const [domainsText, setDomainsText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; error?: string } | null>(null);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.workspaceId) return;
    apiFetch(`/workspaces/${user.workspaceId}/sso-config`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: SsoConfig | null) => {
        if (data) {
          setConfig(data);
          setDomainsText((data.allowedDomains ?? []).join(", "));
        }
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [user?.workspaceId]);

  async function handleTest() {
    if (!user?.workspaceId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await apiFetch(`/workspaces/${user.workspaceId}/sso-config/test`, { method: "POST" });
      const data = await res.json();
      setTestResult(data);
    } catch {
      setTestResult({ ok: false, error: "Network error" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!user?.workspaceId) return;
    setSaving(true);
    setSaveMsg(null);
    const allowedDomains = domainsText
      .split(",")
      .map((d) => d.trim())
      .filter(Boolean);
    const payload: Record<string, unknown> = { ...config, allowedDomains };
    if (clientSecret) payload.clientSecret = clientSecret;
    try {
      const res = await apiFetch(`/workspaces/${user.workspaceId}/sso-config`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setSaveMsg("SSO configuration saved.");
        setClientSecret("");
      } else {
        setSaveMsg("Failed to save. Please try again.");
      }
    } catch {
      setSaveMsg("Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-8 text-slate-500">Loading SSO configuration…</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Single Sign-On</h1>
        <p className="mt-1 text-sm text-slate-500">
          Connect your identity provider (OIDC) to enable SSO for your workspace.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Issuer URL</label>
          <input
            type="url"
            placeholder="https://accounts.google.com"
            value={config.issuerUrl}
            onChange={(e) => setConfig({ ...config, issuerUrl: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Client ID</label>
          <input
            type="text"
            placeholder="your-client-id"
            value={config.clientId}
            onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Client Secret</label>
          <input
            type="password"
            placeholder="Leave blank to keep existing secret"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-400">Stored securely. Current value: ••••••••</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Allowed email domains</label>
          <input
            type="text"
            placeholder="company.com, subsidiary.com"
            value={domainsText}
            onChange={(e) => setDomainsText(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-slate-400">Comma-separated. Only users with these domains can log in via SSO.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            role="switch"
            aria-checked={config.requireSso}
            onClick={() => setConfig({ ...config, requireSso: !config.requireSso })}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
              config.requireSso ? "bg-blue-600" : "bg-slate-300"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                config.requireSso ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </button>
          <label className="text-sm text-slate-700">Require SSO — prevent password login for domain members</label>
        </div>

        {testResult && (
          <div
            className={`rounded-lg p-3 text-sm ${
              testResult.ok
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-red-50 text-red-700 border border-red-200"
            }`}
          >
            {testResult.ok ? "Connection successful — OIDC discovery returned OK." : `Connection failed: ${testResult.error}`}
          </div>
        )}

        {saveMsg && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
            {saveMsg}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testing || !config.issuerUrl}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            {testing ? "Testing…" : "Test connection"}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
