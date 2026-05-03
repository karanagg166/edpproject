import { Activity, Eye } from "lucide-react";
import { SpotlightCard } from "@/components/ui/spotlight-card";
import { motion, AnimatePresence } from "framer-motion";

export default function LiveDetections({ detections }: { detections: any[] }) {
  return (
    <SpotlightCard className="shadow-sm border border-zinc-200 bg-white">
      <div className="pb-3 border-b border-zinc-100 p-6">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity size={16} className="text-blue-500" /> Live Detections
          {detections.length > 0 && (
            <span className="ml-auto text-xs font-normal text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded-full">
              {detections.length}
            </span>
          )}
        </h3>
      </div>
      <div className="pt-4 p-6">
        {detections.length === 0 ? (
          /* ── Premium empty state ── */
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <motion.div
              animate={{ scale: [1, 1.08, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="w-12 h-12 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center"
            >
              <Eye size={20} className="text-blue-400" />
            </motion.div>
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-600">Watching for items</p>
              <p className="text-xs text-zinc-400 mt-0.5">Camera feed will appear here</p>
            </div>
            <div className="flex gap-1 mt-1">
              {[0, 0.2, 0.4].map((delay) => (
                <motion.span
                  key={delay}
                  className="w-1.5 h-1.5 rounded-full bg-blue-300"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay, ease: "easeInOut" }}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="space-y-3 max-h-52 overflow-y-auto scrollbar-hide mask-fade-bottom">
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
        )}
      </div>
    </SpotlightCard>
  );
}
