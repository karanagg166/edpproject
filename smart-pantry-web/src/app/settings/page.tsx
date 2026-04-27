"use client";
import { useUser } from "@/lib/UserContext";
import { Copy, CheckCircle2, Shield, Camera, AlertTriangle } from "lucide-react";
import { useState } from "react";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";

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
    <StaggerContainer className="max-w-4xl mx-auto space-y-8">
      <StaggerItem className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Account Settings</h1>
      </StaggerItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Card */}
        <StaggerItem className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="text-zinc-900" size={24} />
            <h2 className="text-xl font-semibold text-zinc-900">Profile Information</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Display Name</label>
              <div className="mt-1 text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200 font-medium">
                {user.display_name}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
              <div className="mt-1 text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200 font-medium">
                {user.email || "No email"}
              </div>
            </div>
          </div>
        </StaggerItem>

        {/* Device Integration Card */}
        <StaggerItem className="bg-white border border-zinc-200 rounded-2xl p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 p-32 bg-zinc-50 blur-[100px] rounded-full pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-4 relative z-10">
            <div className="p-2 bg-zinc-100 rounded-lg">
              <Camera className="text-zinc-900" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Hardware Integration</h2>
          </div>
          
          <p className="text-sm text-zinc-500 mb-6 relative z-10 leading-relaxed font-medium">
            To link your Raspberry Pi camera to your account, copy the device token below and paste it into the backend <code className="text-zinc-900 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">.env</code> file as <code className="text-zinc-900 bg-zinc-100 border border-zinc-200 px-1.5 py-0.5 rounded">PANTRY_USER_ID</code>.
          </p>

          <div className="relative z-10">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Device Token (User ID)</label>
            <div className="mt-1 flex items-center gap-2">
              <code className="flex-1 bg-zinc-50 text-zinc-900 border border-zinc-200 px-4 py-3 rounded-xl font-mono text-sm overflow-x-auto">
                {user.id}
              </code>
              <button
                onClick={handleCopy}
                className="shrink-0 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-zinc-900 shadow-sm p-3 rounded-xl transition flex items-center gap-2"
                title="Copy Token"
              >
                {copied ? <CheckCircle2 size={18} className="text-zinc-900" /> : <Copy size={18} />}
              </button>
            </div>
            {copied && <p className="text-xs text-zinc-900 font-medium mt-2">Copied to clipboard!</p>}
          </div>
        </StaggerItem>
      </div>

      {/* Danger Zone */}
      <StaggerItem className="bg-red-50 border border-red-100 rounded-2xl p-6 mt-8 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="text-red-600" size={24} />
          <h2 className="text-xl font-bold tracking-tight text-red-700">Danger Zone</h2>
        </div>
        <p className="text-sm text-red-600 mb-6 font-medium">
          Sign out of your account on this device. You will need your password to log back in.
        </p>
        <button
          onClick={() => signOut()}
          className="bg-white hover:bg-red-50 text-red-600 border border-red-200 shadow-sm font-semibold px-6 py-2.5 rounded-xl transition"
        >
          Sign Out
        </button>
      </StaggerItem>
    </StaggerContainer>
  );
}
