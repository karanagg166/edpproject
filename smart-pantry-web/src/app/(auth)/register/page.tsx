"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { Loader2, Mail, Lock, User } from "lucide-react";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error, data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          },
        },
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setSuccess(true);
        // If session exists, we are logged in. If not, user needs to confirm email.
        if (data.session) {
          setTimeout(() => {
            router.refresh();
            router.push("/dashboard");
          }, 1500);
        } else {
          setLoading(false);
        }
      }
    } catch (err: any) {
      console.error("Register exception:", err);
      setError(err.message || "An unexpected error occurred during registration.");
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center py-6">
        <div className="w-16 h-16 bg-zinc-100 text-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <User size={24} />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Check your email</h2>
        <p className="text-zinc-500 font-medium text-sm mb-6 leading-relaxed">
          We've sent a confirmation link to your email. <br />
          Please click the link to activate your account.
        </p>
        <Link 
          href="/login"
          className="inline-flex items-center justify-center px-6 py-2.5 bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm rounded-xl transition text-sm font-medium"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      <h2 className="text-2xl font-bold text-zinc-900 tracking-tight mb-2">Create an account</h2>
      <p className="text-zinc-500 font-medium text-sm mb-6">Start tracking your pantry automatically.</p>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs text-zinc-600 font-semibold uppercase tracking-wider ml-1">Name</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition shadow-sm font-medium"
              placeholder="Jane Doe"
            />
          </div>
        </div>

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
              minLength={6}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl py-3 pl-10 pr-4 text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition shadow-sm font-medium"
              placeholder="At least 6 characters"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl shadow-sm border border-zinc-800 flex items-center justify-center gap-2 transition disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : "Sign Up"}
        </button>
      </form>

      <p className="text-center text-sm text-zinc-500 font-medium mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-zinc-900 font-semibold hover:underline transition">
          Sign in
        </Link>
      </p>
    </>
  );
}
