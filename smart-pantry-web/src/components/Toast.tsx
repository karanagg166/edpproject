"use client";
import { useEffect, useState } from "react";
import { CheckCircle, MinusCircle, Info, X } from "lucide-react";

export type ToastType = "added" | "removed" | "info" | "error";

export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastData[];
  removeToast: (id: string) => void;
}

const ICONS = {
  added: <CheckCircle size={18} className="text-zinc-900" />,
  removed: <MinusCircle size={18} className="text-zinc-600" />,
  info: <Info size={18} className="text-blue-500" />,
  error: <X size={18} className="text-red-500" />,
};

const BORDERS = {
  added: "border-zinc-200 bg-white text-zinc-900",
  removed: "border-zinc-200 bg-zinc-50 text-zinc-800",
  info: "border-blue-200 bg-blue-50 text-blue-900",
  error: "border-red-200 bg-red-50 text-red-900",
};

function Toast({ toast, remove }: { toast: ToastData; remove: () => void }) {
  useEffect(() => {
    const t = setTimeout(remove, 5000);
    return () => clearTimeout(t);
  }, [remove]);

  return (
    <div
      className={`flex items-center gap-3 border ${BORDERS[toast.type]} px-4 py-3 rounded-xl shadow-sm text-sm font-medium min-w-[260px] max-w-sm animate-in slide-in-from-right-4 duration-300`}
    >
      {ICONS[toast.type]}
      <span className="flex-1 tracking-tight">{toast.message}</span>
      <button onClick={remove} className="text-zinc-400 hover:text-zinc-600 transition">
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer({ toasts, removeToast }: ToastProps) {
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} remove={() => removeToast(t.id)} />
      ))}
    </div>
  );
}
