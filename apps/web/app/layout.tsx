import "./globals.css";
import type { ReactNode } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

export const metadata = {
  title: "Sensehub Auto Qual",
  description: "Enterprise AI qualitative research platform",
};

async function getUnreadCount() {
  try {
    const response = await fetch(
      `${API_BASE}/notifications?userId=demo-user&unread=true&limit=1`,
      {
        headers: HEADERS,
        cache: "no-store",
      },
    );
    if (!response.ok) return 0;
    const data = await response.json();
    return Array.isArray(data) ? data.length : 0;
  } catch {
    return 0;
  }
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const unreadCount = await getUnreadCount();
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/60 bg-white/80 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
            <a href="/" className="text-base font-semibold text-slate-950">
              Sensehub Auto Qual
            </a>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <a href="/projects" className="hover:text-slate-950">
                Projects
              </a>
              <a href="/studies" className="hover:text-slate-950">
                Studies
              </a>
              <a href="/insights" className="hover:text-slate-950">
                Insights
              </a>
              <a href="/approvals" className="hover:text-slate-950">
                Approvals
              </a>
              <a href="/reports" className="hover:text-slate-950">
                Reports
              </a>
              <a href="/search" className="hover:text-slate-950">
                Search
              </a>
              <a href="/settings" className="hover:text-slate-950">
                Settings
              </a>
              <a href="/demo" className="hover:text-slate-950">
                Demo
              </a>
              <a href="/audit" className="hover:text-slate-950">
                Audit Log
              </a>
              <a href="/notifications" className="relative hover:text-slate-950">
                Notifications
                {unreadCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    {unreadCount}
                  </span>
                )}
              </a>
              <a href="/embed-test" className="hover:text-slate-950">
                Embed Test
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-12 border-t border-gray-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6 text-xs text-gray-500">
            <span>Enterprise qual platform with delivery governance.</span>
            <span>Need help? Use the Embed Test for troubleshooting.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
