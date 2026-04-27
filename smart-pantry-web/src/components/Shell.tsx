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
      <>
        <Sidebar />
        <div className="flex-1 ml-64 p-8 min-h-screen bg-zinc-50">
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <div className="h-8 w-40 bg-zinc-200 rounded animate-pulse" />
              <div className="flex gap-2">
                <div className="h-9 w-9 bg-zinc-200 rounded animate-pulse" />
                <div className="h-9 w-24 bg-zinc-200 rounded animate-pulse" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-10 w-full bg-zinc-200 rounded animate-pulse" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => <div key={i} className="h-6 w-16 bg-zinc-200 rounded-full animate-pulse" />)}
                </div>
                <div className="h-64 w-full border border-zinc-200 bg-white rounded-2xl animate-pulse" />
              </div>
              <div className="space-y-4">
                <div className="h-48 w-full border border-zinc-200 bg-white rounded-2xl animate-pulse" />
                <div className="h-48 w-full border border-zinc-200 bg-white rounded-2xl animate-pulse" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Authenticated app shell
  return (
    <>
      <Sidebar />
      <div className="flex-1 ml-64 p-8 min-h-screen bg-zinc-50">
        {children}
      </div>
      <ChatWidget />
    </>
  );
}

