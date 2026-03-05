"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { VideoPlayer } from "../../components/VideoPlayer";
import { API_BASE, HEADERS } from "@/lib/api";

const QUESTION_LABELS = [
  "Tell us about yourself and your role.",
  "What problems or frustrations do you face?",
  "How do you currently solve these problems?",
  "What would an ideal solution look like?",
  "Is there anything else you'd like to share?",
];

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-gray-400">Loading interview...</div>}>
      <InterviewContent />
    </Suspense>
  );
}

function InterviewContent() {
  const searchParams = useSearchParams();
  const embedToken = useMemo(() => searchParams.get("token"), [searchParams]);
  const previewRef = useRef<HTMLVideoElement | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [captureMode, setCaptureMode] = useState<"video" | "audio">("video");
  const [interviewMode, setInterviewMode] = useState<"ai-moderated" | "record" | "live">("ai-moderated");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions] = useState(5);
  const questionLabels = QUESTION_LABELS;
  const [consentAccepted, setConsentAccepted] = useState(false);
  const [deviceReady, setDeviceReady] = useState(false);
  const [deviceStatus, setDeviceStatus] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [uploadUrl, setUploadUrl] = useState<string | null>(null);
  const [uploadStorageKey, setUploadStorageKey] = useState<string | null>(null);
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

  // --- Participant mode state ---
  const participantMode = !!embedToken;
  const [messages, setMessages] = useState<{ role: "ai" | "user"; content: string }[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const recognitionRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem("openqual.embed.session");
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { participantId: string; sessionId: string };
        setSessionInfo(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  const startedAtRef = useRef(0);

  useEffect(() => {
    if (!recording) {
      startedAtRef.current = 0;
      return;
    }
    startedAtRef.current = Date.now();
    const timer = window.setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startedAtRef.current) / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [recording]);

  // Auto-scroll chat to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isListening, typingText, isWaitingForResponse]);

  // Compute displayable messages, always including the first AI question for participant mode
  const displayMessages = useMemo(() => {
    if (!participantMode) return messages;
    const firstQuestion: { role: "ai" | "user"; content: string } = {
      role: "ai",
      content: QUESTION_LABELS[0] || "Welcome! Tell me about yourself and your role.",
    };
    if (messages.length === 0) return [firstQuestion];
    if (messages[0]?.role === "ai" && messages[0]?.content === firstQuestion.content) return messages;
    return [firstQuestion, ...messages];
  }, [participantMode, messages]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;
    return `${minutes}:${remainder.toString().padStart(2, "0")}`;
  };

  const runDeviceCheck = async () => {
    setDeviceStatus("Checking camera and microphone...");
    setPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: captureMode === "video",
        audio: true,
      });
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
    const stream = await navigator.mediaDevices.getUserMedia({
      video: captureMode === "video",
      audio: true,
    });
    if (previewRef.current) {
      previewRef.current.srcObject = captureMode === "video" ? stream : null;
    }
    const recorder = new MediaRecorder(stream);
    recorderRef.current = recorder;
    chunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, {
        type: captureMode === "video" ? "video/webm" : "audio/webm",
      });
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
    const sessionId = sessionInfo?.sessionId ?? "demo-session";
    const extension = captureMode === "video" ? "webm" : "webm";
    const storageKey = `uploads/${sessionId}/${Date.now()}.${extension}`;
    const res = await fetch(`${API_BASE}/media/upload-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        storageKey,
        contentType: captureMode === "video" ? "video/webm" : "audio/webm",
      }),
    });
    const data = await res.json();
    setUploadUrl(data.url);
    setUploadStorageKey(storageKey);
    setUploadStatus("ready");
    setUploadProgress(0);
  };

  const uploadRecording = async () => {
    if (!uploadUrl || !lastBlobRef.current || !uploadStorageKey) return;
    setUploadStatus("uploading");
    setUploadProgress(0);
    const success = await new Promise<boolean>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadUrl, true);
      xhr.setRequestHeader("Content-Type", captureMode === "video" ? "video/webm" : "audio/webm");
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };
      xhr.onload = () => {
        setUploadProgress(100);
        const ok = xhr.status >= 200 && xhr.status < 300;
        setUploadStatus(ok ? "done" : "failed");
        resolve(ok);
      };
      xhr.onerror = () => {
        setUploadStatus("failed");
        reject(new Error("upload_failed"));
      };
      xhr.send(lastBlobRef.current as Blob);
    });
    if (success) {
      const sessionId = sessionInfo?.sessionId ?? "demo-session";
      await fetch(`${API_BASE}/media/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...HEADERS },
        body: JSON.stringify({
          sessionId,
          type: captureMode,
          storageKey: uploadStorageKey,
        }),
      });
    }
  };

  const startMultipart = async () => {
    const sessionId = sessionInfo?.sessionId ?? "demo-session";
    const storageKey = `uploads/${sessionId}/${Date.now()}-multipart.webm`;
    const res = await fetch(`${API_BASE}/media/multipart/init`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...HEADERS },
      body: JSON.stringify({
        storageKey,
        contentType: captureMode === "video" ? "video/webm" : "audio/webm",
      }),
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
        sessionId: sessionInfo?.sessionId ?? "demo-session",
        type: captureMode,
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
        sessionId: sessionInfo?.sessionId ?? "demo-session",
        type: captureMode,
      }),
    });
    setMultipartStatus("done");
  };

  const prefetchPrompts = async () => {
    const sessionId = sessionInfo?.sessionId || "demo-session";
    setPromptStatus("Prefetching...");
    const res = await fetch(`${API_BASE}/moderator/${sessionId}/prefetch?count=3`, {
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
    const sessionId = sessionInfo?.sessionId || "demo-session";
    setPromptStatus("Getting next prompt...");
    const res = await fetch(`${API_BASE}/moderator/${sessionId}/next-turn`, {
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
        sessionId: sessionInfo?.sessionId,
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
          type: "openqual.embed.completed",
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
      window.localStorage.setItem("openqual.embed.session", JSON.stringify(nextSession));
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

  // --- Participant mode: speech recognition ---
  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setTranscript("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }
      setTranscript(finalTranscript || interimTranscript);
      if (finalTranscript) {
        setTextInput((prev) => (prev + " " + finalTranscript).trim());
      }
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
  };

  const toggleListening = () => {
    if (isListening) stopListening();
    else startListening();
  };

  const typeMessage = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      setIsTyping(true);
      let i = 0;
      const interval = setInterval(() => {
        i++;
        setTypingText(text.slice(0, i));
        if (i >= text.length) {
          clearInterval(interval);
          setIsTyping(false);
          setTypingText('');
          resolve();
        }
      }, 25);
    });
  };

  const sendResponse = async () => {
    const text = textInput.trim();
    if (!text || interviewComplete) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setTextInput("");
    setTranscript("");

    if (currentQuestionIndex >= totalQuestions - 1) {
      const completionMessage =
        "Thank you so much for sharing your thoughts! Your responses have been recorded. This interview is now complete.";
      setIsWaitingForResponse(true);
      await new Promise((r) => setTimeout(r, 800));
      setIsWaitingForResponse(false);
      await typeMessage(completionMessage);
      setMessages((prev) => [...prev, { role: "ai", content: completionMessage }]);
      setInterviewComplete(true);
      return;
    }

    setIsWaitingForResponse(true);
    const sessionId = sessionInfo?.sessionId || "demo-session";
    let aiMessage: string;
    try {
      const res = await fetch(`${API_BASE}/moderator/${sessionId}/next-turn`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...HEADERS },
        body: JSON.stringify({
          lastUserMessage: text,
          latencyMode: "fast",
          prefetchCount: 2,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        aiMessage = data.prompt ?? data.fallbackPrompt ?? questionLabels[currentQuestionIndex + 1];
      } else {
        aiMessage = questionLabels[currentQuestionIndex + 1] || "Thank you. Please continue.";
      }
    } catch {
      aiMessage = questionLabels[currentQuestionIndex + 1] || "Thank you. Please continue.";
    }

    setIsWaitingForResponse(false);
    await typeMessage(aiMessage);
    setMessages((prev) => [...prev, { role: "ai", content: aiMessage }]);
    setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
  };

  // --- Participant mode UI ---
  if (participantMode) {
    return (
      <main className="mx-auto max-w-2xl bg-white">
        {/* Header */}
        <div className="border-b bg-white px-6 py-4">
          <h1 className="text-lg font-semibold text-slate-900">Research Interview</h1>
          <p className="text-xs text-gray-500">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </p>
          <div className="mt-2 h-1.5 rounded-full bg-gray-100">
            <div
              className="h-1.5 rounded-full bg-brand-500 transition-all duration-500"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>

        {/* Chat messages area */}
        <div className="min-h-[50vh] px-6 py-6 space-y-4">
          {displayMessages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "ai"
                    ? "rounded-bl-md bg-gray-100 text-gray-800"
                    : "rounded-br-md bg-brand-500 text-white"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {isWaitingForResponse && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-gray-100 text-gray-500 rounded-bl-md">
                <span className="animate-pulse">● ● ●</span>
              </div>
            </div>
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="max-w-[80%] rounded-2xl px-4 py-3 text-sm bg-gray-100 text-gray-800 rounded-bl-md">
                {typingText}<span className="animate-pulse">|</span>
              </div>
            </div>
          )}
          {isListening && (
            <div className="flex justify-end">
              <div className="max-w-[80%] animate-pulse rounded-2xl rounded-br-md bg-brand-100 px-4 py-3 text-sm text-brand-700">
                Listening...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        {!interviewComplete ? (
          <div className="border-t bg-white px-6 py-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleListening}
                disabled={isTyping || isWaitingForResponse}
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white transition-all ${
                  isListening ? "animate-pulse bg-red-500" : "bg-brand-500 hover:bg-brand-600"
                } disabled:opacity-40`}
              >
                🎤
              </button>
              <div className="flex-1">
                <input
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendResponse();
                  }}
                  placeholder="Type or speak your response..."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                />
              </div>
              <button
                type="button"
                onClick={() => sendResponse()}
                disabled={!textInput.trim() || isTyping || isWaitingForResponse}
                className="rounded-xl bg-brand-500 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:opacity-40"
              >
                Send
              </button>
            </div>
            {transcript && <p className="mt-2 text-xs text-gray-400">Heard: {transcript}</p>}
          </div>
        ) : (
          <div className="border-t bg-white px-6 py-6 text-center">
            <p className="text-sm font-medium text-slate-600">Interview complete</p>
            <p className="mt-1 text-xs text-slate-400">
              Powered by <span className="font-medium text-slate-500">OpenQual</span>
            </p>
          </div>
        )}
      </main>
    );
  }

  // --- Admin / researcher interface (existing) ---
  return (
    <main className="min-h-screen px-8 py-10">
      <h1 className="text-2xl font-semibold">AI Interview Session</h1>
      <p className="mt-2 text-sm text-gray-600">
        LLM-powered qualitative interview. The AI moderator follows your discussion guide and probes for depth.
      </p>
      <div className="mt-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-sm text-slate-700 shadow-sm">
        <span className="font-semibold text-blue-900">How this works</span>
        <p className="mt-2">
          The AI moderator uses your system prompt and discussion guide to conduct the interview. Each question is asked
          in sequence, with the LLM generating contextual follow-up probes based on participant responses. Configure your
          LLM key in Settings.
        </p>
      </div>
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
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-600">
          <span className="font-medium text-slate-700">Mode</span>
          <select
            value={interviewMode}
            onChange={(event) => setInterviewMode(event.target.value as "ai-moderated" | "record" | "live")}
            className="rounded-lg border border-slate-200 px-3 py-1"
          >
            <option value="ai-moderated">AI-moderated</option>
            <option value="record">Record</option>
            <option value="live">Live</option>
          </select>
          <span className="font-medium text-slate-700">Capture mode</span>
          <select
            value={captureMode}
            onChange={(event) => setCaptureMode(event.target.value as "video" | "audio")}
            className="rounded-lg border border-slate-200 px-3 py-1"
          >
            <option value="video">Video + audio</option>
            <option value="audio">Audio only</option>
          </select>
        </div>
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
          {captureMode === "video" ? (
            <video ref={previewRef} autoPlay muted className="mt-4 w-full rounded-xl bg-black" />
          ) : (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Audio-only capture selected. No video preview is shown.
            </div>
          )}
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
              {captureMode === "video" ? (
                <VideoPlayer src={recordedUrl} />
              ) : (
                <audio controls src={recordedUrl} className="w-full" />
              )}
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
          <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-800">
            <span className="font-semibold">
              Question {currentQuestionIndex + 1} of {totalQuestions}
            </span>
            {" — "}
            <span>{questionLabels[currentQuestionIndex]}</span>
          </div>
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
              onClick={() => {
                getNextPrompt();
                setCurrentQuestionIndex((prev) => Math.min(prev + 1, totalQuestions - 1));
              }}
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
                      window.localStorage.removeItem("openqual.embed.session");
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
