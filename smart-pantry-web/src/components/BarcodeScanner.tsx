"use client";

/**
 * ProductScanner — full-screen camera overlay for taking a photo of products.
 *
 * It takes a frame from the camera, sends it to /api/scan-product,
 * and the dashboard automatically picks up the result via Supabase realtime.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { X, Camera, Loader2 } from "lucide-react";

type ScanState = "idle" | "capturing" | "error";

type Props = {
  // We no longer return the item to the caller because it goes straight to the DB
  onClose: () => void;
};

function ProductScannerInner({ onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  const captureAndScan = async () => {
    if (scanState === "capturing") return;
    const video = videoRef.current;
    if (!video) return;

    setScanState("capturing");
    
    // Haptic feedback
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(50);
    }

    try {
      // Draw video frame to canvas
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Could not get canvas context");
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageBase64 = canvas.toDataURL("image/jpeg", 0.8);

      const res = await fetch("/api/scan-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to scan product");
      }

      // Success! The API has added the pending items to detection_history
      // The dashboard will pick them up automatically.
      onClose();
    } catch (err: any) {
      console.error("Scan error:", err);
      setScanState("error");
      setErrorMsg(err.message || "Something went wrong scanning the product. Try again.");
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
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pt-4 z-10">
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
          >
            <X size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Camera size={13} className="text-white/70" />
            <span className="text-white/80 text-xs font-medium">Product Scanner</span>
          </div>
        </div>
        
        {scanState === "error" && (
           <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-20">
             <div className="bg-white rounded-2xl p-6 m-4 max-w-sm text-center">
               <p className="text-zinc-800 font-medium mb-4">{errorMsg}</p>
               <button 
                 onClick={() => setScanState("idle")}
                 className="bg-zinc-900 text-white px-6 py-2 rounded-lg font-medium"
               >
                 Try Again
               </button>
             </div>
           </div>
        )}
        
        {scanState === "capturing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm z-20">
             <Loader2 size={40} className="text-white animate-spin mb-4" />
             <p className="text-white font-medium">Identifying products...</p>
          </div>
        )}
      </div>

      {/* Bottom panel */}
      <div className="bg-black pb-8 pt-6 px-6 pb-safe flex flex-col items-center justify-center">
        <button
          onClick={captureAndScan}
          disabled={scanState === "capturing"}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center focus:outline-none focus:scale-95 transition-transform disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-white rounded-full" />
        </button>
        <p className="text-white/60 mt-4 text-sm font-medium">
          Take a photo of the products
        </p>
      </div>
    </div>
  );
}

// Dynamic export with ssr:false
export const BarcodeScanner = dynamic(
  () => Promise.resolve(ProductScannerInner),
  { ssr: false }
);
