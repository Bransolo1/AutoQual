"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";

  const [status, setStatus] = useState<"loading" | "ready" | "accepting" | "done" | "error">(
    "loading",
  );
  const [invitation, setInvitation] = useState<{
    email: string;
    role: string;
    workspaceName?: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    // Pre-validate the token so we can show the workspace name
    fetch(`/api/invite/preview?token=${encodeURIComponent(token)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setInvitation(data);
          setStatus("ready");
        } else {
          setErrorMessage("This invitation link is invalid or has expired.");
          setStatus("error");
        }
      })
      .catch(() => {
        setErrorMessage("Could not load invitation. Please check the link and try again.");
        setStatus("error");
      });
  }, [token]);

  async function accept() {
    setStatus("accepting");
    try {
      const res = await fetch("/api/invite/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setErrorMessage((body as { message?: string }).message ?? "Failed to accept invitation");
        setStatus("error");
        return;
      }
      setStatus("done");
      // Redirect to SSO / login to get a scoped token for the new workspace
      const data = (await res.json()) as { workspaceId?: string };
      window.location.href = data.workspaceId
        ? `/api/auth/login?workspaceId=${data.workspaceId}&returnTo=/`
        : "/auth/login";
    } catch {
      setErrorMessage("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        {status === "loading" && (
          <p className="text-sm text-gray-500">Loading invitation…</p>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-semibold text-slate-950">Invalid invitation</h1>
            <p className="mt-3 text-sm text-red-600">{errorMessage}</p>
            <a
              href="/auth/login"
              className="mt-6 inline-block rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Go to sign in
            </a>
          </>
        )}

        {(status === "ready" || status === "accepting") && invitation && (
          <>
            <h1 className="text-xl font-semibold text-slate-950">You&apos;ve been invited</h1>
            <p className="mt-3 text-sm text-gray-600">
              You have been invited to join
              {invitation.workspaceName ? (
                <strong> {invitation.workspaceName}</strong>
              ) : (
                " a workspace"
              )}{" "}
              as a <strong>{invitation.role}</strong>.
            </p>
            {invitation.email && (
              <p className="mt-1 text-xs text-gray-400">Invitation sent to {invitation.email}</p>
            )}
            <button
              type="button"
              onClick={accept}
              disabled={status === "accepting"}
              className="mt-6 w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {status === "accepting" ? "Accepting…" : "Accept invitation"}
            </button>
          </>
        )}

        {status === "done" && (
          <>
            <h1 className="text-xl font-semibold text-slate-950">Welcome!</h1>
            <p className="mt-3 text-sm text-gray-600">
              Signing you in to your workspace…
            </p>
          </>
        )}
      </div>
    </main>
  );
}
