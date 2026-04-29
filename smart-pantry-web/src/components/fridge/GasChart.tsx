"use client";

import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ReferenceLine,
} from "recharts";
import { motion } from "framer-motion";

interface GasReading {
  id: string;
  mq2_percent: number;
  mq3_percent: number;
  recorded_at: string;
}

type TimeRange = "1h" | "6h" | "24h" | "7d";

function filterByRange(data: GasReading[], range: TimeRange): GasReading[] {
  const now = Date.now();
  const msMap: Record<TimeRange, number> = {
    "1h": 3600_000,
    "6h": 21600_000,
    "24h": 86400_000,
    "7d": 604800_000,
  };
  const cutoff = now - msMap[range];
  return data.filter((d) => new Date(d.recorded_at).getTime() >= cutoff);
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function GasChart({ readings }: { readings: GasReading[] }) {
  const [range, setRange] = useState<TimeRange>("1h");

  const filtered = useMemo(() => {
    const f = filterByRange(readings, range);
    // Sort ascending for chart
    return [...f].sort(
      (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );
  }, [readings, range]);

  const chartData = useMemo(
    () =>
      filtered.map((r) => ({
        time: formatTime(r.recorded_at),
        MQ2: r.mq2_percent,
        MQ3: r.mq3_percent,
      })),
    [filtered]
  );

  const ranges: TimeRange[] = ["1h", "6h", "24h", "7d"];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="rounded-2xl border border-zinc-200 bg-white p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 uppercase tracking-wide">
            Gas Levels Over Time
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            {filtered.length} readings in selected range
          </p>
        </div>
        <div className="flex gap-1 bg-zinc-100 rounded-lg p-0.5">
          {ranges.map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                range === r
                  ? "bg-white text-zinc-900 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="flex items-center justify-center h-56 text-zinc-400 text-sm">
          No data for this time range
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 11, fill: "#a1a1aa" }}
              tickLine={false}
              axisLine={{ stroke: "#e4e4e7" }}
              unit="%"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #e4e4e7",
                borderRadius: "12px",
                fontSize: "12px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
              }}
            />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", paddingTop: "8px" }}
            />
            <ReferenceLine
              y={35}
              stroke="#ef4444"
              strokeDasharray="4 4"
              label={{ value: "Danger", position: "right", fontSize: 10, fill: "#ef4444" }}
            />
            <ReferenceLine
              y={15}
              stroke="#f59e0b"
              strokeDasharray="4 4"
              label={{ value: "Caution", position: "right", fontSize: 10, fill: "#f59e0b" }}
            />
            <Line
              type="monotone"
              dataKey="MQ2"
              stroke="#6366f1"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="MQ2 (Smoke)"
            />
            <Line
              type="monotone"
              dataKey="MQ3"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="MQ3 (Alcohol/Gas)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </motion.div>
  );
}
