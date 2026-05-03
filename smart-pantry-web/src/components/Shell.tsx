"use client";

import { Sidebar } from "./Sidebar";
import { ChatWidget } from "./ChatWidget";
import { PageTransition } from "./PageTransition";
import { useUser } from "@/lib/UserContext";
import { useSidebarStore } from "@/lib/useSidebarStore";
import { Skeleton } from "@/components/ui/skeleton";
import { CursorGlow } from "@/components/ui/animations";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { isCollapsed, openMobile } = useSidebarStore();

  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register");

  if (isPublicPage) return <>{children}</>;

  const contentMargin = isCollapsed ? "md:ml-16" : "md:ml-64";

  if (loading) {
    return (
      <>
        <Sidebar />
        <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-zinc-200 flex items-center px-4 gap-3 z-30 md:hidden">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className={cn("min-h-screen bg-zinc-50 px-3 sm:px-4 pb-4 pt-[4.5rem] md:p-8 overflow-x-hidden min-w-0", contentMargin)}>
          <div className="max-w-6xl w-full mx-auto space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-10 w-full" />
                <div className="flex gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-full" />
                  ))}
                </div>
                <Skeleton className="h-64 w-full rounded-2xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-2xl" />
                <Skeleton className="h-48 w-full rounded-2xl" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Sidebar />

      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white/95 backdrop-blur-sm border-b border-zinc-200 flex items-center px-4 gap-3 z-30 md:hidden">
        <button
          onClick={openMobile}
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-zinc-900 text-sm">Smart Pantry</span>
      </div>

      <CursorGlow />

      <main
        className={cn(
          "min-h-screen bg-zinc-50 px-3 sm:px-4 pb-24 sm:pb-4 pt-[4.5rem] md:pt-8 md:p-8 transition-all duration-300 overflow-x-hidden min-w-0",
          contentMargin
        )}
      >
        <PageTransition>{children}</PageTransition>
      </main>

      <ChatWidget />
    </>
  );
}
