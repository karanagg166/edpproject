"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Apple, MessageSquare, Utensils,
  Activity, Leaf, HeartHandshake, Settings, LogOut, Thermometer
} from "lucide-react";
import { useUser } from "@/lib/UserContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();

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

  return (
    <div className="w-64 h-screen bg-white border-r border-zinc-200 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-zinc-100">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 flex items-center justify-center">
            <Apple size={20} className="text-zinc-900" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 tracking-tight">
            Smart Pantry
          </h2>
        </div>
        <p className="text-xs text-zinc-500 pl-9">AI-Powered Tracking</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05, duration: 0.3 }}
            >
              <Link
                href={item.href}
                className={cn(
                  "relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors",
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
                <Icon size={16} className={isActive ? "text-zinc-900" : "text-zinc-500"} />
                <span className="relative z-10">{item.name}</span>
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-zinc-100">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 mb-3">
          <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
          <span className="text-xs text-zinc-600 font-medium">Pi Camera Linked</span>
        </div>

        <div className="flex items-center justify-between px-1">
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-zinc-900">{user?.display_name || "User"}</span>
            <span className="text-xs text-zinc-500 truncate max-w-[140px]">{user?.email || "No email"}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
