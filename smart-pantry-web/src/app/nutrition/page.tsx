"use client";
import { useEffect, useState, useCallback } from "react";
import { useUser } from "@/lib/UserContext";
import { Activity, Search, RefreshCw, Trash2, CheckCircle2 } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { toast } from "sonner";

const RANGES = [
  { label: "Today", value: "1" },
  { label: "7 Days", value: "7" },
  { label: "30 Days", value: "30" },
];

const MACROS = [
  { key: "protein",   label: "Protein",  color: "#3f3f46", unit: "g",    daily: 50 },
  { key: "carbs",     label: "Carbs",    color: "#71717a", unit: "g",    daily: 250 },
  { key: "fat",       label: "Fat",      color: "#a1a1aa", unit: "g",    daily: 65 },
  { key: "fiber",     label: "Fiber",    color: "#52525b", unit: "g",    daily: 28 },
];

const MICROS = [
  { key: "sodium",    label: "Sodium",   unit: "mg",  daily: 2300,  emoji: "🧂" },
  { key: "sugar",     label: "Sugar",    unit: "g",   daily: 50,    emoji: "🍬" },
  { key: "vitamin_c", label: "Vitamin C",unit: "mg",  daily: 90,    emoji: "🍊" },
  { key: "calcium",   label: "Calcium",  unit: "mg",  daily: 1000,  emoji: "🦷" },
  { key: "iron",      label: "Iron",     unit: "mg",  daily: 18,    emoji: "🔩" },
];

