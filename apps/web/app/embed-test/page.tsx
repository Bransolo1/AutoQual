"use client";

import { useState } from "react";
import { useApi } from "../lib/use-api";

export default function EmbedTestPage() {
  const { apiFetch, user } = useApi();
  const [studyId, setStudyId] = useState("demo-study-id");
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const createToken = async () => {
    setStatus("Creating token...");
    const response = await apiFetch(`/embed/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({ studyId, workspaceId: user?.workspaceId ?? "" }),
    });
    if (!response.ok) {
      setStatus("Failed to create token.");
      return;
    }
    const data = await response.json();
    setToken(data.token);
    setStatus("Token created.");
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Embed Test</h1>
      <p className="mt-2 text-sm text-gray-600">
        Generate an embed token and load the iframe for troubleshooting.
      </p>
      <div className="mt-4 flex flex-wrap gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          value={studyId}
          onChange={(event) => setStudyId(event.target.value)}
          placeholder="Study ID"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={createToken}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white"
        >
          Create token
        </button>
        {status && <span className="self-center text-xs text-gray-500">{status}</span>}
      </div>
      {token && (
        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-gray-500">Embed URL</p>
          <p className="mt-1 break-all text-sm text-gray-700">
            {API_BASE}/embed/{token}
          </p>
          <iframe
            title="Embed preview"
            src={`/embed/${token}`}
            className="mt-4 h-[520px] w-full rounded-xl border border-gray-200"
          />
        </div>
      )}
    </main>
  );
}
