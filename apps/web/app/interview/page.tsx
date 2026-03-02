"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoPlayer } from "../../components/VideoPlayer";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const HEADERS = { "x-workspace-id": "demo-workspace-id", "x-user-id": "demo-user" };

export default function InterviewPage() {
  const searchParams = useSearchParams();
  const embedToken = useMemo(() => searchParams.get("token"), [searchParams]);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [multipart, setMultipart] = useState<{ uploadId: string; storageKey: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const [multipartStatus, setMultipartStatus] = useState<string | null>(null);
  const [multipartProgress, setMultipartProgress] = useState<number>(0);
  const [multipartParts, setMultipartParts] = useState<{ ETag: string; PartNumber: number }[]>([]);
  const [lastResponse, setLastResponse] = useState("");
  const [nextPrompt, setNextPrompt] = useState<string | null>(null);
  const [prefetchedPrompts, setPrefetchedPrompts] = useState<string[]>([]);
  const [promptStatus, setPromptStatus] = useState<string | null>(null);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);
  const [participantEmail, setParticipantEmail] = useState("");
  const [sessionInfo, setSessionInfo] = useState<{ participantId: string; sessionId: string } | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);
  const [turnStatus, setTurnStatus] = useState<string | null>(null);
  const [transcriptStatus, setTranscriptStatus] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const lastBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("sensehub.embed.session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { participantId: string; sessionId: string };
        setSessionInfo(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now() - elapsedSeconds * 1000;
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  const runDeviceCheck = async () => {
    setDeviceStatus("Checking camera and microphone...");
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setDeviceReady(true);
      setDeviceStatus("Devices ready. You can start the interview.");
    } catch {
      setDeviceReady(false);
      setDeviceStatus("Device check failed.");
      setPermissionError("Please allow camera and microphone access in your browser.");
    }
  };

  const startRecording = async () => {
    if (!consentAccepted) {
      setPermissionError("Please accept the consent notice before recording.");
      return;
    }
    if (!deviceReady) {
      setPermissionError("Run the device check before recording.");
      return;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    if (previewRef.current) {
      previewRef.current.srcObject = stream;
    }
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      lastBlobRef.current = blob;
      setRecordedUrl(URL.createObjectURL(blob));
      stream.getTracks().forEach((t) => t.stop());
    };
    recorder.start();
    setRecording(true);
    setElapsedSeconds(0);
    setPermissionError(null);
  };

  const stopRecording = () => {
    recorderRef.current?.stop();
    setRecording(false);
  };

  const requestUploadUrl = async () => {
    const storageKey = `uploads/demo-session/${Date.now()}.webm`;
    const res = await fetch(`${API_BASE}/media/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({ storageKey, contentType: "video/webm" }),
    });
    const data = await res.json();
    setUploadUrl(data.url);
    setUploadStatus("ready");
    setUploadProgress(0);
  };

  const uploadRecording = async () => {
    if (!uploadUrl || !lastBlobRef.current) return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", "video/webm");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploadProgress(100);
        setUploadStatus(xhr.status >= 200 && xhr.status < 300 ? "done" : "failed");
        resolve();
      };
      xhr.onerror = () => {
        setUploadStatus("failed");
        reject(new Error("upload_failed"));
      };
      xhr.send(lastBlobRef.current as Blob);
    });
  };

  const startMultipart = async () => {
    const storageKey = `uploads/demo-session/${Date.now()}-multipart.webm`;
    const res = await fetch(`${API_BASE}/media/multipart/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({ storageKey, contentType: "video/webm" }),
    });
    const data = await res.json();
    setMultipart({ uploadId: data.uploadId, storageKey });
  };

  const uploadMultipart = async () => {
    if (!multipart || !lastBlobRef.current) return;
    const blob = lastBlobRef.current;
    const chunkSize = 5 * 1024 * 1024;
    const parts: { ETag: string; PartNumber: number }[] = [];
    setMultipartStatus("uploading");
    setMultipartProgress(0);
    const totalParts = Math.ceil(blob.size / chunkSize);
    const concurrency = 3;
    let completed = 0;
    const runPart = async (partNumber: number) => {
      const offset = (partNumber - 1) * chunkSize;
      const chunk = blob.slice(offset, Math.min(blob.size, offset + chunkSize));
      const partRes = await fetch(`${API_BASE}/media/multipart/part-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...HEADERS },
        body: JSON.stringify({
          storageKey: multipart.storageKey,
          uploadId: multipart.uploadId,
          partNumber,
        }),
      });
      const partData = await partRes.json();
      let attempts = 0;
      while (attempts < 3) {
        try {
          const uploadRes = await fetch(partData.url, { method: "PUT", body: chunk });
          const etag = uploadRes.headers.get("ETag") ?? "";
          parts.push({ ETag: etag, PartNumber: partNumber });
          completed += 1;
          setMultipartProgress(Math.round((completed / totalParts) * 100));
          return;
        } catch {
          attempts += 1;
        }
      }
      throw new Error(`part_upload_failed_${partNumber}`);
    };
    const queue = Array.from({ length: totalParts }, (_, i) => i + 1);
    const workers = Array.from({ length: Math.min(concurrency, totalParts) }, async () => {
      while (queue.length) {
        const next = queue.shift();
        if (!next) return;
        await runPart(next);
      }
    });
    await Promise.all(workers);
    setMultipartParts(parts);
    await fetch(`${API_BASE}/media/multipart/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        storageKey: multipart.storageKey,
        uploadId: multipart.uploadId,
        parts,
        sessionId: "demo-session",
        type: "video",
      }),
    });
    setMultipartStatus("done");
  };

  const resumeMultipart = async () => {
    if (!multipart || multipartParts.length === 0) return;
    setMultipartStatus("resuming");
    await fetch(`${API_BASE}/media/multipart/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        storageKey: multipart.storageKey,
        uploadId: multipart.uploadId,
        parts: multipartParts,
        sessionId: "demo-session",
        type: "video",
      }),
    });
    setMultipartStatus("done");
  };

  const prefetchPrompts = async () => {
    setPromptStatus("Prefetching...");
    const res = await fetch(`${API_BASE}/moderator/demo-session/prefetch?count=3`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
    });
    if (!res.ok) {
      setPromptStatus("Prefetch failed.");
      return;
    }
    const data = await res.json();
    setPrefetchedPrompts(Array.isArray(data.prefetch) ? data.prefetch : []);
    setPromptStatus("Next questions warmed.");
  };

  const getNextPrompt = async () => {
    setPromptStatus("Getting next prompt...");
    const res = await fetch(`${API_BASE}/moderator/demo-session/next-turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        lastUserMessage: lastResponse,
        latencyMode: "fast",
        prefetchCount: 2,
      }),
    });
    if (!res.ok) {
      setPromptStatus("Unable to get next prompt.");
      return;
    }
    const data = await res.json();
    setNextPrompt(data.prompt ?? data.fallbackPrompt ?? null);
    setPrefetchedPrompts(Array.isArray(data.prefetch) ? data.prefetch : []);
    setPromptStatus("Next prompt ready.");
  };

  const completeEmbeddedInterview = async () => {
    if (!embedToken) return;
    setCompletionStatus("Submitting...");
    const res = await fetch(`${API_BASE}/embed/${embedToken}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        metadata: {
          recorded: Boolean(recordedUrl),
          uploaded: uploadStatus === "done" || multipartStatus === "done",
          consented: consentAccepted,
        },
      }),
    });
    const success = res.ok;
    setCompletionStatus(success ? "Submission complete. Thank you!" : "Unable to submit. Please try again.");
    if (success && typeof window !== "undefined") {
      window.parent?.postMessage(
        {
          type: "sensehub.embed.completed",
          studyId: searchParams.get("studyId") ?? null,
          token: embedToken,
        },
        "*",
      );
    }
  };

  const createEmbedSession = async () => {
    if (!embedToken || !participantEmail.trim()) return;
    setSessionStatus("Starting session...");
    const res = await fetch(`${API_BASE}/embed/${embedToken}/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: participantEmail.trim(),
        consented: consentAccepted,
      }),
    });
    if (!res.ok) {
      setSessionStatus("Unable to start session.");
      return;
    }
    const data = await res.json();
    const nextSession = { participantId: data.participantId, sessionId: data.sessionId };
    setSessionInfo(nextSession);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("sensehub.embed.session", JSON.stringify(nextSession));
    }
    setSessionStatus("Session ready.");
  };

  const updateConsent = async (nextValue: boolean) => {
    setConsentAccepted(nextValue);
    if (!embedToken || !sessionInfo) return;
    await fetch(`${API_BASE}/embed/${embedToken}/consent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: sessionInfo.sessionId, consented: nextValue }),
    });
  };

  const saveResponse = async () => {
    if (!embedToken || !sessionInfo) return;
    if (!lastResponse.trim()) {
      setTurnStatus("Add a response summary before saving.");
      return;
    }
    setTurnStatus("Saving response...");
    const turnRes = await fetch(`${API_BASE}/embed/${embedToken}/turn`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionInfo.sessionId,
        speaker: "participant",
        content: lastResponse.trim(),
      }),
    });
    setTurnStatus(turnRes.ok ? "Response saved." : "Unable to save response.");
    setTranscriptStatus("Saving transcript...");
    const transcriptRes = await fetch(`${API_BASE}/embed/${embedToken}/transcript`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId: sessionInfo.sessionId,
        content: lastResponse.trim(),
      }),
    });
    setTranscriptStatus(transcriptRes.ok ? "Transcript saved." : "Unable to save transcript.");
  };

  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">Participant Interview</h1>
      <p className="mt-2 text-sm text-gray-600">
        Thank you for taking part. Your feedback helps improve the experience.
      </p>
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5 text-sm text-slate-600 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="font-semibold text-slate-900">Before you begin</span>
          <span className="text-xs text-slate-500">Step 1 of 4</span>
        </div>
        <p className="mt-2">
          Please ensure you are in a quiet place, using headphones if possible. This interview will take about
          5–7 minutes.
        </p>
        <label className="mt-3 flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={consentAccepted}
            onChange={(event) => updateConsent(event.target.checked)}
          />
          I consent to recording and understand my responses are confidential.
        </label>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live Preview</h2>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
              {recording ? `Recording · ${formatTime(elapsedSeconds)}` : "Idle"}
            </span>
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Answer naturally. If you need to pause, stop and re-record the clip.
          </p>
          <video ref={previewRef} autoPlay muted className="mt-4 w-full rounded-xl bg-black" />
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={runDeviceCheck}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Run device check
            </button>
            {!recording && (
              <button
                type="button"
                onClick={startRecording}
                className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
                disabled={!consentAccepted || !deviceReady}
              >
                Start recording
              </button>
            )}
            {recording && (
              <button
                type="button"
                onClick={stopRecording}
                className="rounded-full bg-red-500 px-4 py-2 text-sm font-medium text-white"
              >
                Stop recording
              </button>
            )}
            {!recording && recordedUrl && (
              <button
                type="button"
                onClick={requestUploadUrl}
                className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Get upload URL
              </button>
            )}
            {!recording && recordedUrl && (
              <button
                type="button"
                onClick={startMultipart}
                className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Start multipart
              </button>
            )}
            {!recording && uploadUrl && (
              <button
                type="button"
                onClick={uploadRecording}
                className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Upload to storage
              </button>
            )}
            {!recording && multipart && (
              <button
                type="button"
                onClick={uploadMultipart}
                className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Upload multipart
              </button>
            )}
            {!recording && multipart && multipartParts.length > 0 && (
              <button
                type="button"
                onClick={resumeMultipart}
                className="rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Resume multipart
              </button>
            )}
          </div>
          {deviceStatus && <p className="mt-3 text-xs text-slate-500">{deviceStatus}</p>}
          {permissionError && <p className="mt-2 text-xs text-rose-600">{permissionError}</p>}
          {uploadStatus && (
            <div className="mt-3 text-sm text-gray-600">
              Upload status: {uploadStatus} ({uploadProgress}%)
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
          {multipartStatus && (
            <div className="mt-3 text-sm text-gray-600">
              Multipart status: {multipartStatus} ({multipartProgress}%)
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-brand-500"
                  style={{ width: `${multipartProgress}%` }}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Playback</h2>
          {recordedUrl ? (
            <div className="mt-4">
              <VideoPlayer src={recordedUrl} />
            </div>
          ) : (
            <p className="mt-4 text-sm text-gray-500">Record a clip to preview playback.</p>
          )}
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Low-latency prompts</h2>
          <p className="mt-2 text-sm text-gray-600">
            We prefetch the next questions so the moderator can respond quickly after you speak.
          </p>
          <label className="mt-4 block text-sm text-slate-600">
            Your last response (summary)
            <textarea
              className="mt-2 w-full rounded-lg border border-slate-200 p-2"
              rows={3}
              value={lastResponse}
              onChange={(event) => setLastResponse(event.target.value)}
              placeholder="Optional: summarize what you just said."
            />
          </label>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={prefetchPrompts}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
            >
              Prefetch questions
            </button>
            <button
              type="button"
              onClick={getNextPrompt}
              className="rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            >
              Get next prompt
            </button>
          </div>
          {promptStatus && <p className="mt-3 text-xs text-slate-500">{promptStatus}</p>}
          {nextPrompt && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Next question: {nextPrompt}
            </div>
          )}
          {prefetchedPrompts.length > 0 && (
            <div className="mt-3 text-xs text-slate-500">
              Prefetched: {prefetchedPrompts.join(" · ")}
            </div>
          )}
        </section>

        {embedToken && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">Submit interview</h2>
            <p className="mt-2 text-sm text-slate-600">
              When you are finished, submit your response to complete the interview.
            </p>
            <div className="mt-4 grid gap-3">
              <label className="text-sm text-slate-600">
                Participant email
                <input
                  value={participantEmail}
                  onChange={(event) => setParticipantEmail(event.target.value)}
                  className="mt-2 w-full rounded-lg border border-slate-200 p-2"
                  placeholder="name@example.com"
                />
              </label>
              <button
                type="button"
                onClick={createEmbedSession}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700"
              >
                Start session
              </button>
              {sessionStatus && <p className="text-xs text-slate-500">{sessionStatus}</p>}
              {sessionInfo && (
                <p className="text-xs text-slate-500">
                  Session ID: {sessionInfo.sessionId}
                </p>
              )}
              {sessionInfo && (
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.localStorage.removeItem("sensehub.embed.session");
                    }
                    setSessionInfo(null);
                    setSessionStatus("Session cleared.");
                  }}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600"
                >
                  Clear session
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={completeEmbeddedInterview}
              className="mt-3 rounded-full bg-brand-500 px-4 py-2 text-sm font-medium text-white"
            >
              Submit interview
            </button>
            {sessionInfo && (
              <button
                type="button"
                onClick={saveResponse}
                className="mt-3 rounded-full border border-brand-500 px-4 py-2 text-sm font-medium text-brand-600"
              >
                Save response summary
              </button>
            )}
            {completionStatus && <p className="mt-3 text-xs text-slate-500">{completionStatus}</p>}
            {turnStatus && <p className="mt-2 text-xs text-slate-500">{turnStatus}</p>}
            {transcriptStatus && <p className="mt-2 text-xs text-slate-500">{transcriptStatus}</p>}
          </section>
        )}
      </div>
    </main>
  );
}
