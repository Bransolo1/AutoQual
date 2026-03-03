"use client";

import { useRef, useState } from "react";
import { useApi } from "../lib/use-api";

type Artifact = {
  id: string;
  storageKey: string;
  clips: { id: string; startMs: number; endMs: number }[];
};

export default function EvidencePage() {
  const { apiFetch, user } = useApi();
  const [sessionId, setSessionId] = useState("demo-session");
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [activeClip, setActiveClip] = useState<{ startMs: number; endMs: number } | null>(null);
  const [scrubValue, setScrubValue] = useState<number>(0);
  const [activeArtifact, setActiveArtifact] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const loadArtifacts = async () => {
    const res = await apiFetch(`/media/artifacts?sessionId=${sessionId}`));
    setArtifacts(res.ok ? await res.json() : []);
  };

  const fetchSignedUrl = async (artifactId: string) => {
    const res = await apiFetch(`/media/artifacts/${artifactId}/signed-url`));
    const data = res.ok ? await res.json() : null;
    setSignedUrl(data?.url ?? null);
    setActiveArtifact(artifactId);
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Evidence Viewer</h1>
      <p className="mt-2 text-sm text-gray-600">Load media artifacts and clips for a session.</p>

      <div className="mt-4 flex gap-3">
        <input
          value={sessionId}
          onChange={(e) => setSessionId(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Session ID"
        />
        <button
          type="button"
          onClick={loadArtifacts}
          className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"
        >
          Load
        </button>
      </div>

      <div className="mt-6 grid gap-4">
        {artifacts.map((artifact) => (
          <div key={artifact.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Artifact {artifact.id}</h2>
              <button
                type="button"
                onClick={() => fetchSignedUrl(artifact.id)}
                className="text-sm text-brand-600 hover:underline"
              >
                Get signed URL
              </button>
            </div>
            <p className="mt-2 text-sm text-gray-500">Storage: {artifact.storageKey}</p>
            <div className="mt-3 space-y-2">
              {artifact.clips.map((clip) => (
                <div key={clip.id} className="rounded-lg border border-gray-100 p-3 text-sm">
                  Clip {clip.id} · {clip.startMs}–{clip.endMs}ms
                  <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                    <div
                      className="h-2 rounded-full bg-brand-500"
                      style={{ width: `${Math.min(100, (clip.endMs / 60000) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveClip({ startMs: clip.startMs, endMs: clip.endMs });
                        if (videoRef.current) {
                          videoRef.current.currentTime = clip.startMs / 1000;
                        }
                        setScrubValue(clip.startMs / 1000);
                      }}
                      className="text-xs text-brand-600 hover:underline"
                    >
                      Scrub
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {signedUrl && activeArtifact === artifact.id && (
              <div className="mt-4">
                <video ref={videoRef} controls className="w-full rounded-lg bg-black">
                  <source src={signedUrl} />
                </video>
                {activeClip && (
                  <div className="mt-2 text-xs text-gray-500">
                    Scrub range: {activeClip.startMs}–{activeClip.endMs}ms
                    <input
                      type="range"
                      min={activeClip.startMs / 1000}
                      max={activeClip.endMs / 1000}
                      value={scrubValue}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        setScrubValue(value);
                        if (videoRef.current) {
                          videoRef.current.currentTime = value;
                        }
                      }}
                      className="mt-2 w-full"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {signedUrl && (
        <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold">Signed URL</h3>
          <p className="mt-2 break-all text-xs text-gray-600">{signedUrl}</p>
        </div>
      )}
    </main>
  );
}
