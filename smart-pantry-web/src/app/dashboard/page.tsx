"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { ToastContainer, ToastData } from "@/components/Toast";
import { Search, Plus, RefreshCw } from "lucide-react";
import { CATEGORIES, CATEGORY_EMOJI } from "./constants";
import PantryTable from "@/components/dashboard/PantryTable";
import AddItemModal from "@/components/dashboard/AddItemModal";
import LiveDetections from "@/components/dashboard/LiveDetections";
import ExpiringSoon from "@/components/dashboard/ExpiringSoon";
import DetectionPopup, { DetectionEvent } from "@/components/dashboard/DetectionPopup";

export default function PantryPage() {
  const { activeUserId, loading: userLoading } = useUser();
  const supabase = useRef(createSupabaseBrowser()).current;
  const hasFetchedRef = useRef(false);

  const [pantry, setPantry] = useState<any[]>([]);
  const [detections, setDetections] = useState<any[]>([]);
  const [pendingDetections, setPendingDetections] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "fruits",
    quantity: 1,
    expiry_date: "",
    storage_type: "fridge",
  });

  console.log("🧩 PantryPage render — activeUserId:", activeUserId, "userLoading:", userLoading, "pantryLoading:", loading);

  const addToast = useCallback((type: ToastData["type"], message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const fetchData = useCallback(async () => {
    console.log("🔄 fetchData called, activeUserId:", activeUserId);
    if (!activeUserId) return;

    setLoading(true);

    // ✅ Hard timeout — force loading off after 5s no matter what
    const loadingTimeout = setTimeout(() => {
      console.warn("⏰ fetchData timed out — forcing loading off");
      setLoading(false);
      hasFetchedRef.current = true;
    }, 5000);

    try {
      const [pantryRes, detRes] = await Promise.all([
        fetch("/api/pantry"),
        fetch("/api/detections"),
      ]);

      if (pantryRes.ok) {
        const pantryData = await pantryRes.json();
        console.log("✅ Pantry data:", pantryData.length, "items");
        setPantry(pantryData);
      } else {
        console.error("❌ /api/pantry failed:", pantryRes.status);
      }

      if (detRes.ok) {
        const detData = await detRes.json();
        setDetections(detData);
      }

      try {
        const { data, error } = await supabase
          .from("detection_history")
          .select("*")
          .eq("user_id", activeUserId)
          .eq("status", "pending")
          .order("detected_at", { ascending: false });

        if (!error) setPendingDetections(data ?? []);
      } catch (e) {
        console.error("❌ pending detections failed:", e);
      }

    } catch (err) {
      console.error("💥 fetchData exception:", err);
    } finally {
      clearTimeout(loadingTimeout); // ✅ cancel timeout if fetch completed normally
      setLoading(false);
      hasFetchedRef.current = true;
      console.log("🏁 fetchData complete");
    }
  }, [activeUserId, supabase]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // ── Initial fetch + auto-retry every 2s until fetch completes ──
  useEffect(() => {
    if (userLoading) {
      console.log("⏳ Waiting for UserContext to load...");
      return;
    }

    if (!activeUserId) {
      console.warn("⚠️ No activeUserId after context loaded");
      setLoading(false);
      return;
    }

    console.log("✅ UserContext ready, fetching for:", activeUserId);
    hasFetchedRef.current = false;
    fetchDataRef.current();

    const interval = setInterval(() => {
      if (!hasFetchedRef.current) {
        console.log("🔁 Retrying fetch...");
        fetchDataRef.current();
      } else {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [activeUserId, userLoading]);

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!activeUserId) return;

    console.log("📡 Setting up realtime subscriptions for user:", activeUserId);

    const pantryChannel = supabase
      .channel(`pantry-${activeUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pantry", filter: `user_id=eq.${activeUserId}` },
        (payload: any) => {
          console.log("🔔 Realtime pantry event:", payload.eventType, payload);
          if (payload.eventType === "INSERT") {
            setPantry((p) => {
              if (p.some((i) => i.id === payload.new.id)) return p;
              return [...p, payload.new];
            });
          }
          if (payload.eventType === "UPDATE")
            setPantry((p) => p.map((i) => (i.id === payload.new.id ? payload.new : i)));
          if (payload.eventType === "DELETE")
            setPantry((p) => p.filter((i) => i.id !== payload.old.id));
        }
      )
      .subscribe((status: any) => {
        console.log("📡 Pantry channel status:", status);
      });

    const detChannel = supabase
      .channel(`det-${activeUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "detection_history", filter: `user_id=eq.${activeUserId}` },
        (payload: any) => {
          console.log("🔔 Realtime detection event:", payload);
          setDetections((prev) => [payload.new, ...prev].slice(0, 6));
          if (payload.new.status === "pending") {
            setPendingDetections((prev) => [...prev, payload.new]);
          }
        }
      )
      .subscribe((status: any) => {
        console.log("📡 Detections channel status:", status);
      });

    return () => {
      console.log("🔌 Removing realtime channels");
      supabase.removeChannel(pantryChannel);
      supabase.removeChannel(detChannel);
    };
  }, [activeUserId, supabase]);

  // ── Delete ──
  const handleDelete = async (item: any, quantityToRemove?: number) => {
    console.log("🗑️ Deleting item:", item.id, item.name, "qty:", quantityToRemove);
    try {
      const url = quantityToRemove
        ? `/api/pantry?id=${item.id}&quantity=${quantityToRemove}`
        : `/api/pantry?id=${item.id}`;
      const res = await fetch(url, { method: "DELETE" });
      console.log("🗑️ Delete response status:", res.status);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Delete failed:", err);
        addToast("removed", `❌ Failed to delete: ${err.error || "Unknown error"}`);
      } else {
        const data = await res.json();
        if (data.action === "updated" && data.item) {
          setPantry((prev) => prev.map((i) => i.id === item.id ? data.item : i));
          addToast("removed", `🗑️ Removed ${quantityToRemove} ${item.unit || ""} of ${item.name}`);
        } else {
          setPantry((prev) => prev.filter((i) => i.id !== item.id));
          addToast("removed", `🗑️ ${item.name} removed from pantry`);
        }
      }
    } catch (err) {
      console.error("💥 handleDelete exception:", err);
      addToast("removed", "❌ Unexpected error deleting item");
    }
  };

  const handleDetectionConfirm = async (
    detectionId: string,
    action: "added" | "removed" | "dismissed",
    storageType?: "room" | "fridge" | "freezer"
  ) => {
    console.log("✅ Confirming detection:", detectionId, "action:", action);
    try {
      const res = await fetch("/api/detection/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detection_id: detectionId, action, storage_type: storageType }),
      });
      console.log("✅ Confirm response status:", res.status);
      if (res.ok) {
        const data = await res.json();
        console.log("✅ Confirm response data:", data);
        if (action === "added" && data.pantryItem) {
          setPantry((p) => {
            const existing = p.find((i) => i.id === data.pantryItem.id);
            if (existing) return p.map((i) => (i.id === data.pantryItem.id ? data.pantryItem : i));
            return [...p, data.pantryItem];
          });
        }
      }
    } catch (err) {
      console.error("💥 handleDetectionConfirm exception:", err);
    }
    setPendingDetections((prev) => prev.filter((d) => d.id !== detectionId));
    if (action === "added") addToast("added", `✅ Item added to pantry`);
    else if (action === "removed") addToast("removed", `🗑️ Item removed from pantry`);
  };

  // ── Add ──
  const handleAdd = async () => {
    console.log("➕ Adding item:", addForm);
    if (!addForm.name.trim()) {
      addToast("removed", "❌ Please enter an item name");
      return;
    }
    if (!activeUserId) {
      console.error("❌ handleAdd: no activeUserId");
      addToast("removed", "❌ Not logged in. Please refresh and log in again.");
      return;
    }

    try {
      const res = await fetch("/api/pantry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          category: addForm.category,
          quantity: addForm.quantity,
          storage_type: addForm.storage_type,
          expiry_date: addForm.expiry_date || null,
        }),
      });

      console.log("➕ Add item response status:", res.status);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Add item failed:", err);
        addToast("removed", `❌ Failed to add item: ${err.error || "Unknown error"}`);
        return;
      }

      const data = await res.json();
      console.log("✅ Item added successfully:", data);
      setPantry((prev) => [...prev, data]);
      addToast("added", `✅ ${addForm.name} added to pantry`);
      setShowAddModal(false);
      setAddForm({ name: "", category: "fruits", quantity: 1, expiry_date: "", storage_type: "fridge" });
    } catch (err) {
      console.error("💥 handleAdd exception:", err);
      addToast("removed", "❌ Unexpected error adding item");
    }
  };

  const filtered = pantry.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (item.category || "other") === category;
    return matchSearch && matchCat;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Pantry</h1>
          <p className="text-slate-400 text-sm mt-1">
            {pantry.length} items · Real-time sync active <span className="text-emerald-400">●</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchDataRef.current()}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg shadow-emerald-900/30"
          >
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pantry..."
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white focus:border-emerald-500/50 outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${category === cat
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                  }`}
              >
                {CATEGORY_EMOJI[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
              </button>
            ))}
          </div>

          <PantryTable loading={loading} pantry={pantry} filtered={filtered} handleDelete={handleDelete} />
        </div>

        <div className="space-y-4">
          <LiveDetections detections={detections} />
          <ExpiringSoon pantry={pantry} />
        </div>
      </div>

      <AddItemModal
        showAddModal={showAddModal}
        setShowAddModal={setShowAddModal}
        addForm={addForm}
        setAddForm={setAddForm}
        handleAdd={handleAdd}
      />

      {pendingDetections.length > 0 && (
        <DetectionPopup pendingDetections={pendingDetections} onConfirm={handleDetectionConfirm} />
      )}
    </div>
  );
}