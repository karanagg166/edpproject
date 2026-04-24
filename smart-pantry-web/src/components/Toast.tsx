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
  added: <CheckCircle size={18} className="text-emerald-400" />,
  removed: <MinusCircle size={18} className="text-orange-400" />,
  info: <Info size={18} className="text-blue-400" />,
  error: <X size={18} className="text-red-400" />,
};

const BORDERS = {
  added: "border-emerald-500/40",
  removed: "border-orange-500/40",
  info: "border-blue-500/40",
  error: "border-red-500/40",
};

function Toast({ toast, remove }: { toast: ToastData; remove: () => void }) {
  useEffect(() => {
    const t = setTimeout(remove, 5000);
    return () => clearTimeout(t);
  }, [remove]);

  return (
    <div
      className={`flex items-center gap-3 bg-slate-900 border ${BORDERS[toast.type]} px-4 py-3 rounded-xl shadow-2xl shadow-black/40 text-sm text-slate-200 min-w-[260px] max-w-sm animate-in slide-in-from-right-4 duration-300`}
    >
      {ICONS[toast.type]}
      <span className="flex-1">{toast.message}</span>
      <button onClick={remove} className="text-slate-500 hover:text-slate-300 transition">
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
