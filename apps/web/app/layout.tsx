import "./globals.css";
import type { ReactNode } from "react";
import { bearerHeader, getSessionToken, getSessionUser } from "../lib/session";
import { TokenProvider } from "../lib/token-context";
import { CookieConsent } from "../components/CookieConsent";
import { ToastProvider } from "../components/Toast";
import { BillingBanner } from "../components/BillingBanner";

export const metadata = {
  title: "Sensehub Auto Qual",
  description: "Enterprise AI qualitative research platform",
};

async function getUnreadCount() {
  const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
  const auth = bearerHeader();
  if (!auth.Authorization) return 0;
  try {
    const response = await fetch(`${API_BASE}/notifications?unread=true&limit=1`, {
      headers: { ...auth },
      cache: "no-store",
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const unreadCount = await getUnreadCount();
  const user = getSessionUser();
  const token = getSessionToken();
  return (
    <html lang="en">
      <body>
        {/* Skip to content link for keyboard / screen-reader users */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded focus:bg-slate-950 focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:outline-none"
        >
          Skip to content
        </a>
        <header className="border-b border-white/60 bg-white/80 backdrop-blur" role="banner">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <a href="/" className="text-base font-semibold text-slate-950" aria-label="Sensehub home">
              Sensehub Auto Qual
            </a>
            <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <a href="/projects" className="hover:text-slate-950">Projects</a>
              <a href="/studies" className="hover:text-slate-950">Studies</a>
              <a href="/fieldwork" className="hover:text-slate-950">Fieldwork</a>
              <a href="/insights" className="hover:text-slate-950">Insights</a>
              <a href="/approvals" className="hover:text-slate-950">Approvals</a>
              <a href="/reports" className="hover:text-slate-950">Reports</a>
              <a href="/search" className="hover:text-slate-950">Search</a>
              <a href="/settings" className="hover:text-slate-950">Settings</a>
              <a href="/audit" className="hover:text-slate-950">Audit Log</a>
              <a href="/help" className="hover:text-slate-950" aria-label="Help and documentation">Help</a>
              <a href="/notifications" className="relative hover:text-slate-950" aria-label={unreadCount > 0 ? `Notifications (${unreadCount} unread)` : "Notifications"}>
                Notifications
                {unreadCount > 0 && (
                  <span aria-hidden="true" className="absolute -right-3 -top-2 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </a>
              {user ? (
                <span className="flex items-center gap-3">
                  <span className="text-xs text-gray-400" aria-label={`Signed in as ${user.email ?? user.sub}`}>{user.email ?? user.sub}</span>
                  <a
                    href="/api/auth/logout"
                    className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:border-slate-950 hover:text-slate-950"
                  >
                    Sign out
                  </a>
                </span>
              ) : (
                <a
                  href="/auth/login"
                  className="rounded-full border border-gray-300 px-3 py-1 text-xs hover:border-slate-950 hover:text-slate-950"
                >
                  Sign in
                </a>
              )}
            </nav>
          </div>
        </header>
        <ToastProvider>
          <TokenProvider token={token}>
            <BillingBanner />
            <div id="main-content">
              {children}
            </div>
          </TokenProvider>
        </ToastProvider>
        <footer role="contentinfo" className="mt-12 border-t border-gray-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6 text-xs text-gray-500">
            <span>Enterprise qual platform with delivery governance.</span>
            <div className="flex gap-4">
              <a href="/legal/terms" className="hover:text-slate-700">Terms</a>
              <a href="/legal/privacy" className="hover:text-slate-700">Privacy</a>
              <a href="/legal/data-request" className="hover:text-slate-700">Data request</a>
              <a href="/help" className="hover:text-slate-700">Help</a>
              <a href="/legal/accessibility" className="hover:text-slate-700">Accessibility</a>
            </div>
          </div>
        </footer>
        <CookieConsent />
      </body>
    </html>
  );
}
