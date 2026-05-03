"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { toast } from "sonner";
import { RefreshCw, Thermometer, Play, Pause, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { FridgeStatusCard } from "@/components/fridge/FridgeStatusCard";
import { GasChart } from "@/components/fridge/GasChart";
import { DoorEventsList } from "@/components/fridge/DoorEventsList";
import { AccessLogsList } from "@/components/fridge/AccessLogsList";
import { SpoilageAlertsList } from "@/components/fridge/SpoilageAlertsList";

const MotionButton = motion.create(Button);

/* ── No-device empty state ── */
function FridgeEmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="max-w-md mx-auto py-24 px-6 flex flex-col items-center text-center"
    >
      <div className="relative mb-6">
        <motion.div
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center"
        >
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* Fridge body */}
            <rect x="8" y="4" width="28" height="36" rx="5" fill="#eef2ff" stroke="#c7d2fe" strokeWidth="1.8" />
            {/* Fridge divider */}
            <line x1="8" y1="18" x2="36" y2="18" stroke="#c7d2fe" strokeWidth="1.4" />
            {/* Handle top */}
            <rect x="30" y="8" width="3" height="7" rx="1.5" fill="#a5b4fc" />
            {/* Handle bottom */}
            <rect x="30" y="21" width="3" height="7" rx="1.5" fill="#a5b4fc" />
            {/* Wifi off indicator */}
            <circle cx="33" cy="36" r="7" fill="white" />
            <path d="M29 36l2 2 5-5" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0" />
            <line x1="29" y1="33" x2="37" y2="39" stroke="#f87171" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </motion.div>
        {/* Pulsing signal dots */}
        <motion.div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-400 border-2 border-white"
          animate={{ scale: [1, 1.4, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <h3 className="text-lg font-semibold text-zinc-800 mb-2">No fridge device connected</h3>
      <p className="text-sm text-zinc-400 leading-relaxed mb-6">
        Your ESP32 Smart Fridge hasn&apos;t sent any data yet. Make sure the device is powered on and connected to Wi-Fi.
      </p>
      <div className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-left space-y-2">
        <p className="text-xs font-semibold text-zinc-600 mb-1">Quick setup checklist</p>
        {["Power on the ESP32 board", "Connect to the same Wi-Fi network", "Verify the Supabase credentials in firmware"].map((step, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className="text-xs font-bold text-indigo-400 mt-0.5">{i + 1}.</span>
            <span className="text-xs text-zinc-500">{step}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

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

export default function FridgePage() {
  const { activeUserId, loading: userLoading } = useUser();
  const supabase = useRef(createSupabaseBrowser()).current;

  const [status, setStatus] = useState<FridgeStatus | null>(null);
  const [gasReadings, setGasReadings] = useState<any[]>([]);
  const [doorEvents, setDoorEvents] = useState<any[]>([]);
  const [accessLogs, setAccessLogs] = useState<any[]>([]);
  const [spoilageAlerts, setSpoilageAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const pendingGasReadings = useRef<any[]>([]);

  const fetchAll = useCallback(async () => {
    if (!activeUserId) return;
    setLoading(true);

    try {
      const uid = activeUserId;
      const [statusRes, gasRes, doorRes, accessRes, alertsRes] = await Promise.all([
        fetch(`/api/fridge/status?user_id=${uid}`),
        fetch(`/api/fridge/readings?user_id=${uid}&limit=200`),
        fetch(`/api/fridge/door?user_id=${uid}&limit=30`),
        fetch(`/api/fridge/access?user_id=${uid}&limit=20`),
        fetch(`/api/fridge/alerts?user_id=${uid}&limit=10`),
      ]);

      if (statusRes.ok) setStatus(await statusRes.json());
      if (gasRes.ok) setGasReadings(await gasRes.json());
      if (doorRes.ok) setDoorEvents(await doorRes.json());
      if (accessRes.ok) setAccessLogs(await accessRes.json());
      if (alertsRes.ok) setSpoilageAlerts(await alertsRes.json());
    } catch (err) {
      console.error("❌ Failed to fetch fridge data:", err);
    } finally {
      setLoading(false);
    }
  }, [activeUserId]);

  // Initial fetch
  useEffect(() => {
    if (!userLoading && activeUserId) {
      fetchAll();
    }
  }, [activeUserId, userLoading, fetchAll]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    if (!activeUserId || !isLive) return;
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [activeUserId, fetchAll, isLive]);

  // Throttle gas reading updates to avoid re-render storms
  useEffect(() => {
    if (!activeUserId || !isLive) return;
    const interval = setInterval(() => {
      if (pendingGasReadings.current.length > 0) {
        setGasReadings((prev) => {
          const newReadings = [...pendingGasReadings.current, ...prev].slice(0, 200);
          return newReadings;
        });
        
        // Also update status with latest gas reading to avoid separate re-renders
        const latestGas = pendingGasReadings.current[0];
        setStatus((s) =>
          s
            ? {
                ...s,
                online: true,
                lastSeen: latestGas.recorded_at,
                gas: {
                  mq2: latestGas.mq2_percent,
                  mq3: latestGas.mq3_percent,
                },
                door: {
                  state: latestGas.door_state || s.door?.state || "unknown",
                  distance: latestGas.distance_cm || s.door?.distance || 0,
                  at: latestGas.recorded_at,
                },
              }
            : s
        );
        pendingGasReadings.current = []; // clear buffer
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [activeUserId, isLive]);

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!activeUserId || !isLive) return;

    const gasChannel = supabase
      .channel(`fridge-gas-${activeUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fridge_gas_readings",
          filter: `user_id=eq.${activeUserId}`,
        },
        (payload: any) => {
          pendingGasReadings.current.unshift(payload.new);
        }
      )
      .subscribe();

    const doorChannel = supabase
      .channel(`fridge-door-${activeUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fridge_door_events",
          filter: `user_id=eq.${activeUserId}`,
        },
        (payload: any) => {
          setDoorEvents((prev) => [payload.new, ...prev].slice(0, 30));
          setStatus((s) =>
            s
              ? {
                  ...s,
                  door: {
                    state: payload.new.door_state,
                    distance: payload.new.distance_cm,
                    at: payload.new.recorded_at,
                  },
                }
              : s
          );
          toast(
            payload.new.door_state === "open"
              ? "🚪 Fridge door opened"
              : "🚪 Fridge door closed"
          );
        }
      )
      .subscribe();

    const accessChannel = supabase
      .channel(`fridge-access-${activeUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fridge_access_logs",
          filter: `user_id=eq.${activeUserId}`,
        },
        (payload: any) => {
          setAccessLogs((prev) => [payload.new, ...prev].slice(0, 20));
          if (!payload.new.access_granted) {
            toast.error(
              `🔒 Access denied — ${payload.new.user_type} (${payload.new.card_uid})`
            );
          }
        }
      )
      .subscribe();

    const alertChannel = supabase
      .channel(`fridge-alerts-${activeUserId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fridge_spoilage_alerts",
          filter: `user_id=eq.${activeUserId}`,
        },
        (payload: any) => {
          setSpoilageAlerts((prev) => [payload.new, ...prev].slice(0, 10));
          toast.error(
            `⚠️ Spoilage Alert! ${payload.new.shelf === "both" ? "Shelf 1 & 2" : payload.new.shelf === "shelf1" ? "Shelf 1" : "Shelf 2"} — MQ2: ${payload.new.mq2_percent}%, MQ3: ${payload.new.mq3_percent}%`
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(gasChannel);
      supabase.removeChannel(doorChannel);
      supabase.removeChannel(accessChannel);
      supabase.removeChannel(alertChannel);
    };
  }, [activeUserId, supabase]);

  if (userLoading || loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-56 bg-zinc-100 rounded animate-pulse" />
            <div className="h-4 w-40 bg-zinc-50 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-80 bg-zinc-50 rounded-2xl border border-zinc-100 animate-pulse" />
          <div className="lg:col-span-2 h-80 bg-zinc-50 rounded-2xl border border-zinc-100 animate-pulse" />
        </div>
      </div>
    );
  }

  if (!status && gasReadings.length === 0) {
    return <FridgeEmptyState />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6 min-w-0">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
      >
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Thermometer size={22} className="text-indigo-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900">
                Smart Fridge
              </h1>
              <p className="text-zinc-500 text-xs sm:text-sm mt-0.5">
                ESP32 IoT Monitor · Real-time sensor data
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <MotionButton
            variant={isLive ? "default" : "outline"}
            size="sm"
            onClick={() => setIsLive(!isLive)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={isLive ? "bg-emerald-600 hover:bg-emerald-700 text-white" : ""}
          >
            {isLive ? <Pause size={16} className="mr-1.5" /> : <Play size={16} className="mr-1.5" />}
            {isLive ? "Live" : "Paused"}
          </MotionButton>
          <MotionButton
            variant="outline"
            size="icon"
            onClick={fetchAll}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <RefreshCw size={16} />
          </MotionButton>
        </div>
      </motion.div>

      {/* Top Row: Status + Gas Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div>
          <FridgeStatusCard status={status} />
        </div>
        <div className="lg:col-span-2">
          <GasChart readings={gasReadings} />
        </div>
      </div>

      {/* Bottom Row: Door, RFID, Spoilage */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <DoorEventsList events={doorEvents} />
        <AccessLogsList logs={accessLogs} />
        <SpoilageAlertsList alerts={spoilageAlerts} />
      </div>
    </div>
  );
}
