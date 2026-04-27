"use client";

/**
 * BarcodeScanner — full-screen camera overlay.
 *
 * Strategy:
 * 1. Uses the native BarcodeDetector API (Chrome 83+, Edge, Safari 17.2+)
 * 2. Falls back to ZXing-js/browser for unsupported browsers
 *
 * Accuracy improvements:
 * - Confidence debounce: fires onDetected only after same code detected 3× in a row
 * - Haptic feedback via navigator.vibrate on successful detection
 *
 * Must be used with dynamic import + ssr:false because it accesses `navigator`.
 */

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { X, Scan } from "lucide-react";

type ScanState = "scanning" | "detected" | "error";

type Props = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

/* ---------- global type for BarcodeDetector API ---------- */
interface DetectedBarcode {
  rawValue: string;
  format: string;
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
}

interface BarcodeDetectorInstance {
  detect: (source: ImageBitmapSource) => Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (opts?: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats: () => Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
}

function BarcodeScannerInner({ onDetected, onClose }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false);
  const lastCodeRef = useRef<string | null>(null);
  const confirmCountRef = useRef(0);
  const rafRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanState, setScanState] = useState<ScanState>("scanning");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [hint, setHint] = useState("Align barcode within the frame");
  const [signalStrength, setSignalStrength] = useState<"strong" | "weak" | null>(null);

  const handleDetected = useCallback(
    (code: string) => {
      firedRef.current = true;
      setScanState("detected");
      setLastDetected(code);
      setHint("Barcode found!");
      // Haptic feedback
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }
      // Short delay so user sees the "detected" state, then fire
      setTimeout(() => {
        onDetected(code);
      }, 300);
    },
    [onDetected]
  );

  /** Process a single barcode result through the debounce gate */
  const processResult = useCallback(
    (code: string) => {
      if (firedRef.current) return;

      setSignalStrength("strong");

      if (code === lastCodeRef.current) {
        confirmCountRef.current += 1;
        if (confirmCountRef.current >= 3) {
          handleDetected(code);
          confirmCountRef.current = 0;
        } else {
          setHint("Hold steady — confirming…");
        }
      } else {
        lastCodeRef.current = code;
        confirmCountRef.current = 1;
        setLastDetected(code);
        setHint("Hold steady — confirming…");
      }
    },
    [handleDetected]
  );

  useEffect(() => {
    let cancelled = false;

    async function startCamera(): Promise<MediaStream> {
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
        throw new Error("cancelled");
      }
      streamRef.current = stream;
      const video = videoRef.current!;
      video.srcObject = stream;
      video.setAttribute("playsinline", "true");
      await video.play();
      return stream;
    }

    /** Native BarcodeDetector scan loop */
    async function scanWithNative(detector: BarcodeDetectorInstance) {
      const video = videoRef.current!;

      async function tick() {
        if (cancelled || firedRef.current) return;
        try {
          const barcodes = await detector.detect(video);
          if (barcodes.length > 0 && barcodes[0].rawValue) {
            processResult(barcodes[0].rawValue);
          }
        } catch {
          // ignore transient detect errors
        }
        if (!cancelled && !firedRef.current) {
          rafRef.current = requestAnimationFrame(() => {
            // Use a small timeout to avoid hammering — ~10fps
            setTimeout(tick, 100);
          });
        }
      }
      tick();
    }

    /** ZXing fallback scan loop */
    async function scanWithZXing() {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const reader = new BrowserMultiFormatReader();
      const video = videoRef.current!;

      // Continuous decode using the callback-based API
      reader.decodeFromVideoElement(video, (result, err) => {
        if (cancelled || firedRef.current) return;
        if (result) {
          processResult(result.getText());
        }
        // err is expected when no barcode is in frame — ignore
      });

      // Store cleanup ref: on unmount, call reader.reset or stopContinuousDecode
      const origCleanup = streamRef.current;
      streamRef.current = origCleanup; // keep stream ref
    }

    async function init() {
      try {
        await startCamera();
        if (cancelled) return;

        // Prefer native BarcodeDetector
        if (typeof window !== "undefined" && window.BarcodeDetector) {
          try {
            const formats = await window.BarcodeDetector.getSupportedFormats();
            const desiredFormats = [
              "ean_13", "ean_8", "code_128", "code_39", "upc_a", "upc_e",
            ].filter((f) => formats.includes(f));

            if (desiredFormats.length > 0) {
              const detector = new window.BarcodeDetector({ formats: desiredFormats });
              await scanWithNative(detector);
              return;
            }
          } catch {
            // BarcodeDetector failed, fall through to ZXing
          }
        }

        // Fallback: ZXing
        await scanWithZXing();
      } catch (e) {
        if (cancelled) return;
        console.error("BarcodeScanner init error:", e);
        setScanState("error");
        setErrorMsg(
          "Camera access denied or not available. Please allow camera access and try again."
        );
      }
    }

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [processResult]);

  const isDetected = scanState === "detected";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Camera viewport */}
      <div className="relative flex-1 overflow-hidden" ref={containerRef}>
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          muted
          playsInline
          autoPlay
        />

        {/* Dim overlay — top strip */}
        <div className="absolute top-0 left-0 right-0 h-[30%] bg-black/50 pointer-events-none" />
        {/* Dim overlay — bottom strip */}
        <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-black/50 pointer-events-none" />
        {/* Dim overlay — left strip */}
        <div className="absolute top-[30%] bottom-[30%] left-0 w-[8%] bg-black/50 pointer-events-none" />
        {/* Dim overlay — right strip */}
        <div className="absolute top-[30%] bottom-[30%] right-0 w-[8%] bg-black/50 pointer-events-none" />

        {/* Scan reticle — sits on top of clear zone */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {scanState === "error" ? (
            <div className="bg-white/90 rounded-2xl px-6 py-4 max-w-xs text-center shadow-lg">
              <p className="text-red-600 text-sm font-medium">{errorMsg}</p>
            </div>
          ) : (
            <div
              className={`relative transition-all duration-300 ${
                isDetected ? "scale-105" : "scale-100"
              }`}
              style={{ width: "84%", height: "40%" }}
            >
              {/* Corner brackets — SVG */}
              <svg
                className="absolute inset-0 w-full h-full"
                viewBox="0 0 300 120"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Top-left */}
                <path
                  d="M 0 30 L 0 0 L 30 0"
                  stroke={isDetected ? "#22c55e" : "white"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Top-right */}
                <path
                  d="M 270 0 L 300 0 L 300 30"
                  stroke={isDetected ? "#22c55e" : "white"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-left */}
                <path
                  d="M 0 90 L 0 120 L 30 120"
                  stroke={isDetected ? "#22c55e" : "white"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
                {/* Bottom-right */}
                <path
                  d="M 270 120 L 300 120 L 300 90"
                  stroke={isDetected ? "#22c55e" : "white"}
                  strokeWidth="3"
                  strokeLinecap="round"
                  className="transition-colors duration-200"
                />
              </svg>

              {/* Laser scan line — only when scanning */}
              {!isDetected && (
                <div className="absolute left-[4px] right-[4px] top-[4px] bottom-[4px] overflow-hidden pointer-events-none">
                  <div className="laser-line absolute left-0 right-0 h-px bg-zinc-300 opacity-70" />
                </div>
              )}

              {/* Detected flash overlay */}
              {isDetected && (
                <div className="absolute inset-0 rounded-sm bg-green-400/20 border border-green-400 animate-fade-in-scale" />
              )}
            </div>
          )}
        </div>

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-safe pt-4 z-10">
          <button
            id="barcode-scanner-close"
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-black/40 flex items-center justify-center backdrop-blur-sm"
          >
            <X size={18} className="text-white" />
          </button>
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Scan size={13} className="text-white/70" />
            <span className="text-white/80 text-xs font-medium">Scanner</span>
          </div>
        </div>
      </div>

      {/* Bottom panel — white */}
      <div className="bg-white border-t border-zinc-200 px-6 pt-4 pb-8 pb-safe flex flex-col gap-3">
        {/* Hint */}
        <p
          className={`text-sm font-medium text-center transition-colors duration-200 ${
            isDetected ? "text-green-600" : "text-zinc-500"
          }`}
        >
          {hint}
        </p>

        {/* Barcode readout */}
        {lastDetected && (
          <div className="bg-zinc-50 border border-zinc-200 rounded-lg px-4 py-2 flex items-center justify-between">
            <span className="text-xs text-zinc-400">Barcode</span>
            <span className="font-mono text-sm text-zinc-700 tracking-widest">
              {lastDetected}
            </span>
          </div>
        )}

        {/* Signal strength */}
        {signalStrength && !isDetected && (
          <p className="text-xs text-center text-zinc-400">
            Signal:{" "}
            <span
              className={
                signalStrength === "strong" ? "text-green-500" : "text-amber-500"
              }
            >
              {signalStrength === "strong" ? "Strong ●" : "Weak ○"}
            </span>
          </p>
        )}

        {/* Cancel button */}
        <button
          id="barcode-scanner-cancel"
          onClick={onClose}
          className="w-full py-2.5 rounded-lg border border-zinc-200 text-zinc-600 text-sm font-medium hover:bg-zinc-50 transition-colors"
        >
          Cancel
        </button>
      </div>

      <style>{`
        @keyframes laser-sweep {
          0%   { top: 4px; }
          50%  { top: calc(100% - 4px); }
          100% { top: 4px; }
        }
        .laser-line {
          animation: laser-sweep 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Dynamic export with ssr:false
export const BarcodeScanner = dynamic(
  () => Promise.resolve(BarcodeScannerInner),
  { ssr: false }
);
