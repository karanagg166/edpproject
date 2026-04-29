"use client";

import { motion } from "framer-motion";
import { ShieldCheck, ShieldX, CreditCard } from "lucide-react";

interface AccessLog {
  id: string;
  card_uid: string;
  access_granted: boolean;
  user_type: string;
  recorded_at: string;
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTimestamp(ts: string): string {
  return new Date(ts).toLocaleString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    day: "numeric",
    month: "short",
  });
}

const USER_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  adult: { label: "Adult", color: "text-emerald-600 bg-emerald-50" },
  child: { label: "Child", color: "text-amber-600 bg-amber-50" },
  unknown: { label: "Unknown", color: "text-red-600 bg-red-50" },
};

export function AccessLogsList({ logs }: { logs: AccessLog[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <CreditCard size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
          RFID Access Log
        </h3>
        <span className="text-xs text-zinc-400 ml-auto">{logs.length} scans</span>
      </div>

      {logs.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No RFID scans yet</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {logs.map((log, i) => {
            const userInfo = USER_TYPE_LABELS[log.user_type] || USER_TYPE_LABELS.unknown;
            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm border ${
                  log.access_granted
                    ? "bg-emerald-50/50 border-emerald-100"
                    : "bg-red-50/50 border-red-100"
                }`}
              >
                {log.access_granted ? (
                  <ShieldCheck size={16} className="text-emerald-500 shrink-0" />
                ) : (
                  <ShieldX size={16} className="text-red-500 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-zinc-800">
                      {log.access_granted ? "Granted" : "Denied"}
                    </span>
                    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${userInfo.color}`}>
                      {userInfo.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono truncate">
                    {log.card_uid}
                  </p>
                </div>
                <span className="text-xs text-zinc-400 shrink-0" title={formatTimestamp(log.recorded_at)}>
                  {timeAgo(log.recorded_at)}
                </span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
