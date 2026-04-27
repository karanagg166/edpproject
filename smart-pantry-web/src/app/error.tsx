"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 p-4">
      <div className="max-w-md w-full bg-white border border-zinc-200 rounded-2xl p-6 text-center shadow-xl">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 mb-2">Something went wrong</h2>
        <p className="text-zinc-500 text-sm mb-6">
          {error.message || "An unexpected error occurred while loading this page."}
        </p>
        <button
          onClick={() => reset()}
          className="w-full flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 text-white px-4 py-3 rounded-xl font-semibold transition"
        >
          <RefreshCcw className="w-4 h-4" />
          Try again
        </button>
      </div>
    </div>
  );
}
