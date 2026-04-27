"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { Activity, Search, RefreshCw } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";

const RANGES = [
  { label: "Today", value: "1" },
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
];

const MACROS = [
  { key: "protein", label: "Protein", color: "#3f3f46", unit: "g", daily: 50 },
  { key: "carbs",   label: "Carbs",   color: "#71717a", unit: "g", daily: 250 },
  { key: "fat",     label: "Fat",     color: "#a1a1aa", unit: "g", daily: 65 },
  { key: "fiber",   label: "Fiber",   color: "#52525b", unit: "g", daily: 28 },
  { key: "calories",label: "Calories",color: "#18181b", unit: "kcal", daily: 2000 },
];

export default function NutritionPage() {
  const { activeUserId } = useUser();
  const [range, setRange] = useState("7");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState<"aggregate" | "lookup">("aggregate");
  const [query, setQuery] = useState("");
  const [queryQty, setQueryQty] = useState("1");
  const [lookup, setLookup] = useState<any>(null);
  const [lookupLoading, setLookupLoading] = useState(false);

  const fetchAggregate = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/nutrition/aggregate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ range }),
    });
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [activeUserId, range]);

  useEffect(() => { fetchAggregate(); }, [fetchAggregate]);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLookupLoading(true);
    
    const searchString = `${queryQty} ${query}`;
    
    const res = await fetch("/api/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: [{ food: searchString, quantity: 100 }] }),
    });
    setLookup(await res.json());
    setLookupLoading(false);
  };

  const totals = data?.totals || {};
  const chartData = (data?.days || []).map((d: any) => ({
    date: d.date?.slice(5),
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fat: Math.round(d.fat),
    Fiber: Math.round(d.fiber),
  }));

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Nutrition</h1>
          <p className="text-zinc-500 text-sm mt-1">Macro breakdown based on your pantry usage</p>
        </div>
        <div className="flex gap-1 bg-zinc-100 p-1 rounded-xl">
          {RANGES.map((r) => (
            <button key={r.value} onClick={() => setRange(r.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${
                range === r.value ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
              }`}>
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-6 border-b border-zinc-200">
        {(["aggregate", "lookup"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition -mb-px relative ${
              activeTab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}>
            {t === "aggregate" ? "📊 Overview" : "🔍 Lookup Item"}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === "aggregate" ? (
            loading ? (
              <div className="space-y-6 animate-pulse">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="shadow-sm border-zinc-200 h-28 bg-zinc-50/50" />
                  ))}
                </div>
                <Card className="shadow-sm border-zinc-200 h-80 bg-zinc-50/50" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {MACROS.map(({ key, label, color, unit, daily }) => {
                    const val = totals[key] || 0;
                    const pct = Math.min(100, Math.round((val / (daily * parseInt(range))) * 100));
                    return (
                      <Card key={key} className="shadow-sm border-zinc-200">
                        <CardContent className="p-4">
                          <p className="text-xs font-medium text-zinc-500 mb-1">{label}</p>
                          <p className="text-2xl font-bold text-zinc-900">{val}
                            <span className="text-xs font-normal text-zinc-500 ml-1">{unit}</span>
                          </p>
                          <div className="w-full bg-zinc-100 rounded-full h-1.5 mt-3">
                            <div className="h-1.5 rounded-full transition-all duration-700"
                              style={{ width: `${pct}%`, backgroundColor: color }} />
                          </div>
                          <p className="text-[10px] text-zinc-400 mt-1.5 font-medium">{pct}% of {range}-day target</p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {chartData.length > 0 ? (
                  <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold text-zinc-700">Daily Macro Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 pt-0 min-h-[340px]">
                      {mounted && (
                        <div style={{ width: "100%", height: 300 }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#f4f4f5" vertical={false} />
                              <XAxis dataKey="date" tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                              <YAxis tick={{ fill: "#71717a", fontSize: 12 }} axisLine={false} tickLine={false} />
                              <Tooltip cursor={{ fill: '#f4f4f5' }} contentStyle={{ background: "#ffffff", border: "1px solid #e4e4e7", borderRadius: 12, boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }} />
                              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                              <Bar dataKey="Protein" fill="#3f3f46" radius={[4,4,0,0]} maxBarSize={40} />
                              <Bar dataKey="Carbs"   fill="#71717a" radius={[4,4,0,0]} maxBarSize={40} />
                              <Bar dataKey="Fat"     fill="#a1a1aa" radius={[4,4,0,0]} maxBarSize={40} />
                              <Bar dataKey="Fiber"   fill="#52525b" radius={[4,4,0,0]} maxBarSize={40} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="shadow-sm border-zinc-200">
                    <CardContent className="p-12 text-center text-zinc-500">
                      <Activity size={40} className="mx-auto mb-4 text-zinc-300" />
                      <p className="font-medium text-zinc-700">No consumption data yet.</p>
                      <p className="text-sm mt-1">Items are counted when removed from pantry via camera.</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )
          ) : (
            <div className="space-y-6">
              <form onSubmit={handleLookup} className="flex gap-3 max-w-2xl">
                <div className="w-24 shrink-0">
                  <Input type="number" min="1" step="0.1" value={queryQty} onChange={e => setQueryQty(e.target.value)}
                    placeholder="Qty" className="bg-white" />
                </div>
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. Apple, Chicken Breast, Brown Rice..."
                    className="bg-white pl-9" />
                </div>
                <Button type="submit" disabled={lookupLoading} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 shadow-sm">
                  {lookupLoading ? "Searching..." : "Search"}
                </Button>
              </form>
              
              {lookup && (
                <div className="space-y-6">
                  {lookup.item_data && (
                    <Card className="shadow-sm border-zinc-200">
                      <CardHeader className="pb-3 border-b border-zinc-100 bg-zinc-50/50">
                        <CardTitle className="text-sm font-semibold text-zinc-900">
                          Per Item (approx. {lookup.item_data.serving_size_g}g)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: "Calories", val: lookup.item_data.calories_per_item, unit: "kcal", color: "border-zinc-300 bg-zinc-50" },
                            { label: "Protein",  val: lookup.item_data.protein_per_item,  unit: "g",    color: "border-zinc-200 bg-zinc-50/50" },
                            { label: "Fat",      val: lookup.item_data.fat_per_item,      unit: "g",    color: "border-zinc-200 bg-zinc-50/50" },
                            { label: "Carbs",    val: lookup.item_data.carbs_per_item,    unit: "g",    color: "border-zinc-200 bg-zinc-50/50" },
                          ].map(({ label, val, unit, color }) => (
                            <div key={label} className={`border border-t-4 ${color} p-4 rounded-xl`}>
                              <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
                              <p className="text-2xl font-bold text-zinc-900 mt-1">{val || 0}
                                <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>
                              </p>
                              <p className="text-[10px] text-zinc-400 mt-1 font-medium">per 1 item (~{lookup.item_data.serving_size_g}g)</p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="shadow-sm border-zinc-200">
                    <CardHeader className="pb-3 border-b border-zinc-100">
                      <CardTitle className="text-sm font-semibold text-zinc-700">
                        {lookup.item_data && lookup.item_data.parsed_qty !== 1 ? `Total for ${lookup.item_data.parsed_qty} items` : "Per 100g Breakdown"}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { label: "Calories", val: lookup.calories, unit: "kcal", color: "border-zinc-300" },
                          { label: "Protein",  val: lookup.protein,  unit: "g",    color: "border-zinc-200" },
                          { label: "Fat",      val: lookup.fat,      unit: "g",    color: "border-zinc-200" },
                          { label: "Carbs",    val: lookup.carbs,    unit: "g",    color: "border-zinc-200" },
                        ].map(({ label, val, unit, color }) => (
                          <div key={label} className={`border border-t-2 ${color} bg-white p-4 rounded-xl shadow-sm`}>
                            <p className="text-zinc-500 text-xs font-medium uppercase tracking-wider">{label}</p>
                            <p className="text-2xl font-bold text-zinc-900 mt-1">{val || 0}
                              <span className="text-sm font-normal text-zinc-500 ml-1">{unit}</span>
                            </p>
                            <p className="text-[10px] text-zinc-400 mt-1 font-medium">
                              {lookup.item_data && lookup.item_data.parsed_qty !== 1 ? `total for ${lookup.item_data.parsed_qty}` : "per 100g"}
                            </p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
