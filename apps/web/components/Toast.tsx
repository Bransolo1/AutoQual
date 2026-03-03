"use client";
import { createContext, useCallback, useContext, useId, useRef, useState } from "react";
import type { ReactNode } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type ToastVariant = "success" | "error" | "info" | "warning";

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  toast: (message: string, variant?: ToastVariant) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const ToastContext = createContext<ToastContextValue>({
  toast: () => undefined,
});

export function useToast() {
  return useContext(ToastContext);
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
const VARIANT_CLASSES: Record<ToastVariant, string> = {
  success: "bg-green-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-800 text-white",
  warning: "bg-amber-500 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const counterRef = useRef(0);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = `toast-${++counterRef.current}`;
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="assertive"
        aria-atomic="false"
        className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${VARIANT_CLASSES[t.variant]}`}
          >
            <span className="flex-1">{t.message}</span>
            <button
              type="button"
              aria-label="Dismiss"
              onClick={() => dismiss(t.id)}
              className="shrink-0 opacity-70 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
