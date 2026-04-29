"use client";

import { motion } from "framer-motion";
import { DoorOpen, DoorClosed } from "lucide-react";

interface DoorEvent {
  id: string;
  distance_cm: number;
  door_state: string;
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

export function DoorEventsList({ events }: { events: DoorEvent[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl border border-zinc-200 bg-white p-5"
    >
      <div className="flex items-center gap-2 mb-4">
        <DoorOpen size={16} className="text-zinc-500" />
        <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
          Door Events
        </h3>
        <span className="text-xs text-zinc-400 ml-auto">{events.length} events</span>
      </div>

      {events.length === 0 ? (
        <p className="text-sm text-zinc-400 text-center py-8">No door events yet</p>
      ) : (
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          {events.map((event, i) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                event.door_state === "open"
                  ? "bg-amber-50 border border-amber-100"
                  : "bg-zinc-50 border border-zinc-100"
              }`}
            >
              {event.door_state === "open" ? (
                <DoorOpen size={14} className="text-amber-500 shrink-0" />
              ) : (
                <DoorClosed size={14} className="text-zinc-400 shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-zinc-800 capitalize">
                  {event.door_state}
                </span>
                <span className="text-zinc-400 ml-2 text-xs">
                  {Number(event.distance_cm).toFixed(0)}cm
                </span>
              </div>
              <span className="text-xs text-zinc-400 shrink-0" title={formatTimestamp(event.recorded_at)}>
                {timeAgo(event.recorded_at)}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
