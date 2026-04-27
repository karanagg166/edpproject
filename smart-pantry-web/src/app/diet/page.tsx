"use client";
import { useEffect, useState } from "react";
import { useUser } from "@/lib/UserContext";
import { Utensils, Zap, Loader2, History, ChevronDown, CheckCircle, ShoppingCart, XCircle } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function DietPage() {
  const { activeUserId } = useUser();
  const supabase = createSupabaseBrowser();
  const [currentWeight, setCurrentWeight] = useState("");
  const [targetWeight, setTargetWeight]   = useState("");
  const [timelineWeeks, setTimelineWeeks] = useState("12");
  const [plan, setPlan]  = useState<any | null>(null);
  const [goal, setGoal]  = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastPlans, setPastPlans] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (!activeUserId) return;
    supabase.from("diet_plans").select("id, goal, created_at, plan_content")
      .eq("user_id", activeUserId).order("created_at", { ascending: false }).limit(5)
      .then((res: any) => { if (res.data) setPastPlans(res.data); });
  }, [activeUserId]);

  const generatePlan = async () => {
    setLoading(true);
    setError(null);
    setPlan(null);
    try {
      const res = await fetch("/api/diet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentWeight: parseFloat(currentWeight) || undefined,
          targetWeight: parseFloat(targetWeight) || undefined,
          timelineWeeks: parseInt(timelineWeeks),
          userId: activeUserId,
        }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        if (res.status === 401) throw new Error("Please log in to generate a diet plan");
        throw new Error(data.error || "Failed to generate plan. Please try again.");
      }
      
      setPlan(data.diet);
      setGoal(data.goal);
      // Refresh history
      const { data: hist } = await supabase.from("diet_plans").select("id, goal, created_at, plan_content")
        .eq("user_id", activeUserId).order("created_at", { ascending: false }).limit(5);
      if (hist) setPastPlans(hist);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "An unexpected error occurred");
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const weightDiff = parseFloat(targetWeight) - parseFloat(currentWeight);
  const autoGoal = isNaN(weightDiff) ? "Maintenance"
    : weightDiff < -2 ? "Weight Loss"
    : weightDiff > 2 ? "Muscle Gain"
    : "Maintenance";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Diet Planner</h1>
        <p className="text-zinc-500 text-sm mt-1">Personalized plan based on your pantry and goals</p>
      </div>

      {/* Input form */}
      <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Current Weight (kg)</label>
            <input type="number" value={currentWeight} onChange={e => setCurrentWeight(e.target.value)}
              placeholder="e.g. 85"
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Target Weight (kg)</label>
            <input type="number" value={targetWeight} onChange={e => setTargetWeight(e.target.value)}
              placeholder="e.g. 70"
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition" />
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 block mb-1.5">Timeline</label>
            <select value={timelineWeeks} onChange={e => setTimelineWeeks(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 text-zinc-900 text-sm focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 outline-none transition appearance-none">
              <option value="4">4 weeks (1 month)</option>
              <option value="8">8 weeks (2 months)</option>
              <option value="12">12 weeks (3 months)</option>
              <option value="24">24 weeks (6 months)</option>
            </select>
          </div>
        </div>

        {/* Auto-detected goal */}
        <div className="flex items-center gap-3 p-3 bg-zinc-50 rounded-xl border border-zinc-100">
          <span className="text-xs font-medium text-zinc-500">Detected goal:</span>
          <span className={`text-sm font-semibold px-2 py-0.5 rounded-md ${
            autoGoal === "Weight Loss" ? "bg-orange-100 text-orange-600" :
            autoGoal === "Muscle Gain" ? "bg-blue-100 text-blue-600" :
            "bg-zinc-200 text-zinc-700"
          }`}>{autoGoal}</span>
          {weightDiff && !isNaN(weightDiff) && (
            <span className="text-xs text-zinc-500">
              {Math.abs(weightDiff).toFixed(1)}kg over {timelineWeeks} weeks
              = {(Math.abs(weightDiff) / parseInt(timelineWeeks)).toFixed(2)}kg/week
            </span>
          )}
        </div>

        <button onClick={generatePlan} disabled={loading}
          className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-medium py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50">
          {loading ? "Generating your plan..." : <><Zap size={18} /> Generate 7-Day Plan</>}
        </button>

        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-600 border border-red-100 rounded-xl p-4 text-sm">
            <XCircle size={16} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}
      </div>

      {loading && (
        <div className="space-y-6 animate-pulse">
          <div className="bg-white border border-zinc-200 rounded-2xl p-6 h-32" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-zinc-200 rounded-2xl p-5 h-48" />
            ))}
          </div>
        </div>
      )}

      {/* Generated plan */}
      {!loading && plan && plan.days && (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
          {/* Summary */}
          <div className="bg-white shadow-sm border border-zinc-200 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center border border-orange-100">
                <Utensils size={18} className="text-orange-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900 tracking-tight">Your 7-Day Plan</h2>
                <p className="text-xs text-zinc-500">Goal: {goal}</p>
              </div>
            </div>
            
            <p className="text-zinc-600 text-sm leading-relaxed">{plan.summary}</p>
            
            <div className="flex gap-4 mt-5">
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex-1">
                <p className="text-xs font-medium text-zinc-500 mb-1">Target Calories</p>
                <p className="text-xl font-bold text-orange-600">{plan.daily_target_calories} <span className="text-sm font-normal text-zinc-500">kcal/day</span></p>
              </div>
              <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 flex-1">
                <p className="text-xs font-medium text-zinc-500 mb-1">Target Protein</p>
                <p className="text-xl font-bold text-orange-600">{plan.daily_target_protein} <span className="text-sm font-normal text-zinc-500">g/day</span></p>
              </div>
            </div>
          </div>

          {/* Days */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plan.days?.map((day: any, i: number) => (
              <div key={i} className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
                <h3 className="text-md font-bold text-zinc-900 mb-4 border-b border-zinc-100 pb-2">{day.day}</h3>
                <div className="space-y-4">
                  {day.meals?.map((meal: any, j: number) => (
                    <div key={j} className="flex flex-col">
                      <span className="text-[10px] font-bold text-orange-500 uppercase tracking-wider">{meal.type}</span>
                      <span className="text-zinc-900 font-medium text-sm mt-0.5 leading-snug">{meal.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-1">
                        🔥 {meal.calories} kcal · 🥩 {meal.protein}g pro
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Recommendations */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
              <h4 className="text-green-600 font-semibold mb-3 text-sm flex items-center gap-2"><CheckCircle size={14}/> Use from Pantry</h4>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                {plan.pantry_focus?.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
              <h4 className="text-blue-600 font-semibold mb-3 text-sm flex items-center gap-2"><ShoppingCart size={14}/> Shopping List</h4>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                {plan.shopping_list?.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
            <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl p-5">
              <h4 className="text-red-500 font-semibold mb-3 text-sm flex items-center gap-2"><XCircle size={14}/> Avoid/Limit</h4>
              <ul className="text-xs text-zinc-600 space-y-1.5 list-disc pl-4">
                {plan.avoid?.map((i: string, idx: number) => <li key={idx}>{i}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Past plans */}
      {pastPlans.length > 0 && (
        <div className="bg-white border border-zinc-200 shadow-sm rounded-2xl overflow-hidden">
          <button onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between p-5 text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 transition">
            <span className="flex items-center gap-2"><History size={14} /> Past Plans ({pastPlans.length})</span>
            <ChevronDown size={14} className={`transition-transform ${showHistory ? "rotate-180" : ""}`} />
          </button>
          {showHistory && (
            <div className="border-t border-zinc-100 divide-y divide-zinc-100">
              {pastPlans.map((p) => {
                let parsedPlan = p.plan_content;
                if (typeof parsedPlan === 'string') {
                  try {
                    parsedPlan = JSON.parse(parsedPlan);
                  } catch (e) {
                    // Ignore parsing errors for corrupted past plans
                  }
                }
                
                return (
                  <div key={p.id} className="p-5">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-zinc-800">{p.goal}</span>
                      <span className="text-xs text-zinc-500">{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-zinc-600 line-clamp-2">{typeof p.plan_content === 'string' ? p.plan_content.slice(0, 150) : JSON.stringify(p.plan_content).slice(0, 150)}...</p>
                    <button onClick={() => setPlan(parsedPlan)}
                      className="text-xs font-medium text-zinc-900 hover:text-zinc-600 mt-2 transition">
                      View full plan →
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
      {/* GAME: challenge system — "eat 5 fruits this week" */}
    </div>
  );
}
