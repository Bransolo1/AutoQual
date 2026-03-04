"use client";

import { useEffect, useState } from "react";
import { useApi } from "../lib/use-api";

type WorkspaceSettings = {
  id: string;
  retentionDays: number;
  auditRetentionEnabled?: boolean;
  auditRetentionDays?: number;
  piiRedactionEnabled: boolean;
  encryptionAtRest: boolean;
  activationViewThreshold?: number;
  feedbackScoreThreshold?: number;
  integrations?: {
    dataWarehouse?: string;
    crm?: string;
    bi?: string;
    webhook?: string;
    ssoProvider?: string;
  } | null;
  servicesNotes?: string | null;
};

type TrustArtifact = {
  id: string;
  category: string;
  status: string;
  filename: string;
  storageKey: string;
  notes?: string | null;
  createdAt: string;
};

type RevokedTokenItem = {
  id: string;
  jti: string;
  userId: string | null;
  revokedByUserId: string;
  revokedReason: string | null;
  expiresAt: string;
  createdAt: string;
};

type WorkspaceUser = {
  id: string;
  email: string;
  name: string;
  roles: Array<{ id: string; role: string }>;
};

type AccessReview = {
  id: string;
  reviewerUserId: string;
  notes?: string | null;
  reviewedUserIds?: string[] | null;
  createdAt: string;
};

