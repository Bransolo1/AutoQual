import { redirect } from "next/navigation";
import { getSessionUser } from "../../../lib/session";

interface Props {
  searchParams: { error?: string; workspaceId?: string; returnTo?: string };
}

const ERROR_MESSAGES: Record<string, string> = {
  missing_params: "Invalid login link. Please try again.",
  exchange_failed: "Login failed during token exchange. Please try again.",
  no_token: "No token received from the identity provider.",
  api_unreachable: "Could not reach the authentication service. Please try later.",
  session_expired: "Your session has expired. Please sign in again.",
};

export default function LoginPage({ searchParams }: Props) {
  // If already authenticated, redirect to home
  const user = getSessionUser();
  if (user) redirect("/");

  const errorKey = searchParams.error;
  const errorMsg = errorKey ? (ERROR_MESSAGES[errorKey] ?? decodeURIComponent(errorKey)) : null;
  const workspaceId = searchParams.workspaceId ?? "";
  const returnTo = searchParams.returnTo ?? "/";
  const ssoEnabled = process.env.NEXT_PUBLIC_SSO_ENABLED === "true";

  const loginHref =
    `/api/auth/login?workspaceId=${encodeURIComponent(workspaceId)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-950">Sign in to Sensehub</h1>
        <p className="mt-2 text-sm text-gray-500">
          Enterprise AI qualitative research platform
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="mt-8 space-y-4">
          {ssoEnabled ? (
            <>
              {!workspaceId && (
                <WorkspaceForm returnTo={returnTo} />
              )}
              {workspaceId && (
                <a
                  href={loginHref}
                  className="flex w-full items-center justify-center rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
                >
                  Continue with SSO
                </a>
              )}
            </>
          ) : (
            <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              SSO is not enabled. Set{" "}
              <code className="font-mono">NEXT_PUBLIC_SSO_ENABLED=true</code> and configure
              the IdP environment variables to enable login.
            </div>
          )}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          By signing in you agree to your organisation&apos;s data processing terms.
        </p>
      </div>
    </main>
  );
}

/** Form to capture workspaceId before redirecting to SSO. */
function WorkspaceForm({ returnTo }: { returnTo: string }) {
  return (
    <form action="/api/auth/login" method="GET" className="space-y-3">
      <input type="hidden" name="returnTo" value={returnTo} />
      <div>
        <label htmlFor="workspaceId" className="block text-sm font-medium text-slate-700">
          Workspace ID
        </label>
        <input
          id="workspaceId"
          name="workspaceId"
          type="text"
          required
          placeholder="your-workspace-id"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-lg bg-slate-950 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800"
      >
        Continue with SSO
      </button>
    </form>
  );
}
