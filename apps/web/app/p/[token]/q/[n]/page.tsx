"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = { id: string; prompt: string; type: string; followUp: string | null };
type StudyInfo = {
  studyId: string;
  studyName: string;
  mode: string;
  questions: Question[];
};

type RecordingState = "idle" | "recording" | "done";

export default function QuestionPage() {
  const params = useParams<{ token: string; n: string }>();
  const token = params?.token ?? "";
  const qIndex = Number(params?.n ?? 0);
  const router = useRouter();

  const [study, setStudy] = useState<StudyInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [textAnswer, setTextAnswer] = useState("");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const cached = sessionStorage.getItem(`study:${token}`);
    const sid = sessionStorage.getItem(`session:${token}`);
    if (cached) setStudy(JSON.parse(cached) as StudyInfo);
    if (sid) setSessionId(sid);
  }, [token]);

  const question = study?.questions[qIndex] ?? null;
  const totalQuestions = study?.questions.length ?? 0;
  const progress = totalQuestions > 0 ? ((qIndex) / totalQuestions) * 100 : 0;

  // Determine response mode: prefer study.mode, fallback to question.type
  const mode = study?.mode === "voice" || question?.type === "voice" ? "voice" : "text";

  // ---- Recording ----
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setRecordingState("done");
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecordingState("recording");
    } catch {
      setError("Microphone access denied. Please allow microphone and try again.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
  }, []);

  // ---- Submit ----
  async function submit() {
    if (!question || !sessionId) return;
    setSubmitting(true);
    setError(null);

    let content = textAnswer.trim();

    // For voice: convert blob to base64 text representation (server stores as text turn)
    if (mode === "voice" && audioBlob) {
      // Store a placeholder; actual audio uploaded via /interview page if needed
      content = `[voice response — ${Math.round(audioBlob.size / 1024)} KB audio recorded]`;
    }

    if (!content) {
      setError("Please provide a response before continuing.");
      setSubmitting(false);
      return;
    }

    await fetch("/api/p/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, sessionId, speaker: "participant", content }),
    });

    // Show follow-up if available, then advance
    if (question.followUp && !showFollowUp) {
      // Record follow-up prompt as a system/moderator turn
      await fetch("/api/p/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId, speaker: "moderator", content: question.followUp }),
      });
      setShowFollowUp(true);
      setTextAnswer("");
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingState("idle");
      setSubmitting(false);
      return;
    }

    const next = qIndex + 1;
    if (next >= totalQuestions) {
      router.push(`/p/${token}/done`);
    } else {
      setShowFollowUp(false);
      setTextAnswer("");
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingState("idle");
      router.push(`/p/${token}/q/${next}`);
    }
  }

  if (!study || !question) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </main>
    );
  }

  const canSubmit = mode === "text" ? textAnswer.trim().length > 0 : recordingState === "done";

  return (
    <main className="flex min-h-screen flex-col">
      {/* Progress bar */}
      <div className="h-1 w-full bg-slate-100">
        <div
          className="h-full bg-slate-800 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        <div className="w-full max-w-xl">
          {/* Counter */}
          <p className="mb-4 text-sm font-medium text-slate-400">
            Question {qIndex + 1} of {totalQuestions}
          </p>

          {/* Question / Follow-up prompt */}
          <div className="rounded-2xl bg-white p-8 shadow-sm">
            {showFollowUp && question.followUp ? (
              <>
                <p className="mb-2 text-xs font-medium uppercase tracking-widest text-blue-500">
                  Follow-up
                </p>
                <h2 className="text-xl font-semibold text-slate-900 leading-snug">
                  {question.followUp}
                </h2>
              </>
            ) : (
              <h2 className="text-xl font-semibold text-slate-900 leading-snug">
                {question.prompt}
              </h2>
            )}

            <div className="mt-6">
              {mode === "text" ? (
                <>
                  <textarea
                    rows={5}
                    value={textAnswer}
                    onChange={(e) => setTextAnswer(e.target.value)}
                    placeholder="Type your response here…"
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:border-slate-500 focus:outline-none resize-none"
                  />
                  <p className="mt-1 text-right text-xs text-slate-300">{textAnswer.length} chars</p>
                </>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {recordingState === "idle" && (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
                      aria-label="Start recording"
                    >
                      <svg className="h-7 w-7" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14a3 3 0 003-3V5a3 3 0 00-6 0v6a3 3 0 003 3z" />
                        <path d="M17 11a5 5 0 01-10 0H5a7 7 0 0014 0h-2z" />
                      </svg>
                    </button>
                  )}
                  {recordingState === "recording" && (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700"
                      aria-label="Stop recording"
                    >
                      <span className="h-5 w-5 rounded bg-white" />
                    </button>
                  )}
                  {recordingState === "recording" && (
                    <p className="animate-pulse text-sm text-red-500">Recording…</p>
                  )}
                  {recordingState === "done" && audioUrl && (
                    <div className="w-full">
                      <audio controls src={audioUrl} className="w-full" />
                      <button
                        type="button"
                        onClick={() => { setAudioBlob(null); setAudioUrl(null); setRecordingState("idle"); }}
                        className="mt-2 text-xs text-slate-400 hover:text-slate-600"
                      >
                        Re-record
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <button
              type="button"
              onClick={submit}
              disabled={!canSubmit || submitting}
              className="mt-6 w-full rounded-xl bg-slate-900 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40"
            >
              {submitting
                ? "Saving…"
                : qIndex + 1 === totalQuestions && !showFollowUp
                  ? "Finish →"
                  : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
