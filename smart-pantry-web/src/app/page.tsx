"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useUser } from "@/lib/UserContext";
import {
  Apple, Cpu, Activity, Utensils,
  MessageSquare, ArrowRight, Sparkles, ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { motion, useInView, useMotionValue, useSpring, animate } from "framer-motion";

import { WordPullUp } from "@/components/ui/word-pull-up";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { ShimmerButton } from "@/components/ui/shimmer-button";
import { MagneticButton } from "@/components/ui/magnetic-button";
import { TiltCard } from "@/components/ui/tilt-card";

/* ─── Data ──────────────────────────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: Cpu,
    title: "AI Object Detection",
    desc: "Raspberry Pi camera auto-detects items you add or remove from your pantry in real-time.",
    emoji: "🤖",
  },
  {
    icon: Activity,
    title: "Nutrition Tracking",
    desc: "Instant calorie, protein, and macro breakdowns for everything in your pantry.",
    emoji: "📊",
  },
  {
    icon: Utensils,
    title: "AI Diet Planner",
    desc: "Get personalized 7-day meal plans based on what you actually have at home.",
    emoji: "🥗",
  },
  {
    icon: MessageSquare,
    title: "AI Chef Chat",
    desc: "Ask our AI for recipes, substitutions, and cooking tips using your pantry items.",
    emoji: "💬",
  },
  {
    icon: Sparkles,
    title: "Health Analytics",
    desc: "AI-powered health scores and dietary insights based on your eating patterns.",
    emoji: "✨",
  },
  {
    icon: ShieldCheck,
    title: "Expiry Alerts",
    desc: "Smart notifications before food expires — with one-tap NGO donation suggestions.",
    emoji: "🔔",
  },
];

const STATS = [
  { end: 50, suffix: "+", label: "Indian Products", prefix: "" },
  { end: 85, suffix: "%", label: "Waste Reduction", prefix: "" },
  { end: 100, suffix: "+", label: "NGO Partners", prefix: "" },
];

/* ─── Variants ──────────────────────────────────────────────────────────────── */
const heroVariants = {
  hidden: { opacity: 0, y: 28 },
  show: {
    opacity: 1, y: 0,
    transition: { type: "spring", stiffness: 200, damping: 26, staggerChildren: 0.12 }
  },
};

const featureContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  },
};

const featureItem = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 22 } }
};

