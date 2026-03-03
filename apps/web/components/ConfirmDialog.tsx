"use client";
import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
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
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open) {
      el.showModal();
    } else {
      el.close();
    }
  }, [open]);

  if (!open) return null;

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
          className={`rounded-lg px-4 py-2 text-sm font-medium text-white ${
            destructive ? "bg-red-600 hover:bg-red-700" : "bg-slate-950 hover:bg-slate-800"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </dialog>
  );
}
