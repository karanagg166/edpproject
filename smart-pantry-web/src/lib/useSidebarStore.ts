/**
 * useSidebarStore — Zustand v5 sidebar state
 *
 * Replaces SidebarContext.tsx to fix the mobile re-open bug.
 * Using explicit openMobile() / closeMobile() instead of toggle()
 * eliminates the race condition between AnimatePresence exit animations
 * and route change events.
 *
 * No Provider needed — import and use the hook directly anywhere.
 */
import { create } from "zustand";

interface SidebarState {
  /** Desktop sidebar collapsed to icon rail */
  isCollapsed: boolean;
  /** Mobile drawer open */
  isMobileOpen: boolean;
  /** Toggle desktop collapse + persist to localStorage */
  toggleCollapse: () => void;
  /** Always sets isMobileOpen = true */
  openMobile: () => void;
  /** Always sets isMobileOpen = false */
  closeMobile: () => void;
}

const STORAGE_KEY = "sidebar-collapsed";

function readCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export const useSidebarStore = create<SidebarState>((set) => ({
  isCollapsed: readCollapsed(),
  isMobileOpen: false,

  toggleCollapse: () =>
    set((state) => {
      const next = !state.isCollapsed;
      try {
        localStorage.setItem(STORAGE_KEY, String(next));
      } catch {
        // ignore (SSR / private browsing)
      }
      return { isCollapsed: next };
    }),

  openMobile: () => set({ isMobileOpen: true }),
  closeMobile: () => set({ isMobileOpen: false }),
}));
