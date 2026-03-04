"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Question = { id: string; prompt: string; type: string; followUp: string | null };
type StudyInfo = {
  studyId: string;
  studyName: string;
  mode: string;
  language: string;
  questions: Question[];
};

type RecordingState = "idle" | "recording" | "done";

// Browser speech recognition type shim
type SpeechRecognitionEvent = Event & {
  results: SpeechRecognitionResultList;
  resultIndex: number;
};
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
  }
}
interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onspeechend: (() => void) | null;
  onerror: ((e: Event) => void) | null;
  onend: (() => void) | null;
}

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
  const [liveTranscript, setLiveTranscript] = useState("");
  const [finalTranscript, setFinalTranscript] = useState("");
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(`study:${token}`);
    const sid = sessionStorage.getItem(`session:${token}`);
    if (cached) setStudy(JSON.parse(cached) as StudyInfo);
    if (sid) setSessionId(sid);
    const mutedPref = sessionStorage.getItem("voice:muted");
    if (mutedPref === "true") setMuted(true);
  }, [token]);

  const question = study?.questions[qIndex] ?? null;
  const totalQuestions = study?.questions.length ?? 0;
  const progress = totalQuestions > 0 ? (qIndex / totalQuestions) * 100 : 0;
  const mode = study?.mode === "voice" || question?.type === "voice" ? "voice" : "text";

  // ── TTS: speak the question aloud when it loads ──────────────────────────
  useEffect(() => {
    if (!question || mode !== "voice" || muted) return;
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const text = showFollowUp && question.followUp ? question.followUp : question.prompt;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = study?.language ?? "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);

    return () => {
      window.speechSynthesis.cancel();
    };
  }, [question, showFollowUp, mode, muted, study?.language]);

  function repeatQuestion() {
    if (!question || !window.speechSynthesis) return;
    const text = showFollowUp && question.followUp ? question.followUp : question.prompt;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = study?.language ?? "en-US";
    utter.rate = 0.9;
    window.speechSynthesis.speak(utter);
  }

  function toggleMute() {
    const next = !muted;
    setMuted(next);
    sessionStorage.setItem("voice:muted", String(next));
    if (next) window.speechSynthesis?.cancel();
  }

  // ── STT: start speech recognition alongside MediaRecorder ────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      setLiveTranscript("");
      setFinalTranscript("");

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

      // Start speech recognition if available
      const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = study?.language ?? "en-US";

        let accumulated = "";

        recognition.onresult = (e: SpeechRecognitionEvent) => {
          let interim = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const r = e.results[i];
            if (r.isFinal) {
              accumulated += r[0].transcript + " ";
            } else {
              interim += r[0].transcript;
            }
          }
          setFinalTranscript(accumulated);
          setLiveTranscript(accumulated + interim);

          // Reset silence timer on new speech
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        };

        recognition.onspeechend = () => {
          // Auto-stop after 2s of silence
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            recognitionRef.current?.stop();
            mediaRecorderRef.current?.stop();
          }, 2000);
        };

        recognition.onerror = () => {
          // Recognition errors are non-fatal — recording still works
        };

        recognition.start();
        recognitionRef.current = recognition;
      }
    } catch {
      setError("Microphone access denied. Please allow microphone and try again.");
    }
  }, [study?.language]);

  const stopRecording = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
  }, []);

  function resetRecording() {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    mediaRecorderRef.current?.stop();
    setAudioBlob(null);
    setAudioUrl(null);
    setLiveTranscript("");
    setFinalTranscript("");
    setRecordingState("idle");
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  async function submit() {
    if (!question || !sessionId) return;
    setSubmitting(true);
    setError(null);

    let content = textAnswer.trim();

    if (mode === "voice") {
      // Use real STT transcript if available, otherwise note audio was recorded
      const transcript = finalTranscript.trim();
      if (transcript) {
        content = transcript;
      } else if (audioBlob) {
        content = `[voice response — ${Math.round(audioBlob.size / 1024)} KB audio recorded]`;
      }
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
      await fetch("/api/p/turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, sessionId, speaker: "moderator", content: question.followUp }),
      });
      setShowFollowUp(true);
      setTextAnswer("");
      setAudioBlob(null);
      setAudioUrl(null);
      setLiveTranscript("");
      setFinalTranscript("");
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
      setLiveTranscript("");
      setFinalTranscript("");
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

  const canSubmit = mode === "text"
    ? textAnswer.trim().length > 0
    : recordingState === "done" && (finalTranscript.trim().length > 0 || audioBlob !== null);

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
          {/* Counter + voice controls */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-400">
              Question {qIndex + 1} of {totalQuestions}
            </p>
            {mode === "voice" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={repeatQuestion}
                  className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  ↺ Repeat
                </button>
                <button
                  type="button"
                  onClick={toggleMute}
                  className="rounded-lg px-2 py-1 text-xs text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                >
                  {muted ? "🔇 Muted" : "🔊 Mute"}
                </button>
              </div>
            )}
          </div>

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
                    <>
                      <div className="relative">
                        <span className="absolute inline-flex h-16 w-16 animate-ping rounded-full bg-red-400 opacity-40" />
                        <button
                          type="button"
                          onClick={stopRecording}
                          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-slate-800 text-white shadow-lg hover:bg-slate-700"
                          aria-label="Stop recording"
                        >
                          <span className="h-5 w-5 rounded bg-white" />
                        </button>
                      </div>
                      <p className="text-xs text-slate-400">Listening… tap Stop to submit</p>
                    </>
                  )}
                  {/* Live transcript */}
                  {(recordingState === "recording" || recordingState === "done") && liveTranscript && (
                    <div className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                      <p className={`text-sm leading-relaxed ${recordingState === "done" ? "text-slate-800" : "text-slate-400"}`}>
                        {liveTranscript}
                      </p>
                    </div>
                  )}
                  {recordingState === "done" && (
                    <div className="w-full">
                      {audioUrl && <audio controls src={audioUrl} className="w-full" />}
                      <button
                        type="button"
                        onClick={resetRecording}
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
