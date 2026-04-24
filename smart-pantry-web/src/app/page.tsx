"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import {
  Apple, Cpu, Activity, Utensils,
  MessageSquare, Recycle, ArrowRight, Sparkles
} from "lucide-react";

const FEATURES = [
  {
    icon: Cpu,
    title: "AI Object Detection",
    desc: "Raspberry Pi camera auto-detects items you add or remove from your pantry in real-time.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: Activity,
    title: "Nutrition Tracking",
    desc: "Instant calorie, protein, and macro breakdowns for everything in your pantry.",
    color: "from-emerald-500 to-green-500",
  },
  {
    icon: Utensils,
    title: "AI Diet Planner",
    desc: "Get personalized 7-day meal plans based on what you actually have at home.",
    color: "from-orange-500 to-amber-500",
  },
  {
    icon: MessageSquare,
    title: "AI Chef Chat",
    desc: "Ask our AI for recipes, substitutions, and cooking tips using your pantry items.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Recycle,
    title: "Waste Reduction",
    desc: "Track food waste, get expiry alerts, and gamify your sustainability journey.",
    color: "from-teal-500 to-emerald-500",
  },
  {
    icon: Sparkles,
    title: "Health Analytics",
    desc: "AI-powered health scores and dietary insights based on your eating patterns.",
    color: "from-rose-500 to-red-500",
  },
];

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-950 overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px]" />
        <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Apple size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            Smart Pantry
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link
              href="/dashboard"
              className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-emerald-900/30 transition"
            >
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="px-5 py-2.5 text-sm font-medium text-slate-300 hover:text-white transition rounded-xl hover:bg-slate-800/60"
              >
                Log In
              </Link>
              <Link
                href="/register"
                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 rounded-xl shadow-lg shadow-emerald-900/30 transition"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto text-center pt-20 pb-16 px-6">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-xs font-medium mb-8">
          <Sparkles size={12} />
          Powered by AI & Raspberry Pi
        </div>

        <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
          Your Kitchen,{" "}
          <span className="bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            Supercharged
          </span>{" "}
          by AI
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Smart Pantry uses computer vision to auto-track your food, plan meals,
          reduce waste, and give you real-time health insights — all from your fridge.
        </p>

        <div className="flex items-center justify-center gap-4 flex-wrap">
          {user ? (
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all duration-200 hover:scale-[1.02]"
            >
              Open Dashboard
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <>
              <Link
                href="/register"
                className="group flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all duration-200 hover:scale-[1.02]"
              >
                Get Started
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="flex items-center gap-2 px-8 py-4 text-base font-medium text-slate-300 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 rounded-2xl transition-all duration-200"
              >
                Log In
              </Link>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-10 mt-14 text-center">
          {[
            { value: "AI", label: "Powered Detection" },
            { value: "Real-time", label: "Pantry Sync" },
            { value: "24/7", label: "Smart Tracking" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Everything you need to manage your food
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From detection to diet planning — one intelligent system for your entire kitchen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="group p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all duration-300 hover:translate-y-[-2px]"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center">
        <div className="p-10 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700/50 shadow-2xl">
          <h2 className="text-3xl font-bold text-white mb-3">
            Ready to upgrade your kitchen?
          </h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Join Smart Pantry and let AI handle your food tracking, meal planning, and nutrition.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 text-base font-semibold text-white bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 rounded-2xl shadow-xl shadow-emerald-900/30 transition-all duration-200 hover:scale-[1.02]"
          >
            Create Free Account
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-800/50 py-8 text-center">
        <p className="text-xs text-slate-600">
          © {new Date().getFullYear()} Smart Pantry · Built with Next.js, Supabase & Cohere AI
        </p>
      </footer>
    </div>
  );
}
