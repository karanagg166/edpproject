import { Activity } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveDetections({ detections }: { detections: any[] }) {
  return (
    <SpotlightCard className="shadow-sm border border-zinc-200 bg-white">
      <div className="pb-3 border-b border-zinc-100 p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={16} className="text-blue-500" /> Live Detections
        </h3>
      </div>
      <div className="pt-4 p-6">
        <div className="space-y-3">
          {detections.length === 0 && (
            <p className="text-sm text-zinc-500 text-center py-6">Waiting for camera...</p>
          )}
          <AnimatePresence initial={false}>
            {detections.map((det) => (
              <motion.div
                key={det.id}
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className={`p-3 rounded-xl text-sm border-l-2 ${det.action === "removed"
                    ? "bg-zinc-50 border-zinc-300"
                    : "bg-zinc-100 border-zinc-900"
                  }`}
              >
                <div className="flex justify-between font-medium text-zinc-900 mb-1">
                  <span className="capitalize">{det.item_name}</span>
                  <span className={det.action === "removed" ? "text-zinc-500 font-bold" : "text-zinc-900 font-bold"}>
                    {det.action === "removed" ? "−" : "+"}
                    {det.action}
                  </span>
                </div>
                <div className="text-zinc-500 text-xs">
                  {det.detection_type?.toUpperCase()} · {(det.confidence * 100).toFixed(0)}% ·{" "}
                  {new Date(det.detected_at).toLocaleTimeString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </SpotlightCard>
  );
}