/* ─── Page ──────────────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const { user } = useUser();
  const [statsValue, setStatsValue] = useState(0);

  return (
    <div className="min-h-screen bg-white overflow-hidden text-zinc-900">
      {/* ── Ambient blobs ── */}
      <div className="fixed inset-0 pointer-events-none select-none">
        <div className="absolute top-[-15%] left-[-8%] w-[560px] h-[560px] bg-zinc-100 rounded-full blur-[140px] opacity-70" />
        <div className="absolute bottom-[-20%] right-[-8%] w-[520px] h-[520px] bg-zinc-50 rounded-full blur-[140px] opacity-80" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[400px] h-[400px] bg-zinc-100/50 rounded-full blur-[120px]" />
      </div>

      {/* ── Navbar ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5 max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 flex items-center justify-center shadow-md">
            <Apple size={18} className="text-white" />
          </div>
          <span className="text-xl font-bold text-zinc-900 tracking-tight">Smart Fridge</span>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <Link href="/dashboard">
              <Button className="rounded-xl font-semibold shadow-sm">Go to Dashboard</Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" className="rounded-xl font-medium">Log In</Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-xl font-semibold shadow-sm">Sign Up Free</Button>
              </Link>
            </>
          )}
        </div>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative z-10 max-w-5xl mx-auto text-center pt-12 sm:pt-20 pb-8 sm:pb-12 px-4 sm:px-6">
        <motion.div
          variants={heroVariants}
          initial="hidden"
          animate="show"
          onAnimationComplete={() => setStatsValue(1)}
        >
          {/* Badge */}
          <motion.div variants={heroVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-zinc-100 border border-zinc-200 rounded-full text-zinc-600 text-xs font-medium mb-8">
              <Sparkles size={12} className="text-zinc-500" />
              Powered by AI &amp; Raspberry Pi
            </div>
          </motion.div>

          {/* Headline */}
          <div className="mb-6 flex justify-center">
            <WordPullUp
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-zinc-900 leading-[1.1] tracking-tight"
              text="Your Kitchen, Supercharged by AI"
            />
          </div>

          {/* Sub */}
          <motion.p
            variants={heroVariants}
            className="text-base sm:text-lg md:text-xl text-zinc-500 max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed"
          >
            Smart Fridge uses computer vision to auto-track your food, plan meals,
            reduce waste, and give you real-time health insights — all from your fridge.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={heroVariants} className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap mb-10 sm:mb-16">
            {user ? (
              <MagneticButton>
                <Link href="/dashboard">
                  <Button size="lg" className="rounded-2xl px-8 h-14 text-base shadow-lg shadow-zinc-200 group">
                    Open Dashboard
                    <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </MagneticButton>
            ) : (
              <>
                <MagneticButton>
                  <Link href="/register">
                    <Button size="lg" className="rounded-2xl px-8 h-14 text-base shadow-lg shadow-zinc-200 group">
                      Get Started Free
                      <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </MagneticButton>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="rounded-2xl px-8 h-14 text-base">
                    Log In
                  </Button>
                </Link>
              </>
            )}
          </motion.div>

          {/* Hero image */}
          <motion.div
            variants={heroVariants}
            className="relative max-w-5xl mx-auto rounded-2xl sm:rounded-[2rem] overflow-hidden shadow-2xl border border-zinc-200/50 aspect-video md:aspect-[21/9] bg-zinc-100"
          >
            <img
              src="/images/dashboard-pantry.png"
              alt="Smart Fridge Interface"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900/40 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        </motion.div>

        {/* ── Stats row (count-up) ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7, ease: "easeOut" }}
          className="flex items-center justify-center gap-6 sm:gap-12 mt-12 sm:mt-20 text-center flex-wrap"
        >
          {STATS.map((s) => (
            <div key={s.label} className="min-w-[80px]">
              <div className="text-3xl font-extrabold text-zinc-900 tabular-nums flex items-center justify-center">
                {s.prefix}<AnimatedNumber value={statsValue * s.end} />{s.suffix}
              </div>
              <div className="text-xs text-zinc-500 mt-1.5 font-medium">{s.label}</div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Features Grid ── */}
      <section className="relative z-10 bg-zinc-50 border-y border-zinc-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold text-zinc-900 mb-4 tracking-tight">
              Everything you need to manage your food
            </h2>
            <p className="text-zinc-500 max-w-xl mx-auto text-lg">
              From detection to diet planning — one intelligent system for your entire kitchen.
            </p>
          </motion.div>

          <motion.div
            variants={featureContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} variants={featureItem}>
                  <TiltCard className="h-full">
                    <SpotlightCard className="p-6 h-full border border-zinc-200 bg-white group cursor-default transition-all duration-300 hover:shadow-lg hover:border-zinc-300">
                      <div className="w-12 h-12 rounded-xl bg-zinc-100 flex items-center justify-center mb-5 border border-zinc-200 group-hover:bg-zinc-900 group-hover:border-zinc-900 transition-all duration-300">
                        <Icon size={22} className="text-zinc-900 group-hover:text-white transition-colors duration-300" />
                      </div>
                      <div className="text-2xl mb-2">{f.emoji}</div>
                      <h3 className="text-zinc-900 font-semibold mb-2 text-lg tracking-tight">{f.title}</h3>
                      <p className="text-zinc-500 leading-relaxed text-sm">{f.desc}</p>
                    </SpotlightCard>
                  </TiltCard>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, type: "spring", stiffness: 180, damping: 24 }}
          className="p-8 sm:p-12 rounded-2xl sm:rounded-[2rem] bg-zinc-900 shadow-xl relative overflow-hidden"
        >
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 tracking-tight">
              Ready to upgrade your kitchen?
            </h2>
            <p className="text-zinc-400 mb-10 max-w-lg mx-auto text-lg">
              Join Smart Fridge and let AI handle your food tracking, meal planning, and nutrition.
            </p>
            <Link href="/register">
              <ShimmerButton className="shadow-2xl mx-auto group h-14 px-8" shimmerSize="0.1em">
                <span className="whitespace-pre-wrap text-center text-base font-semibold leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 flex items-center">
                  Create Free Account
                  <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
              </ShimmerButton>
            </Link>
          </div>
          {/* Decorative glows */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 border-t border-zinc-200 py-10 text-center">
        <p className="text-sm text-zinc-500">
          © {new Date().getFullYear()} Smart Fridge · Built with Next.js, Supabase &amp; AI
        </p>
      </footer>
    </div>
  );
}
