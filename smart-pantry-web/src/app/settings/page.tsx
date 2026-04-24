"use client";
import { useUser } from "@/lib/UserContext";
import { Copy, CheckCircle2, Shield, Camera, AlertTriangle } from "lucide-react";
import { useState } from "react";

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl shadow-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-emerald-400" size={24} />
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Display Name</label>
              <div className="mt-1 text-slate-200 bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700/50">
                {user.display_name}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="mt-1 text-slate-200 bg-slate-800/50 px-4 py-3 rounded-xl border border-slate-700/50">
                {user.email || "No email"}
              </div>
            </div>
          </div>
        </div>

        {/* Device Integration Card */}
        <div className="bg-slate-900 border border-emerald-500/20 rounded-2xl p-6 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-emerald-500/20 rounded-lg">
              <Camera className="text-emerald-400" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-white">Hardware Integration</h2>
          </div>
          
          <p className="text-sm text-slate-400 mb-6 relative z-10 leading-relaxed">
            To link your Raspberry Pi camera to your account, copy the device token below and paste it into the backend <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">.env</code> file as <code className="text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">PANTRY_USER_ID</code>.
          </p>

          <div className="relative z-10">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Device Token (User ID)</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 bg-slate-950 text-emerald-400 border border-slate-800 px-4 py-3 rounded-xl font-mono text-sm overflow-x-auto">
                {user.id}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 p-3 rounded-xl transition flex items-center gap-2"
                title="Copy Token"
              >
                {copied ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-400 mt-2">Copied to clipboard!</p>}
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-red-950/20 border border-red-900/50 rounded-2xl p-6 mt-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-500" size={24} />
          <h2 className="text-xl font-semibold text-red-500">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-400/70 mb-6">
          Sign out of your account on this device. You will need your password to log back in.
        </p>
        <button
          onClick={() => signOut()}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 font-medium px-6 py-2.5 rounded-xl transition"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
}