export default function NutritionPage() {
  const { activeUserId } = useUser();
  const [range, setRange] = useState("7");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const [activeTab, setActiveTab] = useState<"aggregate" | "lookup" | "consumed">("aggregate");
  const [consumedItems, setConsumedItems] = useState<any[]>([]);
  const [consumedLoading, setConsumedLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [queryQty, setQueryQty] = useState("1");
  const [mealType, setMealType] = useState("snack");
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

  const fetchConsumed = useCallback(async () => {
    setConsumedLoading(true);
    const res = await fetch(`/api/nutrition/consumed?range=${range}`);
    const json = await res.json();
    setConsumedItems(json.consumed || []);
    setConsumedLoading(false);
  }, [activeUserId, range]);

  useEffect(() => { 
    fetchAggregate(); 
    fetchConsumed();
  }, [fetchAggregate, fetchConsumed]);

  const handleLogConsumed = async () => {
    if (!lookup) return;
    
    const itemData = lookup.item_data;
    const qty = itemData ? itemData.parsed_qty : 1;
    const calories  = itemData ? itemData.calories_per_item  * qty : lookup.calories;
    const protein   = itemData ? itemData.protein_per_item   * qty : lookup.protein;
    const fat       = itemData ? itemData.fat_per_item       * qty : lookup.fat;
    const carbs     = itemData ? itemData.carbs_per_item     * qty : lookup.carbs;
    // vitamins/minerals from the top-level lookup totals
    const fiber     = lookup.fiber     || 0;
    const sodium    = lookup.sodium    || 0;
    const sugar     = lookup.sugar     || 0;
    const vitamin_c = lookup.vitamin_c || 0;
    const calcium   = lookup.calcium   || 0;
    const iron      = lookup.iron      || 0;
    
    const res = await fetch("/api/nutrition/consumed", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        item_name: query || "Unknown Item",
        quantity: qty,
        calories, protein, fat, carbs,
        fiber, sodium, sugar, vitamin_c, calcium, iron,
        meal_type: mealType
      })
    });
    
    if (res.ok) {
      toast.success("🍽️ Successfully logged!");
      setQuery("");
      setQueryQty("1");
      setLookup(null);
      fetchAggregate();
      fetchConsumed();
    }
  };

  const handleDeleteConsumed = async (id: string) => {
    if (!confirm("Are you sure you want to remove this log?")) return;
    const res = await fetch(`/api/nutrition/consumed?id=${id}`, {
      method: "DELETE"
    });
    if (res.ok) {
      fetchAggregate();
      fetchConsumed();
    }
  };

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
  const dailyCalorieGoal = data?.dailyCalorieGoal || 2000;
  const todayCalories = data?.todayCalories || 0;
  const caloriePct = Math.min(100, Math.round((todayCalories / dailyCalorieGoal) * 100));
  const calorieRemaining = Math.max(0, dailyCalorieGoal - todayCalories);
  // SVG ring
  const RING_R = 52;
  const RING_CIRC = 2 * Math.PI * RING_R;
  const ringOffset = RING_CIRC - (caloriePct / 100) * RING_CIRC;

  const chartData = (data?.days || []).map((d: any) => ({
    date: d.date?.slice(5),
    Protein: Math.round(d.protein),
    Carbs: Math.round(d.carbs),
    Fat: Math.round(d.fat),
    Fiber: Math.round(d.fiber),
  }));

  return (
    <StaggerContainer className="max-w-5xl mx-auto space-y-6">
      <StaggerItem className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
      </StaggerItem>

      <StaggerItem className="flex gap-6 border-b border-zinc-200 overflow-x-auto">
        {(["aggregate", "lookup", "consumed"] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`pb-3 text-sm font-medium border-b-2 transition -mb-px relative whitespace-nowrap ${
              activeTab === t ? "border-zinc-900 text-zinc-900" : "border-transparent text-zinc-500 hover:text-zinc-700"
            }`}>
            {t === "aggregate" ? "📊 Overview" : t === "lookup" ? "🔍 Lookup Item" : "🍽️ Consumed Items"}
          </button>
        ))}
      </StaggerItem>

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
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="skeleton h-52 rounded-2xl" />
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-28 rounded-xl" />)}
                  </div>
                </div>
                <div className="skeleton h-28 rounded-2xl" />
                <div className="skeleton h-80 rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-6">
                {/* Calorie Budget Ring + Macros grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Budget ring */}
                  <Card className="shadow-sm border-zinc-200 flex items-center justify-center py-6">
                    <CardContent className="p-4 flex flex-col items-center gap-2">
                      <svg width={130} height={130} viewBox="0 0 130 130">
                        <circle cx={65} cy={65} r={RING_R} fill="none" stroke="#f4f4f5" strokeWidth={10} />
                        <circle cx={65} cy={65} r={RING_R} fill="none" stroke="#18181b" strokeWidth={10}
                          strokeDasharray={RING_CIRC}
                          strokeDashoffset={ringOffset}
                          strokeLinecap="round"
                          transform="rotate(-90 65 65)"
                          style={{ transition: "stroke-dashoffset 0.8s ease" }}
                        />
                        <text x={65} y={60} textAnchor="middle" className="fill-zinc-900" style={{ fontSize: 22, fontWeight: 700, fill: "#18181b" }}>{todayCalories}</text>
                        <text x={65} y={76} textAnchor="middle" style={{ fontSize: 11, fill: "#71717a" }}>kcal today</text>
                      </svg>
                      <div className="text-center">
                        <p className="text-sm font-semibold text-zinc-900">{calorieRemaining} kcal remaining</p>
                        <p className="text-xs text-zinc-400">Goal: {dailyCalorieGoal} kcal/day</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Macros grid */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    {MACROS.map(({ key, label, color, unit, daily }, idx) => {
                      const val = totals[key] || 0;
                      const pct = Math.min(100, Math.round((val / (daily * parseInt(range))) * 100));
                      return (
                        <motion.div
                          key={key}
                          initial={{ opacity: 0, y: 16 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.07, type: "spring", stiffness: 240, damping: 22 }}
                        >
                          <Card className="shadow-sm border-zinc-200 card-hover h-full">
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
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Vitamins & Minerals panel */}
                <Card className="shadow-sm border-zinc-200">
                  <CardHeader className="pb-2 border-b border-zinc-100">
                    <CardTitle className="text-sm font-semibold text-zinc-700">Vitamins &amp; Minerals ({range}-day total)</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {MICROS.map(({ key, label, unit, daily, emoji }) => {
                        const val = totals[key] || 0;
                        const pct = Math.min(100, Math.round((val / (daily * parseInt(range))) * 100));
                        return (
                          <div key={key} className="space-y-1.5">
                            <p className="text-xs text-zinc-500 font-medium">{emoji} {label}</p>
                            <p className="text-lg font-bold text-zinc-900">{val}<span className="text-xs font-normal text-zinc-400 ml-1">{unit}</span></p>
                            <div className="w-full bg-zinc-100 rounded-full h-1">
                              <div className="h-1 rounded-full bg-zinc-700 transition-all duration-700" style={{ width: `${pct}%` }} />
                            </div>
                            <p className="text-[10px] text-zinc-400">{pct}% of daily</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

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
          ) : activeTab === "lookup" ? (
            <div className="space-y-6">
              <form onSubmit={handleLookup} className="flex flex-col sm:flex-row gap-3 w-full">
                <div className="w-full sm:w-24 shrink-0">
                  <Input type="number" min="1" step="0.1" value={queryQty} onChange={e => setQueryQty(e.target.value)}
                    placeholder="Qty" className="bg-white" />
                </div>
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
                  <Input value={query} onChange={e => setQuery(e.target.value)}
                    placeholder="e.g. Apple, Chicken Breast, Brown Rice..."
                    className="bg-white pl-9 w-full" />
                </div>
                <Button type="submit" disabled={lookupLoading} className="bg-zinc-900 hover:bg-zinc-800 text-white px-6 shadow-sm w-full sm:w-auto">
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
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {[
                            { label: "Calories",  val: lookup.item_data.calories_per_item, unit: "kcal" },
                            { label: "Protein",   val: lookup.item_data.protein_per_item,  unit: "g" },
                            { label: "Fat",       val: lookup.item_data.fat_per_item,      unit: "g" },
                            { label: "Carbs",     val: lookup.item_data.carbs_per_item,    unit: "g" },
                            { label: "Fiber",     val: Math.round((lookup.fiber || 0) * 10)/10, unit: "g" },
                          ].map(({ label, val, unit }) => (
                            <div key={label} className="border border-zinc-200 bg-zinc-50 p-3 rounded-xl">
                              <p className="text-zinc-500 text-[10px] font-semibold uppercase tracking-wider">{label}</p>
                              <p className="text-xl font-bold text-zinc-900 mt-1">{val || 0}<span className="text-xs font-normal text-zinc-500 ml-1">{unit}</span></p>
                              <p className="text-[10px] text-zinc-400 mt-1">per item (~{lookup.item_data.serving_size_g}g)</p>
                            </div>
                          ))}
                        </div>
                        {/* Vitamins & Minerals mini row */}
                        <div className="mt-4 flex flex-wrap gap-3">
                          {[
                            { label: "🧂 Sodium",    val: lookup.sodium,    unit: "mg" },
                            { label: "🍬 Sugar",     val: lookup.sugar,     unit: "g" },
                            { label: "🍊 Vitamin C", val: lookup.vitamin_c, unit: "mg" },
                            { label: "🦷 Calcium",   val: lookup.calcium,   unit: "mg" },
                            { label: "🔩 Iron",      val: lookup.iron,      unit: "mg" },
                          ].map(({ label, val, unit }) => (
                            <span key={label} className="inline-flex items-center gap-1 bg-zinc-100 text-zinc-700 text-xs font-medium px-3 py-1.5 rounded-full">
                              {label}: <strong>{val || 0}{unit}</strong>
                            </span>
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
                  
                  <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 pt-4">
                    <select
                      value={mealType}
                      onChange={(e) => setMealType(e.target.value)}
                      className="h-12 px-4 rounded-xl border border-zinc-200 bg-white text-sm font-medium text-zinc-700 outline-none focus:ring-2 focus:ring-zinc-900"
                    >
                      <option value="breakfast">🌅 Breakfast</option>
                      <option value="lunch">☀️ Lunch</option>
                      <option value="dinner">🌙 Dinner</option>
                      <option value="snack">🍎 Snack</option>
                    </select>
                    <Button onClick={handleLogConsumed} className="bg-zinc-900 hover:bg-zinc-800 text-white px-8 py-6 rounded-xl shadow-sm text-base font-medium flex items-center justify-center gap-2 min-h-[44px]">
                      <CheckCircle2 size={20} />
                      Log as Consumed
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-900">Manually Logged Items</h2>
              {consumedLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="skeleton h-24 rounded-xl" />
                  ))}
                </div>
              ) : consumedItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {consumedItems.map((item, idx) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, type: "spring", stiffness: 240, damping: 22 }}
                    >
                    <Card className="shadow-sm border-zinc-200 relative group overflow-hidden card-hover">
                      <CardContent className="p-5">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-zinc-900 capitalize">{item.item_name}</h3>
                            <p className="text-xs text-zinc-500">{new Date(item.detected_at).toLocaleString()}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            {item.meal_type && (
                              <div className="bg-zinc-800 text-zinc-100 font-medium px-2 py-0.5 rounded text-[10px] capitalize">
                                {item.meal_type}
                              </div>
                            )}
                            <div className="bg-zinc-100 text-zinc-600 font-medium px-2 py-1 rounded-md text-xs">
                              x{item.quantity}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 text-xs text-zinc-600 font-medium">
                          <span>🔥 {Math.round(item.nutritional_data?.calories || 0)} kcal</span>
                          <span>🥩 {Math.round(item.nutritional_data?.protein || 0)}g P</span>
                          <span>🍞 {Math.round(item.nutritional_data?.carbs || 0)}g C</span>
                          <span>🥑 {Math.round(item.nutritional_data?.fat || 0)}g F</span>
                        </div>
                        {(item.nutritional_data?.sodium || item.nutritional_data?.iron || item.nutritional_data?.vitamin_c) ? (
                          <div className="flex flex-wrap gap-2 text-[10px] text-zinc-400 font-medium mt-1.5">
                            {item.nutritional_data?.sodium > 0 && <span>🧂 {Math.round(item.nutritional_data.sodium)}mg Na</span>}
                            {item.nutritional_data?.vitamin_c > 0 && <span>🍊 {Math.round(item.nutritional_data.vitamin_c)}mg Vit C</span>}
                            {item.nutritional_data?.iron > 0 && <span>🔩 {Math.round(item.nutritional_data.iron * 10)/10}mg Fe</span>}
                          </div>
                        ) : null}
                        <button onClick={() => handleDeleteConsumed(item.id)} className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-sm bg-white border border-transparent group-hover:border-zinc-200">
                          <Trash2 size={16} />
                        </button>
                      </CardContent>
                    </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <Card className="shadow-sm border-zinc-200">
                  <CardContent className="p-12 text-center text-zinc-500">
                    <Activity size={40} className="mx-auto mb-4 text-zinc-300" />
                    <p className="font-medium text-zinc-700">No manually logged items yet.</p>
                    <p className="text-sm mt-1">Use the Lookup tab to add items you've consumed.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </StaggerContainer>
  );
}
