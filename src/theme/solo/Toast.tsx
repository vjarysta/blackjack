import React from "react";
import { cn } from "../../utils/cn";

export interface ToastMessage {
  id: string;
  message: string;
  tone: "success" | "danger" | "neutral";
}

const toneStyles: Record<ToastMessage["tone"], string> = {
  success: "border-[rgba(120,189,120,0.6)] bg-[rgba(32,66,46,0.9)] text-[#dff7df]",
  danger: "border-[rgba(215,90,90,0.6)] bg-[rgba(74,23,23,0.85)] text-[#f9d7d7]",
  neutral: "border-[rgba(216,182,76,0.4)] bg-[rgba(18,38,30,0.85)] text-[var(--text-hi)]",
};

interface ToastHostProps {
  messages: ToastMessage[];
}

export const ToastHost: React.FC<ToastHostProps> = ({ messages }) => {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col gap-2">
      {messages.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "solo-toast-enter pointer-events-auto min-w-[220px] rounded-2xl border px-4 py-3 text-sm shadow-[var(--shadow-1)]",
            toneStyles[toast.tone],
          )}
          role="status"
        >
          {toast.message}
        </div>
      ))}
    </div>
  );
};
