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
      
      openMobile: () => {
        set({ isMobileOpen: true });
        if (typeof window !== 'undefined') {
          document.body.style.overflow = 'hidden';
        }
      },
      
      closeMobile: () => {
        set({ isMobileOpen: false });
        if (typeof window !== 'undefined') {
          document.body.style.overflow = '';
        }
      },
      
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'sidebar-storage',
      partialize: (state) => ({ isCollapsed: state.isCollapsed }), // Only persist isCollapsed
    }
  )
);
