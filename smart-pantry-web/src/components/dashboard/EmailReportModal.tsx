"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Mail, X, Package, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface EmailReportModalProps {
  onClose: () => void;
  userEmail?: string | null;
}

const DAY_OPTIONS = [1, 2, 3, 5, 7, 14, 30];

export default function EmailReportModal({ onClose, userEmail }: EmailReportModalProps) {
  const [reportType, setReportType] = useState<"pantry" | "expiring">("pantry");
  const [expiringDays, setExpiringDays] = useState(3);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/email/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportType, expiringDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send");

      toast.success(
        `📧 Report sent! ${data.itemCount} item${data.itemCount !== 1 ? "s" : ""} emailed to ${data.sentTo}`
      );
      onClose();
    } catch (err: any) {
      toast.error(`❌ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Mail size={18} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Email Report</h2>
                <p className="text-xs text-zinc-500">
                  Send to{" "}
                  <span className="font-medium text-zinc-700">{userEmail ?? "your email"}</span>
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-zinc-100 flex items-center justify-center transition"
            >
              <X size={16} className="text-zinc-500" />
            </button>
          </div>

          {/* Report type picker */}
          <div className="mb-5">
            <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  key: "pantry" as const,
                  label: "Full Pantry",
                  desc: "All items currently in stock",
                  icon: <Package size={18} />,
                  color: "bg-blue-50 border-blue-200 text-blue-700",
                  activeColor: "bg-blue-600 border-blue-600 text-white",
                },
                {
                  key: "expiring" as const,
                  label: "Expiring Soon",
                  desc: "Items nearing their expiry date",
                  icon: <Clock size={18} />,
                  color: "bg-amber-50 border-amber-200 text-amber-700",
                  activeColor: "bg-amber-500 border-amber-500 text-white",
                },
              ].map((opt) => {
                const isActive = reportType === opt.key;
                return (
                  <button
                    key={opt.key}
                    onClick={() => setReportType(opt.key)}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border-2 transition-all text-left ${
                      isActive ? opt.activeColor : `${opt.color} hover:opacity-80`
                    }`}
                  >
                    {opt.icon}
                    <span className="font-semibold text-sm">{opt.label}</span>
                    <span className={`text-xs ${isActive ? "opacity-80" : "opacity-70"}`}>
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiring days picker — only show when expiring is selected */}
          <AnimatePresence>
            {reportType === "expiring" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="mb-5 overflow-hidden"
              >
                <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 block">
                  Look ahead (days)
                </label>
                <div className="flex gap-2 flex-wrap">
                  {DAY_OPTIONS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setExpiringDays(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                        expiringDays === d
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                      }`}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
                <p className="text-xs text-zinc-400 mt-2">
                  Items expiring within <strong>{expiringDays}</strong> day{expiringDays !== 1 ? "s" : ""} (including already expired) will be included.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Send button */}
          <button
            onClick={handleSend}
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <Mail size={16} />
                Send Report
              </>
            )}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
