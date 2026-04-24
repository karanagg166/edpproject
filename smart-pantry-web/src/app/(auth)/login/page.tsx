"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("karan@gmail.com");
  const [password, setPassword] = useState("karan166");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Diagnostic check for Supabase reachability
  React.useEffect(() => {
    fetch("https://tiiurnpxrpiunsfkvkxe.supabase.co/auth/v1/health")
      .then(r => r.json())
      .then(data => console.log("🏥 Supabase Health Check:", data))
      .catch(err => console.error("🚨 Supabase Health Check Failed:", err));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("🔐 Login attempt started for:", email);

    try {
      const supabase = createSupabaseBrowser();
      console.log("✅ Supabase client created:", supabase);
      console.log("🌐 Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
      console.log("🔑 Anon Key exists:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

      console.log("📡 Calling signInWithPassword...");
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log("📦 Supabase response data:", data);
      console.log("❌ Supabase response error:", error);

      if (error) {
        console.error("🚫 Auth error:", error.message, error);
        setError(error.message);
      } else {
        console.log("🎉 Login successful! Session:", data.session);
        console.log("👤 User:", data.user);
        console.log("🚀 Redirecting to /dashboard...");
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("💥 Unexpected exception during login:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      console.log("🏁 Login flow finished, setLoading(false)");
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-white mb-2">Welcome back</h2>
      <p className="text-slate-400 text-sm mb-6">Sign in to manage your AI pantry.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-800 text-red-400 p-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-slate-400 font-medium ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500 transition"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-emerald-600 to-cyan-500 hover:from-emerald-500 hover:to-cyan-400 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 transition">
          Sign up
        </Link>
      </p>
    </>
  );
}