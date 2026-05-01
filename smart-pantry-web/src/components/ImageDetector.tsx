"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Upload, Loader2, Aperture, Plus, Minus, Check, RotateCcw, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DetectedItem {
  id: string;         // detection_history row id
  item_name: string;
  confidence: number;
  estimated_count: number;
  quantity: number;   // user-editable
}

interface ImageDetectorProps {
  onClose: () => void;
}

export function ImageDetector({ onClose }: ImageDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  // null = camera view; array = results view
  const [results, setResults] = useState<DetectedItem[] | null>(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => {
          if (e.name !== "AbortError") console.error("Video play error:", e);
        });
        setStreamReady(true);
      }
    } catch (err) {
      console.error("Failed to start camera:", err);
      toast.error("Could not access camera. You can still upload an image.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [startCamera]);

  // ── Call AI detection API ──────────────────────────────────────────────────
  const processImageBase64 = async (base64Data: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/detect-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data }),
      });
      if (!res.ok) throw new Error("Failed to analyse image");

      const data = await res.json();
      if (!data.items || data.items.length === 0) {
        toast.info("No food items detected in this image.");
        setAnalyzing(false);
        return;
      }

      // Build editable results list — seed quantity from AI estimated_count
      const items: DetectedItem[] = data.items.map((item: any) => ({
        id: item.id,
        item_name: item.item_name,
        confidence: item.confidence ?? 0.9,
        estimated_count: item.quantity ?? 1,
        quantity: item.quantity ?? 1,
      }));

      setResults(items);
    } catch (err) {
      console.error(err);
      toast.error("Error analysing image");
    } finally {
      setAnalyzing(false);
    }
  };

  // ── Snap from camera ──────────────────────────────────────────────────────
  const handleSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0);
    processImageBase64(canvas.toDataURL("image/jpeg", 0.8));
  };

  // ── Upload from gallery ───────────────────────────────────────────────────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === "string") processImageBase64(result);
    };
    reader.readAsDataURL(file);
  };

  // ── Quantity helpers ──────────────────────────────────────────────────────
  const updateQty = (id: string, delta: number) => {
    setResults((prev) =>
      prev?.map((it) =>
        it.id === id ? { ...it, quantity: Math.max(1, it.quantity + delta) } : it
      ) ?? null
    );
  };

  const removeItem = (id: string) => {
    setResults((prev) => {
      const next = (prev ?? []).filter((it) => it.id !== id);
      if (next.length === 0) {
        toast.info("All items removed");
        onClose();
        return null;
      }
      return next;
    });
  };

  // ── Confirm all items ─────────────────────────────────────────────────────
  const handleConfirm = async () => {
    if (!results || results.length === 0) return;

    // Build quantities map keyed by item name for API
    const quantities: Record<string, number> = {};
    results.forEach((it) => {
      quantities[it.item_name] = it.quantity;
    });

    // Update each detection_history row's quantity via confirm endpoint
    try {
      await Promise.all(
        results.map((item) =>
          fetch("/api/detection/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              detection_id: item.id,
              action: "added",
              storage_type: "fridge",
              quantity: item.quantity,
            }),
          })
        )
      );
      toast.success(`Added ${results.length} item${results.length > 1 ? "s" : ""} to pantry!`);
      onClose();
    } catch {
      toast.error("Failed to confirm items");
    }
  };

  const handleRetake = () => {
    setResults(null);
    startCamera();
  };

  // ────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white"
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800 shrink-0">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Camera size={20} />
            {results ? "Review Detected Items" : "Detect Items"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* ── Body ── */}
        {results ? (
          /* ─── Results view ─────────────────────────────────────────────── */
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <p className="text-sm text-zinc-400 text-center mb-2">
                Adjust quantities before adding to your pantry
              </p>
              {results.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 bg-zinc-800 rounded-xl p-3"
                >
                  {/* Item info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold capitalize text-sm truncate">{item.item_name}</p>
                    <p className="text-xs text-zinc-500">
                      {Math.round(item.confidence * 100)}% confidence
                    </p>
                  </div>

                  {/* Quantity stepper */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQty(item.id, -1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-zinc-600 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-6 text-center font-bold tabular-nums">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.id, +1)}
                      className="w-8 h-8 flex items-center justify-center rounded-full bg-zinc-700 hover:bg-zinc-600 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition"
                    title="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Action bar */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800 flex gap-3 pb-safe shrink-0">
              <Button
                variant="outline"
                onClick={handleRetake}
                className="flex-1 border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
              >
                <RotateCcw size={16} className="mr-2" />
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                className="flex-1 bg-white text-zinc-900 hover:bg-zinc-200 font-semibold"
              >
                <Check size={16} className="mr-2" />
                Add {results.length} Item{results.length > 1 ? "s" : ""}
              </Button>
            </div>
          </div>
        ) : (
          /* ─── Camera view ──────────────────────────────────────────────── */
          <>
            <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
              {analyzing ? (
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-zinc-400" size={48} />
                  <p className="text-zinc-300 font-medium animate-pulse">Analysing image with AI...</p>
                </div>
              ) : (
                <video ref={videoRef} playsInline className="w-full h-full object-cover" />
              )}

              {!streamReady && !analyzing && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="animate-spin text-zinc-500" size={32} />
                    <p className="text-zinc-500 text-sm">Starting camera...</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 bg-zinc-900 pb-safe border-t border-zinc-800 shrink-0">
              <div className="flex items-center justify-center gap-6 max-w-sm mx-auto">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-14 w-14 rounded-full border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-white"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={analyzing}
                >
                  <Upload size={24} />
                </Button>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />

                <Button
                  size="icon"
                  className="h-20 w-20 rounded-full bg-white hover:bg-zinc-200 text-black border-4 border-zinc-700 shadow-lg shadow-black/50"
                  onClick={handleSnap}
                  disabled={!streamReady || analyzing}
                >
                  <Aperture size={32} />
                </Button>

                {/* Balance spacer */}
                <div className="w-14" />
              </div>
              <p className="text-center text-zinc-500 mt-4 text-sm font-medium">
                Take a photo to identify your food
              </p>
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
