"use client";

/**
 * BarcodeScanner — full-screen camera overlay powered by Quagga2.
 *
 * Key accuracy improvements over ZXing:
 * - Center-strip crop (top/bottom 35% ignored) — eliminates peripheral noise reads
 * - Confidence gate: skips results where avg decode error > 0.15
 * - One-shot flag: fires onDetected exactly once then stops the camera
 *
 * Must be used with dynamic import + ssr:false because Quagga2 accesses `window`.
 */

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

type Props = {
  onDetected: (barcode: string) => void;
  onClose: () => void;
};

function BarcodeScannerInner({ onDetected, onClose }: Props) {
  const scannerRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef(false); // prevent duplicate fires
  const [error, setError] = useState<string | null>(null);
  const [hint, setHint] = useState("Align barcode within the box");

  useEffect(() => {
    let Quagga: typeof import("@ericblade/quagga2").default | null = null;

    async function initScanner() {
      try {
        const mod = await import("@ericblade/quagga2");
        Quagga = mod.default;

        await new Promise<void>((resolve, reject) => {
          Quagga!.init(
            {
              inputStream: {
                type: "LiveStream",
                target: scannerRef.current!,
                constraints: {
                  facingMode: "environment", // back camera on mobile
                  width: { ideal: 1280 },
                  height: { ideal: 720 },
                },
                // Only decode the center horizontal strip — eliminates
                // false positives from curved bottles / peripheral noise
                area: {
                  top: "35%",
                  right: "10%",
                  left: "10%",
                  bottom: "35%",
                },
              },
              decoder: {
                // Indian products: Code128 (IVM-style), EAN-13, EAN-8, Code39
                readers: [
                  "code_128_reader",
                  "ean_reader",
                  "ean_8_reader",
                  "code_39_reader",
                ],
                multiple: false,
              },
              locate: true,
              numOfWorkers: typeof navigator !== "undefined" && navigator.hardwareConcurrency
                ? Math.min(navigator.hardwareConcurrency, 2)
                : 2,
              frequency: 10, // scan every 10 frames — reduces CPU load
            },
            (err) => {
              if (err) reject(err);
              else resolve();
            }
          );
        });

        Quagga.start();

        Quagga.onDetected((result) => {
          if (firedRef.current) return;

          const code = result.codeResult?.code;
          if (!code) return;

          // Confidence gate — reject low-quality reads
          const errors = (result.codeResult?.decodedCodes ?? [])
            .filter((c) => c.error !== undefined)
            .map((c) => c.error as number);

          const avgError =
            errors.length > 0
              ? errors.reduce((a, b) => a + b, 0) / errors.length
              : 1;

          if (avgError > 0.15) {
            setHint("Hold steady...");
            return;
          }

          // Valid read — fire once
          firedRef.current = true;
          Quagga!.stop();
          onDetected(code);
        });
      } catch (e) {
        console.error("BarcodeScanner init error:", e);
        setError("Camera access denied or not available. Please allow camera access.");
      }
    }

    initScanner();

    return () => {
      if (Quagga) {
        try { Quagga.stop(); } catch { /* ignore */ }
      }
    };
  }, [onDetected]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Camera viewport */}
      <div
        ref={scannerRef}
        className="relative w-full max-w-sm h-64 overflow-hidden rounded-xl bg-zinc-900"
      />

      {/* Targeting overlay — drawn on top of the video */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {error ? (
          <p className="text-red-400 text-center px-6 text-sm">{error}</p>
        ) : (
          <div className="relative w-72 h-24">
            {/* Green targeting box */}
            <div className="absolute inset-0 border-2 border-green-400 rounded-lg opacity-80" />
            {/* Corner accent marks */}
            <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-green-400 rounded-tl" />
            <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-green-400 rounded-tr" />
            <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-green-400 rounded-bl" />
            <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-green-400 rounded-br" />
            {/* Animated scan line */}
            <div className="absolute left-2 right-2 h-0.5 bg-green-400 opacity-70 animate-scan-line" />
          </div>
        )}
      </div>

      {/* Hint text */}
      <p className="absolute bottom-28 text-white/60 text-sm">{hint}</p>

      {/* Cancel */}
      <button
        id="barcode-scanner-cancel"
        onClick={onClose}
        className="absolute bottom-10 px-8 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-full text-sm transition"
      >
        Cancel
      </button>

      <style jsx>{`
        @keyframes scan-line {
          0%   { top: 8px; }
          50%  { top: calc(100% - 8px); }
          100% { top: 8px; }
        }
        .animate-scan-line {
          animation: scan-line 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

// Dynamic export with ssr:false — Quagga2 requires window / navigator
export const BarcodeScanner = dynamic(
  () => Promise.resolve(BarcodeScannerInner),
  { ssr: false }
);
