"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { ChatWidget } from "./ChatWidget";
import { useUser } from "@/lib/UserContext";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebarStore } from "@/lib/useSidebarStore";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const { isCollapsed, isMobileOpen, openMobile, closeMobile } = useSidebarStore();

  // Auto-close mobile drawer on every route change
  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  const isPublicPage =
    pathname === "/" ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register");

  if (isPublicPage) {
    return <>{children}</>;
  }

  // Dynamic left margin: on desktop account for collapsed/expanded, on mobile no margin
  const contentMargin = isCollapsed ? "md:ml-16" : "md:ml-64";

  if (loading) {
    return (
      <>
        <Sidebar />
        {/* Mobile top bar skeleton */}
        <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-3 z-30 md:hidden">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <motion.div
          layout
          className={cn("min-h-screen bg-zinc-50 px-4 pb-4 pt-20 md:p-8", contentMargin)}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
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
        </motion.div>
      </>
    );
  }

  return (
    <>
      <Sidebar />

      {/* Mobile top bar — only visible on small screens */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-zinc-200 flex items-center px-4 gap-3 z-30 md:hidden">
        <button
          onClick={openMobile}
          className="p-2 rounded-lg text-zinc-600 hover:bg-zinc-100 transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <span className="font-semibold text-zinc-900 text-sm">Smart Pantry</span>
      </div>

      {/* Main content — shifts on desktop based on sidebar state */}
      <motion.main
        layout
        className={cn(
          "min-h-screen bg-zinc-50 px-4 pb-4 pt-20 md:p-8 transition-all",
          contentMargin
        )}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {children}
      </motion.main>

      <ChatWidget />
    </>
  );
}
