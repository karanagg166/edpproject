"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("thorodinson7838@gmail.com");
  const [password, setPassword] = useState("karan166");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();



  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowser();

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("🚫 Auth error:", error.message, error);
        setError(error.message);
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("💥 Unexpected exception during login:", err);
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Welcome back</h2>
      <p className="text-zinc-500 font-medium text-sm mb-6">Sign in to manage your AI pantry.</p>

      <form onSubmit={handleLogin} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-600 font-semibold uppercase tracking-wider ml-1">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition shadow-sm font-medium"
              placeholder="you@example.com"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-600 font-semibold uppercase tracking-wider ml-1">Password</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition shadow-sm font-medium"
              placeholder="••••••••"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl shadow-sm border border-zinc-800 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign In"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 font-medium mt-6">
        Don't have an account?{" "}
        <Link href="/register" className="text-zinc-900 font-semibold hover:underline transition">
          Sign up
        </Link>
      </p>
    </>
  );
}