"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { usePathname } from "next/navigation";

interface SidebarCtx {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarCtx>({
  isMobileOpen: false,
  isCollapsed: false,
  openMobile: () => {},
  closeMobile: () => {},
  toggleCollapse: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Read persisted collapsed state once on mount
  useEffect(() => {
    try {
      setIsCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    } catch {}
  }, []);

  // ✅ Close mobile drawer on EVERY route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // ✅ Lock/unlock body scroll — always cleaned up
  useEffect(() => {
    document.body.style.overflow = isMobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileOpen]);

  const openMobile = useCallback(() => setIsMobileOpen(true), []);
  const closeMobile = useCallback(() => setIsMobileOpen(false), []);

  const toggleCollapse = useCallback(() => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try { localStorage.setItem("sidebar-collapsed", String(next)); } catch {}
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider value={{ isMobileOpen, isCollapsed, openMobile, closeMobile, toggleCollapse }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