export default function SettingsPage() {
  const { apiFetch, user } = useApi();
  const [settings, setSettings] = useState<WorkspaceSettings | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [lastRetention, setLastRetention] = useState<string | null>(null);
  const [trustArtifacts, setTrustArtifacts] = useState<TrustArtifact[]>([]);
  const [artifactCategory, setArtifactCategory] = useState("SOC2");
  const [artifactFilename, setArtifactFilename] = useState("");
  const [artifactStorageKey, setArtifactStorageKey] = useState("");
  const [artifactNotes, setArtifactNotes] = useState("");
  const [artifactStatus, setArtifactStatus] = useState("draft");
  const [artifactContentType, setArtifactContentType] = useState("application/pdf");
  const [artifactUploadUrl, setArtifactUploadUrl] = useState<string | null>(null);
  const [revokeJti, setRevokeJti] = useState("");
  const [revokeExpiresAt, setRevokeExpiresAt] = useState(() => {
    const date = new Date(Date.now() + 7 * 86400000);
    return date.toISOString().slice(0, 10);
  });
  const [revokeReason, setRevokeReason] = useState("");
  const [revokeStatus, setRevokeStatus] = useState<string | null>(null);
  const [ssoConfig, setSsoConfig] = useState<{ enabled: boolean; issuerUrl: string; clientId: string; redirectUri: string } | null>(null);
  const [secretsHealth, setSecretsHealth] = useState<{ provider: string; status: string; message: string } | null>(null);
  const [auditRetentionDays, setAuditRetentionDays] = useState("365");
  const [auditRetentionEnabled, setAuditRetentionEnabled] = useState(false);
  const [retentionConfigStatus, setRetentionConfigStatus] = useState<string | null>(null);
  const [revokedTokens, setRevokedTokens] = useState<RevokedTokenItem[]>([]);
  const [revokedLoading, setRevokedLoading] = useState(false);
  const [revokedError, setRevokedError] = useState<string | null>(null);
  const [revokedQuery, setRevokedQuery] = useState("");
  const [revokedUserId, setRevokedUserId] = useState("");
  const [revokedStatus, setRevokedStatus] = useState<"active" | "expired" | "all">("active");
  const [revokedCursor, setRevokedCursor] = useState<string | null>(null);
  const [revokedHasMore, setRevokedHasMore] = useState(false);
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);
  const [users, setUsers] = useState<WorkspaceUser[]>([]);
  const [accessReviews, setAccessReviews] = useState<AccessReview[]>([]);
  const [roleStatus, setRoleStatus] = useState<string | null>(null);
  const [accessReviewNotes, setAccessReviewNotes] = useState("");
  const [accessReviewUsers, setAccessReviewUsers] = useState("");
  const [accessReviewStatus, setAccessReviewStatus] = useState<string | null>(null);

  const loadSettings = async () => {
    const res = await apiFetch(`/workspaces/${user?.workspaceId ?? ""}`);
    setSettings(res.ok ? await res.json() : null);
  };

  const loadUsers = async () => {
    const res = await apiFetch(`/users?workspaceId=${user?.workspaceId ?? ""}`);
    if (!res.ok) return;
    setUsers(await res.json());
  };

  const loadAccessReviews = async () => {
    const res = await apiFetch(`/access-reviews?workspaceId=${user?.workspaceId ?? ""}&limit=10`);
    if (!res.ok) return;
    setAccessReviews(await res.json());
  };

  const loadTrustArtifacts = async () => {
    const res = await apiFetch(`/trust-center/artifacts?workspaceId=${user?.workspaceId ?? ""}`);
    if (!res.ok) return;
    setTrustArtifacts(await res.json());
  };

  useEffect(() => {
    loadSettings();
    loadTrustArtifacts();
    apiFetch(`/audit?workspaceId=${user?.workspaceId ?? ""}&entityType=workspace&limit=5`)
      .then((r) => (r.ok ? r.json() : []))
      .then((events: { action: string; createdAt: string }[]) => {
        const retention = events.find((event) => event.action.startsWith("retention."));
        if (retention) {
          setLastRetention(new Date(retention.createdAt).toLocaleString());
        }
      });
    apiFetch(`/auth/sso/config`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSsoConfig);
    apiFetch(`/secrets/health`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setSecretsHealth);
    loadRevokedTokens({ reset: true });
    loadUsers();
    loadAccessReviews();
  }, []);

  useEffect(() => {
    if (!settings) return;
    setAuditRetentionEnabled(settings.auditRetentionEnabled ?? false);
    setAuditRetentionDays(String(settings.auditRetentionDays ?? 365));
  }, [settings]);

  const updateSettings = async () => {
    if (!settings) return;
    setStatus("Saving...");
    const res = await apiFetch(`/workspaces/${settings.id}/settings`,{method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        retentionDays: settings.retentionDays,
        auditRetentionEnabled,
        auditRetentionDays: Number(auditRetentionDays),
        piiRedactionEnabled: settings.piiRedactionEnabled,
        encryptionAtRest: settings.encryptionAtRest,
        integrations: settings.integrations ?? null,
        servicesNotes: settings.servicesNotes ?? "",
        activationViewThreshold: settings.activationViewThreshold ?? 10,
        feedbackScoreThreshold: settings.feedbackScoreThreshold ?? 3,
      }),
    });
    setStatus(res.ok ? "Settings saved." : "Failed to save.");
  };

  const createTrustArtifact = async () => {
    if (!artifactFilename.trim() || !artifactStorageKey.trim()) return;
    const res = await apiFetch(`/trust-center/artifacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: user?.workspaceId ?? "",
        category: artifactCategory,
        status: artifactStatus,
        filename: artifactFilename.trim(),
        storageKey: artifactStorageKey.trim(),
        notes: artifactNotes.trim() || undefined,
      }),
    });
    if (res.ok) {
      setArtifactFilename("");
      setArtifactStorageKey("");
      setArtifactNotes("");
      setArtifactUploadUrl(null);
      await loadTrustArtifacts();
    }
  };

  const updateArtifactStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/trust-center/artifacts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadTrustArtifacts();
    }
  };

  const generateArtifactUploadUrl = async () => {
    if (!artifactStorageKey.trim()) return;
    const res = await apiFetch(`/trust-center/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storageKey: artifactStorageKey.trim(), contentType: artifactContentType }),
    });
    if (!res.ok) return;
    const payload = await res.json();
    setArtifactUploadUrl(payload?.url ?? null);
  };

  const revokeToken = async () => {
    if (!revokeJti.trim()) return;
    setRevokeStatus("Revoking...");
    const res = await apiFetch(`/auth/tokens/revoke`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: user?.workspaceId ?? "",
        actorUserId: user?.sub ?? "",
        jti: revokeJti.trim(),
        expiresAt: new Date(revokeExpiresAt).toISOString(),
        reason: revokeReason.trim() || undefined,
      }),
    });
    setRevokeStatus(res.ok ? "Token revoked." : "Failed to revoke.");
    if (res.ok) {
      setRevokeJti("");
      setRevokeReason("");
    }
  };

  const loadRevokedTokens = async ({ reset }: { reset?: boolean }) => {
    setRevokedLoading(true);
    setRevokedError(null);
    const params = new URLSearchParams({
      workspaceId: user?.workspaceId ?? "",
      status: revokedStatus,
    });
    if (revokedQuery.trim()) params.set("q", revokedQuery.trim());
    if (revokedUserId.trim()) params.set("userId", revokedUserId.trim());
    if (!reset && revokedCursor) params.set("cursor", revokedCursor);
    params.set("limit", "20");

    const res = await apiFetch(`/auth/tokens/revoked?${params.toString()}`, {});
    if (!res.ok) {
      setRevokedError("Failed to load revoked tokens.");
      setRevokedLoading(false);
      return;
    }
    const payload = (await res.json()) as { items: RevokedTokenItem[]; nextCursor: string | null };
    setRevokedTokens((prev) => (reset ? payload.items : [...prev, ...payload.items]));
    setRevokedCursor(payload.nextCursor);
    setRevokedHasMore(Boolean(payload.nextCursor));
    setRevokedLoading(false);
  };

  const purgeRevokedTokens = async () => {
    setPurgeStatus("Purging expired tokens...");
    const res = await apiFetch(`/auth/tokens/purge`,{method: "POST"});
    setPurgeStatus(res.ok ? "Expired tokens purged." : "Failed to purge tokens.");
    if (res.ok) {
      await loadRevokedTokens({ reset: true });
    }
  };

  const updateUserRoles = async (userId: string, roles: string[]) => {
    setRoleStatus("Updating roles...");
    const res = await apiFetch(`/users/${userId}/roles`,{method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roles }),
    });
    setRoleStatus(res.ok ? "Roles updated." : "Failed to update roles.");
    if (res.ok) {
      await loadUsers();
    }
  };

  const submitAccessReview = async () => {
    setAccessReviewStatus("Submitting access review...");
    const reviewedUserIds = accessReviewUsers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    const res = await apiFetch(`/access-reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        workspaceId: user?.workspaceId ?? "",
        reviewerUserId: user?.sub ?? "",
        notes: accessReviewNotes.trim() || undefined,
        reviewedUserIds,
      }),
    });
    setAccessReviewStatus(res.ok ? "Access review logged." : "Failed to log review.");
    if (res.ok) {
      setAccessReviewNotes("");
      setAccessReviewUsers("");
      await loadAccessReviews();
    }
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Workspace Settings</h1>
      <p className="mt-2 text-sm text-gray-600">
        Configure retention and privacy controls for this workspace.
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {[
          { href: "/settings/billing", label: "Billing & plan" },
          { href: "/settings/usage", label: "Usage dashboard" },
          { href: "/settings/sso", label: "Single sign-on" },
        ].map(({ href, label }) => (
          <a
            key={href}
            href={href}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            {label} →
          </a>
        ))}
      </div>
      {settings ? (
        <div className="mt-6 max-w-xl space-y-4 rounded-2xl bg-white p-6 shadow-sm">
          <label className="text-sm text-gray-600">
            Data retention (days)
            <input
              type="number"
              min={30}
              max={3650}
              className="mt-2 w-full rounded-lg border border-gray-200 p-2"
              value={settings.retentionDays}
              onChange={(event) =>
                setSettings({ ...settings, retentionDays: Number(event.target.value) })
              }
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={settings.piiRedactionEnabled}
              onChange={(event) =>
                setSettings({ ...settings, piiRedactionEnabled: event.target.checked })
              }
            />
            Enable PII redaction
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={settings.encryptionAtRest}
              onChange={(event) =>
                setSettings({ ...settings, encryptionAtRest: event.target.checked })
              }
            />
            Encryption at rest enabled
          </label>
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="text-xs uppercase text-gray-500">Adoption alert thresholds</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-gray-500">
                Activation views threshold
                <input
                  type="number"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.activationViewThreshold ?? 10}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      activationViewThreshold: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="text-xs text-gray-500">
                Feedback score threshold
                <input
                  type="number"
                  min={0}
                  max={5}
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.feedbackScoreThreshold ?? 3}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      feedbackScoreThreshold: Number(event.target.value),
                    })
                  }
                />
              </label>
            </div>
          </div>
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="text-xs uppercase text-gray-500">Integrations</div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="text-xs text-gray-500">
                Data warehouse
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.integrations?.dataWarehouse ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations ?? {}),
                        dataWarehouse: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label className="text-xs text-gray-500">
                CRM
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.integrations?.crm ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      integrations: { ...(settings.integrations ?? {}), crm: event.target.value },
                    })
                  }
                />
              </label>
              <label className="text-xs text-gray-500">
                BI tool
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.integrations?.bi ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      integrations: { ...(settings.integrations ?? {}), bi: event.target.value },
                    })
                  }
                />
              </label>
              <label className="text-xs text-gray-500">
                Webhook endpoint
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.integrations?.webhook ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations ?? {}),
                        webhook: event.target.value,
                      },
                    })
                  }
                />
              </label>
              <label className="text-xs text-gray-500 md:col-span-2">
                SSO provider (placeholder)
                <input
                  className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                  value={settings.integrations?.ssoProvider ?? ""}
                  onChange={(event) =>
                    setSettings({
                      ...settings,
                      integrations: {
                        ...(settings.integrations ?? {}),
                        ssoProvider: event.target.value,
                      },
                    })
                  }
                />
              </label>
            </div>
          </div>
          <label className="text-sm text-gray-600">
            Enterprise services notes
            <textarea
              className="mt-2 w-full rounded-lg border border-gray-200 p-2 text-sm"
              rows={4}
              value={settings.servicesNotes ?? ""}
              onChange={(event) => setSettings({ ...settings, servicesNotes: event.target.value })}
              placeholder="Describe integration scope, deployment support, and custom services."
            />
          </label>
          <div className="rounded-xl border border-gray-100 p-4 text-sm text-gray-600">
            <div className="text-xs uppercase text-gray-500">Trust center</div>
            <p className="mt-2 text-xs text-gray-500">
              Track enterprise security posture, privacy reviews, and compliance artifacts.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-gray-600">
              <li>Security controls: SOC2 readiness, encryption, incident response</li>
              <li>Privacy: GDPR and DPIA documentation</li>
              <li>Compliance artifacts: DPA, subprocessor list, pen test summary</li>
              <li>Data handling: retention, PII redaction, audit logging</li>
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              See `docs/trust-center/README.md` for the detailed checklist.
            </p>
            <div className="mt-4 rounded-lg border border-gray-200 bg-white p-3">
              <div className="text-xs uppercase text-gray-500">Add artifact</div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="text-xs text-gray-500">
                  Category
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactCategory}
                    onChange={(event) => setArtifactCategory(event.target.value)}
                  >
                    <option value="SOC2">SOC2</option>
                    <option value="GDPR">GDPR</option>
                    <option value="DPIA">DPIA</option>
                    <option value="DPA">DPA</option>
                    <option value="PenTest">Pen test</option>
                    <option value="Subprocessors">Subprocessors</option>
                  </select>
                </label>
                <label className="text-xs text-gray-500">
                  Status
                  <select
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactStatus}
                    onChange={(event) => setArtifactStatus(event.target.value)}
                  >
                    <option value="draft">Draft</option>
                    <option value="in_review">In review</option>
                    <option value="approved">Approved</option>
                    <option value="expired">Expired</option>
                  </select>
                </label>
                <label className="text-xs text-gray-500 md:col-span-2">
                  Filename
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactFilename}
                    onChange={(event) => setArtifactFilename(event.target.value)}
                    placeholder="e.g. SOC2-Report-2026.pdf"
                  />
                </label>
                <label className="text-xs text-gray-500 md:col-span-2">
                  Storage key
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactStorageKey}
                    onChange={(event) => setArtifactStorageKey(event.target.value)}
                    placeholder="trust-center/soc2-report-2026.pdf"
                  />
                </label>
                <label className="text-xs text-gray-500 md:col-span-2">
                  Content type
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactContentType}
                    onChange={(event) => setArtifactContentType(event.target.value)}
                    placeholder="application/pdf"
                  />
                </label>
                <label className="text-xs text-gray-500 md:col-span-2">
                  Notes
                  <input
                    className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
                    value={artifactNotes}
                    onChange={(event) => setArtifactNotes(event.target.value)}
                    placeholder="Optional notes or renewal cadence"
                  />
                </label>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={generateArtifactUploadUrl}
                  className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
                >
                  Generate upload URL
                </button>
                <button
                  type="button"
                  onClick={createTrustArtifact}
                  className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
                >
                  Add artifact
                </button>
              </div>
              {artifactUploadUrl && (
                <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-xs text-gray-600">
                  Upload URL ready. Use your uploader to PUT the artifact, then save the record.
                  <div className="mt-2 break-all text-[11px] text-gray-500">{artifactUploadUrl}</div>
                </div>
              )}
            </div>
            <div className="mt-4">
              <div className="text-xs uppercase text-gray-500">Artifacts</div>
              {trustArtifacts.length === 0 ? (
                <p className="mt-2 text-xs text-gray-500">No artifacts uploaded yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-xs text-gray-600">
                  {trustArtifacts.map((artifact) => (
                    <li key={artifact.id} className="rounded-lg border border-gray-100 p-3">
                      <div className="text-sm font-medium text-gray-800">
                        {artifact.category} · {artifact.filename}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        Storage key {artifact.storageKey}
                        {artifact.notes ? ` · ${artifact.notes}` : ""}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        <span className="text-gray-500">Status</span>
                        <select
                          className="rounded-lg border border-gray-200 px-2 py-1 text-xs"
                          value={artifact.status}
                          onChange={(event) => updateArtifactStatus(artifact.id, event.target.value)}
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">In review</option>
                          <option value="approved">Approved</option>
                          <option value="expired">Expired</option>
                        </select>
                        <a
                          href={`/trust-center/artifacts/${artifact.id}/signed-url`}
                          className="text-brand-600 hover:underline"
                        >
                          Download
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={updateSettings}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Save settings
          </button>
          {status && <p className="text-xs text-gray-500">{status}</p>}
          {lastRetention && (
            <p className="text-xs text-gray-500">Last retention queued: {lastRetention}</p>
          )}
        </div>
      ) : (
        <p className="mt-6 text-sm text-gray-500">Loading settings…</p>
      )}

      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Token revocation</h2>
        <p className="mt-2 text-sm text-gray-600">
          Revoke access tokens by JTI for compromised sessions or user offboarding.
        </p>
        <div className="mt-4 grid gap-3">
          <input
            value={revokeJti}
            onChange={(event) => setRevokeJti(event.target.value)}
            placeholder="Token JTI"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={revokeExpiresAt}
            onChange={(event) => setRevokeExpiresAt(event.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <input
            value={revokeReason}
            onChange={(event) => setRevokeReason(event.target.value)}
            placeholder="Reason (optional)"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={revokeToken}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Revoke token
          </button>
          <button
            type="button"
            onClick={purgeRevokedTokens}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600"
          >
            Purge expired
          </button>
          {revokeStatus && <span className="text-xs text-gray-500">{revokeStatus}</span>}
          {purgeStatus && <span className="text-xs text-gray-500">{purgeStatus}</span>}
        </div>

        <div className="mt-6 rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Revoked tokens</div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <label className="text-xs text-gray-500">
              JTI search
              <input
                value={revokedQuery}
                onChange={(event) => setRevokedQuery(event.target.value)}
                placeholder="Search by JTI or reason"
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              User ID
              <input
                value={revokedUserId}
                onChange={(event) => setRevokedUserId(event.target.value)}
                placeholder="Optional user ID"
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
              />
            </label>
            <label className="text-xs text-gray-500">
              Status
              <select
                value={revokedStatus}
                onChange={(event) => setRevokedStatus(event.target.value as "active" | "expired" | "all")}
                className="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm"
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="all">All</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => loadRevokedTokens({ reset: true })}
              className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
            >
              Apply filters
            </button>
            {revokedHasMore && (
              <button
                type="button"
                onClick={() => loadRevokedTokens({ reset: false })}
                className="rounded-full border border-gray-200 px-3 py-1 text-gray-600"
              >
                Load more
              </button>
            )}
          </div>
          {revokedError && <p className="mt-3 text-xs text-red-500">{revokedError}</p>}
          {revokedLoading ? (
            <p className="mt-3 text-xs text-gray-500">Loading revoked tokens…</p>
          ) : revokedTokens.length === 0 ? (
            <p className="mt-3 text-xs text-gray-500">No revoked tokens found.</p>
          ) : (
            <div className="mt-3 space-y-2 text-xs text-gray-600">
              {revokedTokens.map((token) => (
                <div key={token.id} className="rounded-lg border border-gray-100 p-3">
                  <div className="text-sm font-medium text-gray-800">{token.jti}</div>
                  <div className="mt-1 text-xs text-gray-500">
                    User {token.userId ?? "n/a"} · Revoked by {token.revokedByUserId}
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    Expires {new Date(token.expiresAt).toLocaleString()} · Revoked{" "}
                    {new Date(token.createdAt).toLocaleString()}
                  </div>
                  {token.revokedReason && (
                    <div className="mt-1 text-xs text-gray-500">Reason: {token.revokedReason}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="mt-8 max-w-3xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Access reviews & roles</h2>
        <p className="mt-2 text-sm text-gray-600">
          Track periodic access reviews and adjust workspace roles.
        </p>
        <div className="mt-4 rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Role assignments</div>
          {users.length === 0 ? (
            <p className="mt-3 text-xs text-gray-500">No users found.</p>
          ) : (
            <ul className="mt-3 space-y-3 text-xs text-gray-600">
              {users.map((user) => {
                const roleValue = user.roles.map((role) => role.role).join(", ");
                return (
                  <li key={user.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="text-sm font-medium text-gray-800">{user.name}</div>
                    <div className="mt-1 text-xs text-gray-500">{user.email}</div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        defaultValue={roleValue}
                        placeholder="admin, analyst, viewer"
                        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-xs md:max-w-sm"
                        onBlur={(event) =>
                          updateUserRoles(
                            user.id,
                            event.target.value
                              .split(",")
                              .map((item) => item.trim())
                              .filter(Boolean),
                          )
                        }
                      />
                      <button
                        type="button"
                        onClick={(event) => {
                          const input = (event.currentTarget.previousSibling as HTMLInputElement | null);
                          const roles = input?.value
                            ? input.value
                                .split(",")
                                .map((item) => item.trim())
                                .filter(Boolean)
                            : [];
                          updateUserRoles(user.id, roles);
                        }}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600"
                      >
                        Save roles
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          {roleStatus && <p className="mt-3 text-xs text-gray-500">{roleStatus}</p>}
        </div>

        <div className="mt-6 rounded-xl border border-gray-100 p-4">
          <div className="text-xs uppercase text-gray-500">Log access review</div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="text-xs text-gray-500 md:col-span-2">
              Reviewed user IDs (comma separated)
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={accessReviewUsers}
                onChange={(event) => setAccessReviewUsers(event.target.value)}
                placeholder="user-1, user-2"
              />
            </label>
            <label className="text-xs text-gray-500 md:col-span-2">
              Notes
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={accessReviewNotes}
                onChange={(event) => setAccessReviewNotes(event.target.value)}
                placeholder="Quarterly access review complete."
              />
            </label>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={submitAccessReview}
              className="rounded-full border border-brand-500 px-3 py-1 font-medium text-brand-600"
            >
              Log review
            </button>
            {accessReviewStatus && <span className="text-xs text-gray-500">{accessReviewStatus}</span>}
          </div>
          <div className="mt-4">
            <div className="text-xs uppercase text-gray-500">Recent reviews</div>
            {accessReviews.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">No reviews logged yet.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-xs text-gray-600">
                {accessReviews.map((review) => (
                  <li key={review.id} className="rounded-lg border border-gray-100 p-3">
                    <div className="text-xs text-gray-500">
                      Reviewer {review.reviewerUserId} · {new Date(review.createdAt).toLocaleString()}
                    </div>
                    {review.reviewedUserIds?.length ? (
                      <div className="mt-1 text-xs text-gray-500">
                        Reviewed: {review.reviewedUserIds.join(", ")}
                      </div>
                    ) : null}
                    {review.notes && <div className="mt-1 text-xs text-gray-500">Notes: {review.notes}</div>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Audit retention schedule</h2>
        <p className="mt-2 text-sm text-gray-600">
          Configure retention runs for audit logs and enable automated cleanup.
        </p>
        <div className="mt-4 grid gap-3">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={auditRetentionEnabled}
              onChange={(event) => setAuditRetentionEnabled(event.target.checked)}
            />
            Enable audit retention cleanup
          </label>
          <label className="text-sm text-gray-600">
            Retention window (days)
            <input
              type="number"
              min={30}
              value={auditRetentionDays}
              onChange={(event) => setAuditRetentionDays(event.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={async () => {
              setRetentionConfigStatus("Running retention...");
              const params = new URLSearchParams({
                workspaceId: user?.workspaceId ?? "",
                retentionDays: auditRetentionDays,
              });
              const res = await apiFetch(`/audit/retention-run?${params.toString()}`, {
                method: "POST"});
              setRetentionConfigStatus(res.ok ? "Retention executed." : "Retention failed.");
            }}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white"
          >
            Run retention now
          </button>
          {retentionConfigStatus && (
            <span className="text-xs text-gray-500">{retentionConfigStatus}</span>
          )}
        </div>
      </section>

      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">SSO configuration</h2>
        <p className="mt-2 text-sm text-gray-600">
          Read-only view of IdP settings configured for this workspace.
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Status</span>
            <span className="text-xs text-gray-500">{ssoConfig?.enabled ? "Enabled" : "Disabled"}</span>
          </div>
          <div className="text-xs text-gray-500">Issuer: {ssoConfig?.issuerUrl || "Not set"}</div>
          <div className="text-xs text-gray-500">Client ID: {ssoConfig?.clientId || "Not set"}</div>
          <div className="text-xs text-gray-500">Redirect URI: {ssoConfig?.redirectUri || "Not set"}</div>
        </div>
      </section>

      <section className="mt-8 max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Secrets provider health</h2>
        <p className="mt-2 text-sm text-gray-600">
          Current secrets backend and integration status.
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>Provider</span>
            <span className="text-xs text-gray-500">{secretsHealth?.provider ?? "n/a"}</span>
          </div>
          <div className="text-xs text-gray-500">
            {secretsHealth?.status ?? "unknown"} · {secretsHealth?.message ?? "No status"}
          </div>
        </div>
      </section>
    </main>
  );
}
