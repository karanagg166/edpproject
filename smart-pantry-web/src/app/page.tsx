"use client";
import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/UserContext";
import {
  Apple, Cpu, Activity, Utensils,
  MessageSquare, ArrowRight, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const FEATURES = [
  {
    icon: Cpu,
    title: "AI Object Detection",
    desc: "Raspberry Pi camera auto-detects items you add or remove from your pantry in real-time.",
  },
  {
    icon: Activity,
    title: "Nutrition Tracking",
    desc: "Instant calorie, protein, and macro breakdowns for everything in your pantry.",
  },
  {
    icon: Utensils,
    title: "AI Diet Planner",
    desc: "Get personalized 7-day meal plans based on what you actually have at home.",
  },
  {
    icon: MessageSquare,
    title: "AI Chef Chat",
    desc: "Ask our AI for recipes, substitutions, and cooking tips using your pantry items.",
  },
  {
    icon: Sparkles,
    title: "Health Analytics",
    desc: "AI-powered health scores and dietary insights based on your eating patterns.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function LandingPage() {
  const { user } = useUser();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white overflow-hidden text-zinc-900">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-zinc-100 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-zinc-50 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 max-w-7xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
            <Apple size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-zinc-900 tracking-tight">
            Smart Pantry
          </span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-xl font-semibold shadow-sm">
                Go to Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="rounded-xl font-medium">
                  Log In
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-xl font-semibold shadow-sm">
                  Sign Up Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto text-center pt-24 pb-16 px-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-zinc-600 text-xs font-medium mb-8">
            <Sparkles size={12} className="text-zinc-500" />
            Powered by AI & Raspberry Pi
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-900 leading-[1.1] tracking-tight mb-6">
            Your Kitchen,{" "}
            <span className="text-zinc-500">
              Supercharged
            </span>{" "}
            by AI
          </h1>

          <p className="text-lg sm:text-xl text-zinc-500 max-w-2xl mx-auto mb-10 leading-relaxed">
            Smart Pantry uses computer vision to auto-track your food, plan meals,
            reduce waste, and give you real-time health insights — all from your fridge.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap mb-16">
            {user ? (
              <Link href="/dashboard">
                <Button size="lg" className="rounded-2xl px-8 h-14 text-base shadow-lg shadow-zinc-200 group">
                  Open Dashboard
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/register">
                  <Button size="lg" className="rounded-2xl px-8 h-14 text-base shadow-lg shadow-zinc-200 group">
                    Get Started
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-base">
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Hero Image */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, type: "spring", stiffness: 100 }}
            className="relative max-w-5xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200/50 aspect-video md:aspect-[21/9] bg-zinc-100"
          >
            <img 
              src="/images/dashboard-pantry.png"
              alt="Smart Pantry Interface in a modern kitchen"
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Subtle gradient overlay to make it look premium */}
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>

        {/* Stats */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex items-center justify-center gap-10 mt-20 text-center"
        >
          {[
            { value: "AI", label: "Powered Detection" },
            { value: "Real-time", label: "Pantry Sync" },
            { value: "24/7", label: "Smart Tracking" },
          ].map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl font-bold text-zinc-900">
                {stat.value}
              </div>
              <div className="text-xs text-zinc-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">
              Everything you need to manage your food
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg">
              From detection to diet planning — one intelligent system for your entire kitchen.
            </p>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-100px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={itemVariants}>
                  <Card className="p-6 h-full hover:shadow-md transition-shadow border-zinc-200">
                    <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200">
                      <Icon size={22} className="text-zinc-900" />
                    </div>
                    <h3 className="text-zinc-900 font-semibold mb-2 text-lg tracking-tight">{f.title}</h3>
                    <p className="text-zinc-500 leading-relaxed">{f.desc}</p>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-24 text-center">
        <div className="p-12 rounded-[2rem] bg-zinc-900 shadow-xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to upgrade your kitchen?
            </h2>
            <p className="text-zinc-400 mb-10 max-w-lg mx-auto text-lg">
              Join Smart Pantry and let AI handle your food tracking, meal planning, and nutrition.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary" className="rounded-2xl px-8 h-14 text-base font-semibold group">
                Create Free Account
                <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
          {/* Decorative background elements */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-zinc-200 py-10 text-center">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Smart Pantry · Built with Next.js, Supabase & AI
        </p>
      </footer>
    </div>
  );
}
