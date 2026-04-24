"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Apple, MessageSquare, Utensils,
  Activity, Leaf, Recycle, HeartHandshake, Settings, LogOut
} from "lucide-react";
import { useUser } from "@/lib/UserContext";

export function Sidebar() {
  const pathname = usePathname();
  const { user, signOut } = useUser();

  const navItems = [
    { name: "Pantry", href: "/dashboard", icon: Home },
    { name: "Nutrition", href: "/nutrition", icon: Activity },
    { name: "Health Score", href: "/health", icon: Leaf },
    { name: "Diet Plan", href: "/diet", icon: Utensils },
    { name: "AI Chat", href: "/chatbot", icon: MessageSquare },
    { name: "Waste Game", href: "/waste", icon: Recycle },
    { name: "Donate", href: "/donate", icon: HeartHandshake },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <div className="w-64 h-screen bg-slate-900 border-r border-slate-800 flex flex-col fixed left-0 top-0 z-40">
      {/* Logo */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
            <Apple size={14} className="text-white" />
          </div>
          <h2 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Pantry
          </h2>
        </div>
        <p className="text-xs text-slate-500 pl-9">AI-Powered Tracking</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 text-sm ${
                isActive
                  ? "bg-slate-800 text-emerald-400 font-semibold border border-slate-700"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon size={16} className={isActive ? "text-emerald-400" : "text-slate-500"} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 mb-3">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-xs text-slate-400">Pi Camera Linked</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-slate-200">{user?.display_name || "User"}</span>
            <span className="text-xs text-slate-500 truncate max-w-[140px]">{user?.email || "No email"}</span>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition"
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
