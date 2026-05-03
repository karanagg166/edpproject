"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { toast } from "sonner";
import { RefreshCw, Thermometer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

import { FridgeStatusCard } from "@/components/fridge/FridgeStatusCard";
import { GasChart } from "@/components/fridge/GasChart";
import { DoorEventsList } from "@/components/fridge/DoorEventsList";
import { AccessLogsList } from "@/components/fridge/AccessLogsList";
import { SpoilageAlertsList } from "@/components/fridge/SpoilageAlertsList";

const MotionButton = motion.create(Button);

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
    if (!activeUserId) return;
    const interval = setInterval(fetchAll, 10000);
    return () => clearInterval(interval);
  }, [activeUserId, fetchAll]);

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!activeUserId) return;

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
          setGasReadings((prev) => [payload.new, ...prev].slice(0, 200));
          // Update live status
          setStatus((s) =>
            s
              ? {
                  ...s,
                  online: true,
                  lastSeen: payload.new.recorded_at,
                  gas: {
                    mq2: payload.new.mq2_percent,
                    mq3: payload.new.mq3_percent,
                  },
                  door: {
                    state: payload.new.door_state || s.door?.state || "unknown",
                    distance: payload.new.distance_cm || s.door?.distance || 0,
                    at: payload.new.recorded_at,
                  },
                }
              : s
          );
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
        <MotionButton
          variant="outline"
          size="icon"
          onClick={fetchAll}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RefreshCw size={16} />
        </MotionButton>
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
