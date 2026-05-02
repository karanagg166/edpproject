"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Apple, MessageSquare, Utensils,
  Activity, Leaf, HeartHandshake, Settings, LogOut,
  Thermometer, ChevronLeft, ChevronRight, X,
} from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/lib/useSidebarStore";

const navItems = [
  { name: "Pantry", href: "/dashboard", icon: Home },
  { name: "Smart Fridge", href: "/fridge", icon: Thermometer },
  { name: "Nutrition", href: "/nutrition", icon: Activity },
  { name: "Health Score", href: "/health", icon: Leaf },
  { name: "Diet Plan", href: "/diet", icon: Utensils },
  { name: "AI Chat", href: "/chatbot", icon: MessageSquare },
  { name: "Donate", href: "/donate", icon: HeartHandshake },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Shared nav content rendered inside both desktop and mobile variants
function NavContent({ collapsed }: { collapsed: boolean }) {
  const pathname = usePathname();
  const { user, signOut } = useUser();
  const { closeMobile } = useSidebarStore();

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.04, duration: 0.25 }}
            >
              <Link
                href={item.href}
                onClick={() => closeMobile()}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
                  collapsed ? "justify-center" : "",
                  isActive
                    ? "text-zinc-900 font-semibold"
                    : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute inset-0 bg-zinc-100 rounded-xl -z-10"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon size={16} className={cn("shrink-0", isActive ? "text-zinc-900" : "text-zinc-500")} />
                {!collapsed && (
                  <span className="relative z-10 truncate">{item.name}</span>
                )}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className={cn("p-3 border-t border-zinc-100", collapsed ? "flex flex-col items-center gap-2" : "")}>
        {!collapsed && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 mb-2">
            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
            <span className="text-xs text-zinc-600 font-medium">Pi Camera Linked</span>
          </div>
        )}
        {collapsed && (
          <span className="w-2 h-2 rounded-full bg-green-500 mb-1" title="Pi Camera Linked" />
        )}

        <div className={cn("flex items-center px-1", collapsed ? "flex-col gap-1" : "justify-between")}>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-semibold text-zinc-900 truncate">{user?.display_name || "User"}</span>
              <span className="text-xs text-zinc-500 truncate max-w-[140px]">{user?.email || "No email"}</span>
            </div>
          )}
          <button
            onClick={() => signOut()}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </>
  );
}

export function Sidebar() {
  const { isMobileOpen, isCollapsed, toggleCollapse, closeMobile } = useSidebarStore();

  // ── Desktop sidebar ──
  const desktopSidebar = (
    <motion.aside
      layout
      animate={{ width: isCollapsed ? 64 : 256 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="h-screen bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 z-40 hidden md:flex overflow-hidden"
    >
      {/* Logo */}
      <div className={cn("border-b border-zinc-100 flex items-center", isCollapsed ? "justify-center p-4" : "justify-between p-5")}>
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 flex items-center justify-center shrink-0">
            <Apple size={20} className="text-zinc-900" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <h2 className="text-base font-bold text-zinc-900 tracking-tight whitespace-nowrap">Smart Pantry</h2>
              <p className="text-xs text-zinc-500 whitespace-nowrap">AI-Powered Tracking</p>
            </motion.div>
          )}
        </div>
        {/* Collapse toggle */}
        <button
          onClick={toggleCollapse}
          className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors shrink-0"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <NavContent collapsed={isCollapsed} />
    </motion.aside>
  );

  // ── Mobile drawer + backdrop ──
  const mobileDrawer = (
    <AnimatePresence>
      {isMobileOpen && (
        <motion.div
          key="backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={closeMobile}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        />
      )}
      {isMobileOpen && (
        <motion.aside
          key="drawer"
          initial={{ x: -280 }}
          animate={{ x: 0 }}
          exit={{ x: -280 }}
          transition={{ type: "spring", stiffness: 350, damping: 35 }}
          className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-zinc-200 flex flex-col z-50 md:hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Apple size={20} className="text-zinc-900" />
              <div>
                <h2 className="text-base font-bold text-zinc-900 tracking-tight">Smart Pantry</h2>
                <p className="text-xs text-zinc-500">AI-Powered Tracking</p>
              </div>
            </div>
            <button
              onClick={closeMobile}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
          <NavContent collapsed={false} />
        </motion.aside>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {desktopSidebar}
      {mobileDrawer}
    </>
  );
}
