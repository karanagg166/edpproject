import { Activity } from "lucide-react";

export default function LiveDetections({ detections }: { detections: any[] }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
      <h2 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
        <Activity size={14} className="text-blue-400" /> Live Detections
      </h2>
      <div className="space-y-2">
        {detections.length === 0 && (
          <p className="text-xs text-slate-600 text-center py-4">Waiting for camera...</p>
        )}
        {detections.map((det) => (
          <div
            key={det.id}
            className={`p-3 rounded-xl text-xs border-l-2 ${det.action === "removed"
                ? "bg-orange-900/10 border-orange-500"
                : "bg-emerald-900/10 border-emerald-500"
              }`}
          >
            <div className="flex justify-between font-medium text-slate-200 mb-1">
              <span className="capitalize">{det.item_name}</span>
              <span className={det.action === "removed" ? "text-orange-400" : "text-emerald-400"}>
                {det.action === "removed" ? "−" : "+"}
                {det.action}
              </span>
            </div>
            <div className="text-slate-500">
              {det.detection_type?.toUpperCase()} · {(det.confidence * 100).toFixed(0)}% ·{" "}
              {new Date(det.detected_at).toLocaleTimeString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
