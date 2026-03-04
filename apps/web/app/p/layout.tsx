import type { ReactNode } from "react";
import "../globals.css";

export const metadata = { title: "Sensehub Interview" };

/** Minimal shell for the participant experience — no researcher nav/header. */
export default function ParticipantLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 antialiased">{children}</body>
    </html>
  );
}
