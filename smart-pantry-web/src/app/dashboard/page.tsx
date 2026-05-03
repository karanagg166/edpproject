"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useUser } from "@/lib/UserContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Camera, Mail } from "lucide-react";
import { CATEGORIES, CATEGORY_EMOJI } from "./constants";
import PantryTable from "@/components/dashboard/PantryTable";
import AddItemModal from "@/components/dashboard/AddItemModal";
import LiveDetections from "@/components/dashboard/LiveDetections";
import ExpiringSoon from "@/components/dashboard/ExpiringSoon";
import DetectionPopup, { DetectionEvent } from "@/components/dashboard/DetectionPopup";
import { AddProductFlow } from "@/components/AddProductFlow";
import { ScanFAB } from "@/components/ScanFAB";
import { ImageDetector } from "@/components/ImageDetector";
import { StaggerContainer, StaggerItem } from "@/components/ui/animations";
import { motion } from "framer-motion";
import EmailReportModal from "@/components/dashboard/EmailReportModal";

const MotionButton = motion.create(Button);

export default function PantryPage() {
  const { activeUserId, loading: userLoading, user } = useUser();
  const supabase = useRef(createSupabaseBrowser()).current;
  const hasFetchedRef = useRef(false);

  const [pantry, setPantry] = useState<any[]>([]);
  const [detections, setDetections] = useState<any[]>([]);
  const [pendingDetections, setPendingDetections] = useState<DetectionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showScanFlow, setShowScanFlow] = useState(false);
  const [showImageDetector, setShowImageDetector] = useState(false);
  const [showEmailReport, setShowEmailReport] = useState(false);
  const [addForm, setAddForm] = useState<{
    name: string;
    category: string;
    quantity: number;
    expiry_date: string;
    storage_type: string;
    barcode?: string;
    brand?: string;
  }>({
    name: "",
    category: "fruits",
    quantity: 1,
    expiry_date: "",
    storage_type: "fridge",
  });

  // Called by AddProductFlow when a product is confirmed (scanned or manual)
  const handleProductReady = (product: { name: string; brand?: string; barcode?: string }) => {
    setAddForm((f) => ({
      ...f,
      name: product.name,
      brand: product.brand ?? "",
      barcode: product.barcode ?? "",
    }));
    setShowScanFlow(false);
    setShowAddModal(true);
  };

  const fetchData = useCallback(async () => {
    if (!activeUserId) return;

    setLoading(true);

    // ✅ Hard timeout — force loading off after 5s no matter what
    const loadingTimeout = setTimeout(() => {
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
        // Dedup by ID in case API or realtime race produces duplicates
        const seen = new Set<string>();
        const uniquePantry = (pantryData as any[]).filter((item) => {
          if (seen.has(item.id)) return false;
          seen.add(item.id);
          return true;
        });
        setPantry(uniquePantry);
      } else {
        console.error("❌ /api/pantry failed:", pantryRes.status);
      }

      if (detRes.ok) {
        const detData = await detRes.json();
        const seenDet = new Set<string>();
        const uniqueDet = (detData as any[]).filter((d) => {
          if (seenDet.has(d.id)) return false;
          seenDet.add(d.id);
          return true;
        });
        setDetections(uniqueDet);
      }

      try {
        const { data, error } = await supabase
          .from("detection_history")
          .select("*")
          .eq("user_id", activeUserId)
          .eq("status", "pending")
          .order("detected_at", { ascending: true });

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
    }
  }, [activeUserId, supabase]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  // ── Initial fetch + auto-retry every 2s until fetch completes ──
  useEffect(() => {
    if (userLoading) {
      return;
    }

    if (!activeUserId) {
      setLoading(false);
      return;
    }

    hasFetchedRef.current = false;
    fetchDataRef.current();

    const interval = setInterval(() => {
      if (!hasFetchedRef.current) {
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

    const pantryChannel = supabase
      .channel(`pantry-${activeUserId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pantry", filter: `user_id=eq.${activeUserId}` },
        (payload: any) => {
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
      .subscribe();

    const detChannel = supabase
      .channel(`det-${activeUserId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "detection_history", filter: `user_id=eq.${activeUserId}` },
        (payload: any) => {
          // Don't show manual consumption entries in the live feed or detection popup
          if (payload.new.detection_type === "manual") return;
          
          setDetections((prev) => {
            if (prev.some((d) => d.id === payload.new.id)) return prev;
            return [payload.new, ...prev].slice(0, 6);
          });
          
          if (payload.new.status === "pending") {
            setPendingDetections((prev) => {
              if (prev.some((d) => d.id === payload.new.id)) return prev;
              return [...prev, payload.new];
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pantryChannel);
      supabase.removeChannel(detChannel);
    };
  }, [activeUserId, supabase]);

  // ── Delete ──
  const handleDelete = async (item: any, quantityToRemove?: number) => {
    try {
      const url = quantityToRemove
        ? `/api/pantry?id=${item.id}&quantity=${quantityToRemove}`
        : `/api/pantry?id=${item.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Delete failed:", err);
        toast.error(`❌ Failed to delete: ${err.error || "Unknown error"}`);
      } else {
        const data = await res.json();
        if (data.action === "updated" && data.item) {
          setPantry((prev) => prev.map((i) => i.id === item.id ? data.item : i));
          toast(`🗑️ Removed ${quantityToRemove} ${item.unit || ""} of ${item.name}`);
        } else {
          setPantry((prev) => prev.filter((i) => i.id !== item.id));
          toast(`🗑️ ${item.name} removed from pantry`);
        }
      }
    } catch (err) {
      console.error("💥 handleDelete exception:", err);
      toast.error("❌ Unexpected error deleting item");
    }
  };

  const handleDetectionConfirm = async (
    detectionId: string,
    action: "added" | "removed" | "dismissed",
    storageType?: "room" | "fridge" | "freezer",
    quantity?: number
  ) => {
    try {
      const res = await fetch("/api/detection/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ detection_id: detectionId, action, storage_type: storageType, quantity }),
      });
      if (res.ok) {
        const data = await res.json();
        if (action === "added" && data.pantryItem) {
          setPantry((p) => {
            if (p.some((i) => i.id === data.pantryItem.id)) {
              return p.map((i) => (i.id === data.pantryItem.id ? data.pantryItem : i));
            }
            return [...p, data.pantryItem];
          });
        }
      }
    } catch (err) {
      console.error("💥 handleDetectionConfirm exception:", err);
    }
    setPendingDetections((prev) => prev.filter((d) => d.id !== detectionId));
    if (action === "added") toast.success(`✅ Item added to pantry`);
    else if (action === "removed") toast(`🗑️ Item removed from pantry`);
  };

  const handleConsume = async (item: any, quantityToConsume: number = 1) => {
    const serving = item.serving_size_g || 100;
    const factor = (serving / 100) * quantityToConsume;
    const hour = new Date().getHours();
    let meal_type = "snack";
    if (hour >= 5 && hour < 11) meal_type = "breakfast";
    else if (hour >= 11 && hour < 15) meal_type = "lunch";
    else if (hour >= 17 && hour < 22) meal_type = "dinner";

    try {
      const res = await fetch("/api/nutrition/consumed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_name: item.name,
          quantity: quantityToConsume,
          calories: (item.calories_per_100g || 0) * factor,
          protein: (item.protein_per_100g || 0) * factor,
          carbs: (item.carbs_per_100g || 0) * factor,
          fat: (item.fat_per_100g || 0) * factor,
          meal_type,
        }),
      });
      
      if (!res.ok) throw new Error("Failed to log consumption");
      
      toast.success(`🍽️ Logged consumption of ${quantityToConsume} ${item.unit || ""} ${item.name}`);
      
      // Reduce the item in the pantry
      await handleDelete(item, quantityToConsume);
    } catch (err) {
      console.error("💥 handleConsume exception:", err);
      toast.error("❌ Failed to log consumption");
    }
  };

  // ── Add ──
  const handleAdd = async () => {
    if (submitting) return;
    if (!addForm.name.trim()) {
      toast.error("❌ Please enter an item name");
      return;
    }
    if (!activeUserId) {
      toast.error("❌ Not logged in. Please refresh and log in again.");
      return;
    }

    setSubmitting(true);
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

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        console.error("❌ Add item failed:", err);
        toast.error(`❌ Failed to add item: ${err.error || "Unknown error"}`);
        return;
      }

      const data = await res.json();
      setPantry((prev) => {
        if (prev.some((i) => i.id === data.id)) return prev;
        return [...prev, data];
      });
      toast.success(`✅ ${addForm.name} added to pantry`);
      setShowAddModal(false);
      setAddForm({ name: "", category: "fruits", quantity: 1, expiry_date: "", storage_type: "fridge" });
    } catch (err) {
      console.error("💥 handleAdd exception:", err);
      toast.error("❌ Unexpected error adding item");
    } finally {
      setSubmitting(false);
    }
  };

  // Dedup pantry by ID at render time as a safety net
  const dedupedPantry = Array.from(
    new Map(pantry.map((item) => [item.id, item])).values()
  );

  const filtered = dedupedPantry.filter((item) => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "All" || (item.category || "other") === category;
    return matchSearch && matchCat;
  });

  return (
    <StaggerContainer className="max-w-6xl mx-auto space-y-6">
      <StaggerItem className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Pantry</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {dedupedPantry.length} items · Real-time sync active <span className="text-green-500">●</span>
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <MotionButton variant="outline" size="icon" onClick={() => fetchDataRef.current()} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <RefreshCw size={16} />
          </MotionButton>
          <MotionButton
            variant="outline"
            onClick={() => setShowEmailReport(true)}
            className="gap-2"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Mail size={16} /> Email Report
          </MotionButton>
          {showScanFlow ? (
            <AddProductFlow onProductReady={handleProductReady} />
          ) : (
            <>
              <MotionButton
                id="open-scan-flow-btn"
                variant="outline"
                onClick={() => setShowScanFlow(true)}
                className="gap-2"
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                Scan Barcode
              </MotionButton>
              <MotionButton
                variant="outline"
                onClick={() => setShowImageDetector(true)}
                className="gap-2"
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }}
              >
                <Camera size={16} /> Detect Items
              </MotionButton>
              <MotionButton id="open-add-modal-btn" onClick={() => setShowAddModal(true)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Plus size={16} className="mr-2" /> Add Item
              </MotionButton>
            </>
          )}
        </div>
      </StaggerItem>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StaggerItem className="lg:col-span-2 space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pantry..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            {CATEGORIES.map((cat) => (
              <Badge
                key={cat}
                variant={category === cat ? "default" : "secondary"}
                className="cursor-pointer px-3 py-1 text-sm font-medium"
                onClick={() => setCategory(cat)}
              >
                {CATEGORY_EMOJI[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1).replace("_", " ")}
              </Badge>
            ))}
          </div>

          <PantryTable loading={loading} pantry={dedupedPantry} filtered={filtered} handleDelete={handleDelete} handleConsume={handleConsume} />
        </StaggerItem>

        <StaggerItem className="space-y-4">
          <LiveDetections detections={detections} />
          <ExpiringSoon pantry={dedupedPantry} />
        </StaggerItem>
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

      {showEmailReport && (
        <EmailReportModal
          onClose={() => setShowEmailReport(false)}
          userEmail={user?.email}
        />
      )}

      {/* FAB for Mobile */}
      {!showScanFlow && !showImageDetector && (
        <ScanFAB onClick={() => setShowScanFlow(true)} />
      )}

      {showImageDetector && (
        <ImageDetector onClose={() => setShowImageDetector(false)} />
      )}
    </StaggerContainer>
  );
}