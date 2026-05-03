"use client";

/**
 * ProductScanner — full-screen camera overlay for taking a photo of products.
 *
 * It takes a frame from the camera, sends it to /api/scan-product,
 * and the dashboard automatically picks up the result via Supabase realtime.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Camera, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ScanState = 
  | "idle" 
  | "capturing" 
  | "product_found" 
  | "expiry_capture" 
  | "expiry_processing" 
  | "error";

type Props = {
  onClose: () => void;
  onProductScanned?: (data: {
    items: any[];
    expiryDate?: string;
  }) => void;
};

function ProductScannerInner({ onClose, onProductScanned }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [detectedProduct, setDetectedProduct] = useState<{ name: string; category: string; items: any[] } | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current!;
        video.srcObject = stream;
        video.setAttribute("playsinline", "true");
        await video.play();
      } catch (e) {
        if (cancelled) return;
        console.error("Camera access error:", e);
        setScanState("error");
        setErrorMsg("Camera access denied or not available. Please allow camera access and try again.");
      }
    }

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const captureFrameAsBase64 = (): string | null => {
    const video = videoRef.current;
    if (!video) return null;
    
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.8);
  };

  const handleProductScan = async () => {
    if (scanState === "capturing") return;
    const imageBase64 = captureFrameAsBase64();
    if (!imageBase64) return;

    setScanState("capturing");
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);

    try {
      const res = await fetch("/api/identify-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to identify product");
      }

      const data = await res.json();
      const firstItem = data.items?.[0];
      
      if (!firstItem) {
        throw new Error("No products detected in image.");
      }

      setDetectedProduct({
        name: firstItem.item_name,
        category: firstItem.category,
        items: data.items,
      });
      setScanState("product_found");
      
    } catch (err: any) {
      console.error("Scan error:", err);
      setScanState("error");
      setErrorMsg(err.message || "Something went wrong scanning the product. Try again.");
    }
  };

  const handleExpiryScan = async () => {
    if (scanState === "expiry_processing") return;
    const imageBase64 = captureFrameAsBase64();
    if (!imageBase64) return;

    setScanState("expiry_processing");
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(50);

    try {
      const res = await fetch("/api/detect-expiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          imageBase64,
          category: detectedProduct?.category
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to scan expiry date");
      }

      const data = await res.json();
      
      if (data.expiry_date) {
        toast.success(`Expiry date detected: ${data.expiry_date}`);
        onProductScanned?.({
          items: detectedProduct?.items ?? [],
          expiryDate: data.expiry_date
        });
      } else {
        throw new Error("Could not detect a valid expiry date");
      }
      onClose();
    } catch (err: any) {
      console.error("Expiry Scan error:", err);
      // Even if expiry fails, we still return the product
      toast.error(err.message || "Failed to scan date. You can add it manually.");
      onProductScanned?.({ items: detectedProduct?.items ?? [] });
      onClose();
    }
  };

  const handleSkipExpiry = () => {
    onProductScanned?.({ items: detectedProduct?.items ?? [] });
    onClose();
  };

  const handleAIEstimate = async () => {
    if (scanState === "expiry_processing") return;
    setScanState("expiry_processing");
    try {
      const res = await fetch("/api/detect-expiry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          estimateOnly: true,
          category: detectedProduct?.category
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to estimate expiry date");
      }

      const data = await res.json();
      if (data.expiry_date) {
        toast.success(`Estimated expiry: ${data.expiry_date}`);
        onProductScanned?.({
          items: detectedProduct?.items ?? [],
          expiryDate: data.expiry_date
        });
      } else {
        throw new Error("Could not estimate expiry date");
      }
      onClose();
    } catch (err: any) {
      console.error("AI Estimate error:", err);
      toast.error(err.message || "Failed to estimate date.");
      onProductScanned?.({ items: detectedProduct?.items ?? [] });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Camera viewport */}
      <div className="relative flex-1 overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pt-4 z-30">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
          >
            <X size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Camera size={13} className="text-white/70" />
            <span className="text-white/80 text-xs font-medium">
              {scanState === "expiry_capture" || scanState === "expiry_processing" ? "Expiry Scanner" : "Product Scanner"}
            </span>
          </div>
        </div>
        
        {/* Overlays */}
        {scanState === "error" && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
             <div className="bg-white rounded-2xl p-6 m-4 max-w-sm text-center">
               <p className="text-zinc-800 font-medium mb-4">{errorMsg}</p>
               <Button 
                 onClick={() => setScanState("idle")}
                 className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-medium"
               >
                 Try Again
               </Button>
             </div>
           </div>
        )}
        
        {(scanState === "capturing" || scanState === "expiry_processing") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
             <Loader2 size={40} className="text-white animate-spin mb-4" />
             <p className="text-white font-medium">
               {scanState === "capturing" ? "Identifying product..." : "Reading expiry date..."}
             </p>
          </div>
        )}

        {scanState === "product_found" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm z-20">
            <div className="bg-white rounded-2xl p-6 m-4 w-full max-w-sm text-center space-y-4 shadow-xl">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={24} className="text-emerald-600" />
              </div>
              <p className="text-zinc-800 font-semibold text-lg">
                Found: {detectedProduct?.name}
              </p>
              <p className="text-zinc-500 text-sm">
                Want to capture the expiry/best-before date printed on the packaging?
              </p>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => setScanState("expiry_capture")} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white">
                  📸 Capture Expiry
                </Button>
                <div className="flex gap-2">
                  <Button onClick={handleAIEstimate} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">
                    🤖 AI Estimate
                  </Button>
                  <Button variant="outline" onClick={handleSkipExpiry} className="flex-1 border-zinc-200">
                    Skip
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {scanState === "expiry_capture" && (
          <>
            <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
              <div className="w-64 h-24 border-2 border-dashed border-white/60 rounded-xl" />
            </div>
            <p className="absolute bottom-32 left-0 right-0 text-center text-white/90 text-sm font-medium z-10 drop-shadow-md">
              Aim at the expiry / best-before date
            </p>
          </>
        )}
      </div>

      {/* Bottom panel */}
      {(scanState === "idle" || scanState === "capturing" || scanState === "expiry_capture" || scanState === "expiry_processing") && (
        <div className="bg-black pb-8 pt-6 px-6 pb-safe flex flex-col items-center justify-center">
          <button
            onClick={scanState === "idle" ? handleProductScan : handleExpiryScan}
            disabled={scanState === "capturing" || scanState === "expiry_processing"}
            className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none focus:scale-95 transition-transform disabled:opacity-50"
          >
            <div className="w-16 h-16 bg-white rounded-full" />
          </button>
          <p className="text-white/60 mt-4 text-sm font-medium">
            {scanState === "expiry_capture" ? "Take a photo of the expiry date" : "Take a photo of the product"}
          </p>
        </div>
      )}
    </div>
  );
}

// Dynamic export with ssr:false
export const BarcodeScanner = dynamic(
  () => Promise.resolve(ProductScannerInner),
  { ssr: false }
);
