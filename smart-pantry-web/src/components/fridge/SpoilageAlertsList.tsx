"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Moon } from "lucide-react";

interface SpoilageAlert {
  id: string;
  shelf: string;
  mq2_percent: number;
  mq3_percent: number;
  night_mode: boolean;
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

const SHELF_LABELS: Record<string, string> = {
  shelf1: "Shelf 1",
  shelf2: "Shelf 2",
  both: "Shelf 1 & 2",
};

export function SpoilageAlertsList({ alerts }: { alerts: SpoilageAlert[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle size={16} className="text-amber-500" />
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
          Spoilage Alerts
        </h3>
        <span className="text-xs text-zinc-400 ml-auto">{alerts.length} alerts</span>
      </div>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-emerald-600 font-medium">All Clear ✓</p>
          <p className="text-xs text-zinc-400 mt-1">No spoilage alerts</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {alerts.map((alert, i) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="px-3 py-3 rounded-xl bg-red-50/60 border border-red-100"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span className="font-semibold text-sm text-red-700">
                    {SHELF_LABELS[alert.shelf] || alert.shelf}
                  </span>
                  {alert.night_mode && (
                    <span className="flex items-center gap-1 text-[10px] text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded-full font-medium">
                      <Moon size={10} /> Night
                    </span>
                  )}
                </div>
                <span className="text-xs text-zinc-400" title={formatTimestamp(alert.recorded_at)}>
                  {timeAgo(alert.recorded_at)}
                </span>
              </div>
              <div className="flex gap-3 text-xs text-zinc-600">
                <span>MQ2: <strong className="text-red-600">{alert.mq2_percent}%</strong></span>
                <span>MQ3: <strong className="text-red-600">{alert.mq3_percent}%</strong></span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
