import "./globals.css";
import type { ReactNode } from "react";
import { API_BASE, HEADERS } from "@/lib/api";

export const metadata = {
  title: "OpenQual",
  description: "Open-source AI qualitative research — bring your own LLM",
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
              OpenQual
            </a>
            <nav className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <a href="/studies" className="hover:text-slate-950">
                Studies
              </a>
              <a href="/interview" className="hover:text-slate-950">
                Interview
              </a>
              <a href="/insights" className="hover:text-slate-950">
                Insights
              </a>
              <a href="/reports" className="hover:text-slate-950">
                Reports
              </a>
              <a href="/projects" className="hover:text-slate-950">
                Projects
              </a>
              <a href="/search" className="hover:text-slate-950">
                Search
              </a>
              <a href="/settings" className="hover:text-slate-950">
                Settings
              </a>
              <a href="/approvals" className="hover:text-slate-950">
                Approvals
              </a>
              <a href="/audit" className="hover:text-slate-950">
                Audit Log
              </a>
            </nav>
          </div>
        </header>
        {children}
        <footer className="mt-12 border-t border-gray-200 bg-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6 text-xs text-gray-500">
            <span>Open-source qualitative research. Bring your own API key. Own your data.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
