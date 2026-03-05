import Link from "next/link";
import { bearerHeader, getSessionUser } from "../lib/session";
import { redirect } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function getDashboardData() {
  const auth = bearerHeader();
  if (!auth.Authorization) return null;

  const [projectsRes, studiesRes, approvalsRes, notificationsRes] = await Promise.allSettled([
    fetch(`${API_BASE}/projects?limit=3`, { headers: { ...auth }, cache: "no-store" }),
    fetch(`${API_BASE}/studies?limit=3`, { headers: { ...auth }, cache: "no-store" }),
    fetch(`${API_BASE}/approvals?status=requested&limit=1`, { headers: { ...auth }, cache: "no-store" }),
    fetch(`${API_BASE}/notifications?unread=true&limit=1`, { headers: { ...auth }, cache: "no-store" }),
  ]);

  const projects =
    projectsRes.status === "fulfilled" && projectsRes.value.ok
      ? ((await projectsRes.value.json()) as Array<{ id: string; name: string; status: string; clientOrgName?: string }>)
      : [];

  const studies =
    studiesRes.status === "fulfilled" && studiesRes.value.ok
      ? ((await studiesRes.value.json()) as Array<{ id: string; name: string; status: string }>)
      : [];

  const pendingApprovals =
    approvalsRes.status === "fulfilled" && approvalsRes.value.ok
      ? ((await approvalsRes.value.json()) as unknown[]).length
      : 0;

  const unreadNotifications =
    notificationsRes.status === "fulfilled" && notificationsRes.value.ok
      ? ((await notificationsRes.value.json()) as unknown[]).length
      : 0;

  return { projects, studies, pendingApprovals, unreadNotifications };
}

const STATUS_COLORS: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-700",
  planned: "bg-slate-100 text-slate-600",
  complete: "bg-blue-100 text-blue-700",
  on_hold: "bg-amber-100 text-amber-700",
  cancelled: "bg-red-100 text-red-700",
  draft: "bg-slate-100 text-slate-600",
  live: "bg-emerald-100 text-emerald-700",
  analysis: "bg-purple-100 text-purple-700",
  closed: "bg-gray-100 text-gray-600",
};

export default async function DashboardPage() {
  const user = getSessionUser();
  if (!user) {
    redirect("/auth/login");
  }

  const data = await getDashboardData();
  const displayName = user.email ?? user.sub ?? "";

  return (
    <main className="min-h-screen bg-slate-50 px-8 py-10">
      <div className="mx-auto max-w-5xl">
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome back{displayName ? `, ${displayName.split("@")[0]}` : ""}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s happening in your workspace today.
          </p>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Active studies</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {data?.studies.filter((s) => s.status === "live" || s.status === "active").length ?? "—"}
            </p>
            <Link href="/studies" className="mt-2 block text-xs text-slate-400 hover:text-slate-700">
              View all studies →
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Pending approvals</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {data?.pendingApprovals ?? "—"}
            </p>
            <Link href="/approvals" className="mt-2 block text-xs text-slate-400 hover:text-slate-700">
              Review approvals →
            </Link>
          </div>
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Unread notifications</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {data?.unreadNotifications ?? "—"}
            </p>
            <Link href="/notifications" className="mt-2 block text-xs text-slate-400 hover:text-slate-700">
              View notifications →
            </Link>
          </div>
        </div>

        {/* Quick actions */}
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Quick actions</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link
              href="/studies?action=new"
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              + New study
            </Link>
            <Link
              href="/projects?action=new"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-500 hover:text-slate-900"
            >
              + New project
            </Link>
            <Link
              href="/insights"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-500 hover:text-slate-900"
            >
              View insights
            </Link>
            <Link
              href="/fieldwork"
              className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-500 hover:text-slate-900"
            >
              Go to fieldwork
            </Link>
          </div>
        </div>

        {/* Recent projects */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent projects</h2>
            <Link href="/projects" className="text-xs text-slate-400 hover:text-slate-700">
              View all →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {!data || data.projects.length === 0 ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400">No projects yet.</p>
                <Link
                  href="/projects?action=new"
                  className="mt-3 inline-block rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Create your first project
                </Link>
              </div>
            ) : (
              data.projects.map((project) => (
                <Link
                  key={project.id}
                  href={`/projects/${project.id}`}
                  className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{project.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_COLORS[project.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  {project.clientOrgName && (
                    <p className="mt-1.5 text-xs text-slate-400">{project.clientOrgName}</p>
                  )}
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent studies */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Recent studies</h2>
            <Link href="/studies" className="text-xs text-slate-400 hover:text-slate-700">
              View all →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {!data || data.studies.length === 0 ? (
              <div className="col-span-3 rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
                <p className="text-sm text-slate-400">No studies yet.</p>
                <Link
                  href="/studies?action=new"
                  className="mt-3 inline-block rounded-full bg-slate-900 px-4 py-2 text-xs font-medium text-white hover:bg-slate-800"
                >
                  Create your first study
                </Link>
              </div>
            ) : (
              data.studies.map((study) => (
                <Link
                  key={study.id}
                  href={`/studies/${study.id}`}
                  className="rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 leading-snug">{study.name}</p>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        STATUS_COLORS[study.status] ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {study.status}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
