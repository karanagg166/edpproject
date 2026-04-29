"use client";

import { motion } from "framer-motion";
import { Thermometer, DoorOpen, DoorClosed, Wifi, WifiOff, Moon, Sun, Wind } from "lucide-react";

interface FridgeStatus {
  online: boolean;
  lastSeen: string | null;
  gas: { mq2: number; mq3: number } | null;
  door: { state: string; distance: number; at: string } | null;
  lastAccess: {
    cardUid: string;
    granted: boolean;
    userType: string;
    at: string;
  } | null;
  lastAlert: {
    shelf: string;
    mq2: number;
    mq3: number;
    nightMode: boolean;
    at: string;
  } | null;
}

function getGasLevel(pct: number): { label: string; color: string; bg: string } {
  if (pct < 15) return { label: "Normal", color: "text-emerald-600", bg: "bg-emerald-50" };
  if (pct < 35) return { label: "Moderate", color: "text-amber-600", bg: "bg-amber-50" };
  return { label: "High", color: "text-red-600", bg: "bg-red-50" };
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 5) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function FridgeStatusCard({ status }: { status: FridgeStatus | null }) {
  if (!status) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 animate-pulse">
        <div className="h-6 w-40 bg-zinc-100 rounded mb-4" />
        <div className="space-y-3">
          <div className="h-10 bg-zinc-50 rounded-xl" />
          <div className="h-10 bg-zinc-50 rounded-xl" />
          <div className="h-10 bg-zinc-50 rounded-xl" />
        </div>
      </div>
    );
  }

  const mq2Level = status.gas ? getGasLevel(status.gas.mq2) : null;
  const mq3Level = status.gas ? getGasLevel(status.gas.mq3) : null;
  const isNight = new Date().getHours() >= 22 || new Date().getHours() <= 6;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-zinc-200 bg-white p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
          Live Status
        </h3>
        <div className="flex items-center gap-2">
          {status.online ? (
            <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 bg-zinc-50 px-2.5 py-1 rounded-full">
              <WifiOff size={12} />
              Offline
            </span>
          )}
        </div>
      </div>

      {/* Door State */}
      <div className={`flex items-center justify-between p-3 rounded-xl ${
        status.door?.state === "open" ? "bg-amber-50 border border-amber-200" : "bg-zinc-50 border border-zinc-100"
      }`}>
        <div className="flex items-center gap-3">
          {status.door?.state === "open" ? (
            <DoorOpen size={20} className="text-amber-600" />
          ) : (
            <DoorClosed size={20} className="text-zinc-500" />
          )}
          <div>
            <p className="text-sm font-semibold text-zinc-900">
              Door {status.door?.state === "open" ? "Open" : "Closed"}
            </p>
            <p className="text-xs text-zinc-500">
              {status.door ? `${Number(status.door.distance).toFixed(0)}cm · ${timeAgo(status.door.at)}` : "No data"}
            </p>
          </div>
        </div>
      </div>

      {/* Gas Levels */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-wide">
          <Wind size={12} /> Gas Sensors
        </div>

        {status.gas ? (
          <div className="grid grid-cols-2 gap-2">
            <div className={`p-3 rounded-xl ${mq2Level!.bg} border border-zinc-100`}>
              <p className="text-xs text-zinc-500 mb-1">MQ2 (Smoke)</p>
              <p className={`text-2xl font-bold ${mq2Level!.color}`}>
                {status.gas.mq2}%
              </p>
              <p className={`text-xs font-medium ${mq2Level!.color}`}>{mq2Level!.label}</p>
            </div>
            <div className={`p-3 rounded-xl ${mq3Level!.bg} border border-zinc-100`}>
              <p className="text-xs text-zinc-500 mb-1">MQ3 (Alcohol)</p>
              <p className={`text-2xl font-bold ${mq3Level!.color}`}>
                {status.gas.mq3}%
              </p>
              <p className={`text-xs font-medium ${mq3Level!.color}`}>{mq3Level!.label}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">No gas data yet</p>
        )}
      </div>

      {/* Night Mode */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-100">
        {isNight ? (
          <Moon size={14} className="text-indigo-500" />
        ) : (
          <Sun size={14} className="text-amber-500" />
        )}
        <span className="text-xs text-zinc-600 font-medium">
          {isNight ? "Night Mode Active (Quiet Alerts)" : "Day Mode (Normal Alerts)"}
        </span>
      </div>

      {/* Last Seen */}
      {status.lastSeen && (
        <p className="text-xs text-zinc-400 text-center">
          Last reading: {timeAgo(status.lastSeen)}
        </p>
      )}
    </motion.div>
  );
}
