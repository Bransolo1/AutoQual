"use client";
import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** If set, confirm button stays disabled until user types this value exactly. */
  requireTyping?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  requireTyping,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
      setTyped("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      el.close();
    }
  }, [open]);

  if (!open) return null;

  const confirmDisabled = requireTyping ? typed !== requireTyping : false;

  return (
    <dialog
      ref={dialogRef}
      onClose={onCancel}
      className="rounded-2xl border border-gray-200 p-0 shadow-xl backdrop:bg-black/40 open:flex open:flex-col"
      style={{ maxWidth: "24rem", width: "100%" }}
    >
      <div className="px-6 pt-6">
        <h2 className="text-base font-semibold text-slate-950">{title}</h2>
        {description && <p className="mt-2 text-sm text-gray-500">{description}</p>}
        {requireTyping && (
          <div className="mt-4">
            <label className="block text-sm text-gray-600">
              Type{" "}
              <span className="font-mono font-semibold text-slate-900">{requireTyping}</span>{" "}
              to confirm
            </label>
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={requireTyping}
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
            />
          </div>
        )}
      </div>
      <div className="flex justify-end gap-3 px-6 py-4">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirmDisabled}
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-40 ${
            destructive ? "bg-red-600 hover:bg-red-700" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
