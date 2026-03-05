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
  state_mismatch: "Login request expired or was tampered with. Please try again.",
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
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  const googleHref = `/api/auth/google?returnTo=${encodeURIComponent(returnTo)}`;
  const ssoLoginHref =
    `/api/auth/login?workspaceId=${encodeURIComponent(workspaceId)}&returnTo=${encodeURIComponent(returnTo)}`;

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo / Brand */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-slate-950">Sensehub Auto Qual</h1>
          <p className="mt-1 text-sm text-slate-500">Sign in to your workspace</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-sm">
          {errorMsg && (
            <div className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
              {errorMsg}
            </div>
          )}

          <div className="space-y-4">
            {/* Google Sign-in — primary method */}
            {googleEnabled ? (
              <a
                href={googleHref}
                className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm hover:bg-gray-50 hover:shadow-md transition-shadow"
              >
                <GoogleLogo />
                Continue with Google
              </a>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-200 px-4 py-6 text-center text-sm text-gray-400">
                <p className="font-medium text-gray-500">Google sign-in not configured</p>
                <p className="mt-1 text-xs">
                  Set <code className="font-mono">GOOGLE_CLIENT_ID</code> and{" "}
                  <code className="font-mono">GOOGLE_CLIENT_SECRET</code> to enable.
                </p>
              </div>
            )}

            {/* Divider */}
            {(googleEnabled || ssoEnabled) && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-xs text-gray-400">
                  <span className="bg-white px-2">or</span>
                </div>
              </div>
            )}

            {/* Enterprise SSO */}
            {ssoEnabled ? (
              <>
                {!workspaceId ? (
                  <WorkspaceForm returnTo={returnTo} />
                ) : (
                  <a
                    href={ssoLoginHref}
                    className="flex w-full items-center justify-center rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-gray-50"
                  >
                    Continue with enterprise SSO
                  </a>
                )}
              </>
            ) : !googleEnabled && (
              <div className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
                No authentication method is configured. Set{" "}
                <code className="font-mono text-xs">GOOGLE_CLIENT_ID</code> or{" "}
                <code className="font-mono text-xs">NEXT_PUBLIC_SSO_ENABLED=true</code>.
              </div>
            )}
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            By signing in you agree to your organisation&apos;s data processing terms.
          </p>
        </div>
      </div>
    </main>
  );
}

/** Google "G" logo SVG */
function GoogleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

/** Form to capture workspaceId before redirecting to enterprise SSO. */
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
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-gray-50"
      >
        Continue with enterprise SSO
      </button>
    </form>
  );
}
