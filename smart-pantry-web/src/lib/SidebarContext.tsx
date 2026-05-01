"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { usePathname } from "next/navigation";

interface SidebarContextValue {
  isOpen: boolean;       // mobile drawer open
  isCollapsed: boolean;  // desktop collapsed to icon rail
  isMobile: boolean;
  toggleMobile: () => void;
  closeMobile: () => void;
  toggleCollapsed: () => void;
}

const SidebarContext = createContext<SidebarContextValue>({
  isOpen: false,
  isCollapsed: false,
  isMobile: false,
  toggleMobile: () => {},
  closeMobile: () => {},
  toggleCollapsed: () => {},
});

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const pathname = usePathname();

  // Detect mobile breakpoint
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const handler = (e: MediaQueryListEvent) => {
      setIsMobile(e.matches);
      if (e.matches) setIsOpen(false); // close drawer when going to desktop
    };
    setIsMobile(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const toggleMobile = useCallback(() => setIsOpen((v) => !v), []);
  const closeMobile = useCallback(() => setIsOpen(false), []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((v) => {
      const next = !v;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  }, []);

  return (
    <SidebarContext.Provider
      value={{ isOpen, isCollapsed, isMobile, toggleMobile, closeMobile, toggleCollapsed }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  return useContext(SidebarContext);
}
