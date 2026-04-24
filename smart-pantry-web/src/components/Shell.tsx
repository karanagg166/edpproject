"use client";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ChatWidget } from "./ChatWidget";
import { useUser } from "@/lib/UserContext";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useUser();

  const isPublicPage = pathname === "/" || pathname?.startsWith("/login") || pathname?.startsWith("/register");

  // We rely on middleware.ts to redirect unauthenticated users to /login.
  // We do not redirect here to avoid race conditions and infinite loops.

  // Public pages (landing, login, register) render immediately — no loading gate
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Protected pages: show spinner while session resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading your pantry...</p>
        </div>
      </div>
    );
  }

  // Authenticated app shell
  return (
    <>
      <Sidebar />
      <div className="flex-1 ml-64 p-8 min-h-screen">
        {children}
      </div>
      <ChatWidget />
    </>
  );
}

