import { useState, useRef, useEffect, useCallback } from "react";
import { Camera, X, Upload, Loader2, Aperture } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageDetectorProps {
  onClose: () => void;
}

export function ImageDetector({ onClose }: ImageDetectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [analyzing, setAnalyzing] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((e) => {
          // AbortError is expected when component re-renders before play resolves
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
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const processImageBase64 = async (base64Data: string) => {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/detect-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64Data }),
      });
      if (!res.ok) {
        throw new Error("Failed to analyze image");
      }
      const data = await res.json();
      if (data.items && data.items.length > 0) {
        toast.success(`Detected ${data.items.length} items!`);
      } else {
        toast.info("No food items detected in this image.");
      }
      onClose(); // Dashboard will handle pending detections
    } catch (err) {
      console.error(err);
      toast.error("Error analyzing image");
      setAnalyzing(false);
    }
  };

  const handleSnap = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    // Convert to jpeg to save bandwidth
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    processImageBase64(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") {
        processImageBase64(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: "100%" }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-50 flex flex-col bg-zinc-950 text-white"
      >
        <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Camera size={20} /> Detect Items
          </h2>
          <button onClick={onClose} className="p-2 bg-zinc-800 rounded-full hover:bg-zinc-700 transition">
            <X size={20} />
          </button>
        </div>

        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {analyzing ? (
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="animate-spin text-zinc-400" size={48} />
              <p className="text-zinc-300 font-medium animate-pulse">Analyzing image with AI...</p>
            </div>
          ) : (
            <video
              ref={videoRef}
              playsInline
              className="w-full h-full object-cover"
            />
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

        <div className="p-6 bg-zinc-900 pb-safe border-t border-zinc-800">
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
              variant="default"
              size="icon"
              className="h-20 w-20 rounded-full bg-white hover:bg-zinc-200 text-black border-4 border-zinc-700 shadow-lg shadow-black/50"
              onClick={handleSnap}
              disabled={!streamReady || analyzing}
            >
              <Aperture size={32} />
            </Button>
            
            {/* Empty placeholder to balance layout horizontally */}
            <div className="w-14" />
          </div>
          <p className="text-center text-zinc-500 mt-6 text-sm font-medium">
            Take a photo to identify your food
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
