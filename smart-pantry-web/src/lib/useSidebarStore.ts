import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isMobileOpen: boolean;
  isCollapsed: boolean;
  openMobile: () => void;
  closeMobile: () => void;
  toggleCollapse: () => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set) => ({
      isMobileOpen: false,
      isCollapsed: false,
      
      openMobile: () => set({ isMobileOpen: true }),
      
      closeMobile: () => set({ isMobileOpen: false }),
      
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Only persist isCollapsed
    }
  )
);
