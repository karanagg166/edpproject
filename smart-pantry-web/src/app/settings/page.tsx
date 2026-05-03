"use client";
import { useUser } from "@/lib/UserContext";
import { Copy, CheckCircle2, Shield, Camera, AlertTriangle, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import EmailReportModal from "@/components/dashboard/EmailReportModal";

export default function SettingsPage() {
  const { user, signOut } = useUser();
  const [copied, setCopied] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [editEmailValue, setEditEmailValue] = useState(user?.email || "");
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  useEffect(() => {
    if (user?.email) {
      setEditEmailValue(user.email);
    }
  }, [user]);

  const handleCopy = () => {
    if (user?.id) {
      navigator.clipboard.writeText(user.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSaveEmail = async () => {
    if (!editEmailValue || editEmailValue === user?.email) {
      setIsEditingEmail(false);
      return;
    }
    setIsSavingEmail(true);
    try {
      const res = await fetch("/api/user/update-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: editEmailValue })
      });
      if (!res.ok) throw new Error("Failed to update email");
      
      await supabase.auth.refreshSession();
      router.refresh();
      setIsEditingEmail(false);
    } catch (err) {
      console.error(err);
      alert("Error updating email");
    } finally {
      setIsSavingEmail(true);
      window.location.reload(); // Force reload to ensure context picks it up if refreshSession doesn't trigger it immediately
    }
  };

  if (!user) return null;

  return (
    <StaggerContainer className="max-w-4xl mx-auto space-y-6 sm:space-y-8 min-w-0">
      <StaggerItem className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Account Settings</h1>
      </StaggerItem>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Profile Card */}
        <StaggerItem className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm">
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Email Address</label>
                {!isEditingEmail && (
                  <button onClick={() => setIsEditingEmail(true)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Edit</button>
                )}
              </div>
              {isEditingEmail ? (
                <div className="mt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input 
                    type="email" 
                    value={editEmailValue} 
                    onChange={(e) => setEditEmailValue(e.target.value)}
                    className="flex-1 bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter new email"
                  />
                  <button 
                    onClick={handleSaveEmail} 
                    disabled={isSavingEmail}
                    className="bg-zinc-900 text-white px-4 py-3 rounded-xl font-medium hover:bg-zinc-800 disabled:opacity-50"
                  >
                    {isSavingEmail ? "Saving..." : "Save"}
                  </button>
                  <button 
                    onClick={() => { setIsEditingEmail(false); setEditEmailValue(user.email || ""); }} 
                    disabled={isSavingEmail}
                    className="bg-zinc-100 text-zinc-600 px-4 py-3 rounded-xl font-medium hover:bg-zinc-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="mt-1 text-zinc-900 bg-zinc-50 px-4 py-3 rounded-xl border border-zinc-200 font-medium">
                  {user.email || "No email"}
                </div>
              )}
            </div>
          </div>
        </StaggerItem>

        {/* Reports & Notifications Card */}
        <StaggerItem className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <Mail className="text-emerald-600" size={20} />
            </div>
            <h2 className="text-xl font-semibold text-zinc-900">Reports & Notifications</h2>
          </div>
          
          <p className="text-sm text-zinc-500 mb-6 leading-relaxed font-medium">
            Generate an instant summary of your pantry stock or upcoming expirations. The report will be sent to your primary email address.
          </p>

          <button
            onClick={() => setShowReportModal(true)}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-sm"
          >
            <Mail size={16} />
            Send Email Report
          </button>
        </StaggerItem>

        {/* Device Integration Card */}
        <StaggerItem className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-6 shadow-sm relative overflow-hidden">
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
              <code className="flex-1 bg-zinc-50 text-zinc-900 border border-zinc-200 px-3 sm:px-4 py-3 rounded-xl font-mono text-xs sm:text-sm overflow-x-auto break-all">
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

      {showReportModal && (
        <EmailReportModal 
          onClose={() => setShowReportModal(false)} 
          userEmail={user.email} 
        />
      )}

      {/* Danger Zone */}
      <StaggerItem className="bg-red-50 border border-red-100 rounded-2xl p-4 sm:p-6 mt-6 sm:mt-8 shadow-sm">
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
