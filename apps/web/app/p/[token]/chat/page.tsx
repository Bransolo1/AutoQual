"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Turn = { id: string; speaker: "moderator" | "participant"; content: string };

type StudyInfo = {
  studyId: string;
  studyName: string;
  mode: string;
  language: string;
  questions: Array<{ id: string; prompt: string }>;
};

export default function ChatPage() {
  const params = useParams<{ token: string }>();
  const token = params?.token ?? "";
  const router = useRouter();

  const [study, setStudy] = useState<StudyInfo | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [awaitingModerator, setAwaitingModerator] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [depth, setDepth] = useState<"quick" | "balanced" | "reflective" | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const cached = sessionStorage.getItem(`study:${token}`);
    const sid = sessionStorage.getItem(`session:${token}`);
    const storedDepth = sessionStorage.getItem(`depth:${token}`) as "quick" | "balanced" | "reflective" | null;
    if (cached) {
      const s = JSON.parse(cached) as StudyInfo;
      setStudy(s);
      setTotalQuestions(s.questions.length);
    }
    if (sid) setSessionId(sid);
    if (storedDepth) setDepth(storedDepth);
  }, [token]);

  // Fetch the first moderator question once session is ready
  useEffect(() => {
    if (!sessionId || turns.length > 0) return;
    fetchNextModerator(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, awaitingModerator]);

  async function fetchNextModerator(lastUserMessage: string | null): Promise<boolean> {
    if (!sessionId) return false;
    setAwaitingModerator(true);
    try {
      const res = await fetch("/api/p/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, lastUserMessage, depth }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      const message: string = data.message ?? data.text ?? "";
      if (message) {
        setTurns((prev) => [
          ...prev,
          { id: `m-${Date.now()}`, speaker: "moderator", content: message },
        ]);
      }
      setQuestionIndex(data.questionIndex ?? questionIndex);
      if (data.isComplete) {
        setIsComplete(true);
        return true;
      }
    } catch {
      // network error — leave awaitingModerator false so user can retry
    } finally {
      setAwaitingModerator(false);
    }
    return false;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || !sessionId || awaitingModerator) return;

    setInput("");
    setTurns((prev) => [
      ...prev,
      { id: `p-${Date.now()}`, speaker: "participant", content: text },
    ]);

    // Persist turn server-side (fire-and-forget)
    fetch("/api/p/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, sessionId, speaker: "participant", content: text }),
    }).catch(() => undefined);

    const complete = await fetchNextModerator(text);
    if (complete) {
      setTimeout(() => router.push(`/p/${token}/done`), 1800);
    } else {
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!study || !sessionId) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-slate-700" />
      </main>
    );
  }

  // ── Progress dots ──────────────────────────────────────────────────────────
  const progressDots =
    totalQuestions > 0 ? (
      <div className="flex items-center gap-1.5">
        {Array.from({ length: totalQuestions }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i < questionIndex
                ? "w-4 bg-slate-700"
                : i === questionIndex
                ? "w-4 bg-slate-400"
                : "w-1.5 bg-slate-200"
            }`}
          />
        ))}
      </div>
    ) : null;

  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="z-10 border-b border-slate-100 bg-white px-4 py-3 shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-slate-400">
              Sensehub Research
            </p>
            <p className="text-sm font-semibold text-slate-800">{study.studyName}</p>
          </div>
          {progressDots}
        </div>
      </div>

      {/* ── Conversation ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {turns.map((turn) => (
            <div
              key={turn.id}
              className={`flex ${turn.speaker === "participant" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                  turn.speaker === "participant"
                    ? "rounded-br-sm bg-slate-800 text-white"
                    : "rounded-bl-sm bg-white text-slate-800"
                }`}
              >
                {turn.content}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {awaitingModerator && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                </div>
              </div>
            </div>
          )}

          {/* Completion message */}
          {isComplete && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl rounded-bl-sm bg-white px-4 py-3 shadow-sm text-sm text-slate-500">
                Redirecting you to the completion screen…
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── Input ─────────────────────────────────────────────────────────── */}
      {!isComplete && (
        <div className="border-t border-slate-100 bg-white px-4 py-4">
          <div className="mx-auto flex max-w-2xl items-end gap-3">
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                // Auto-grow up to 5 rows
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type your response… (Enter to send)"
              disabled={awaitingModerator}
              className="flex-1 resize-none overflow-hidden rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-slate-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={!input.trim() || awaitingModerator}
              aria-label="Send response"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition-colors hover:bg-slate-700 disabled:opacity-40"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-slate-400">
            Shift + Enter for a new line
          </p>
        </div>
      )}
    </div>
  );
}
