import { useEffect, useState } from "react";
import { Check, Trash2, X, Plus } from "lucide-react";

export type DetectionEvent = {
  id: string;
  item_name: string;
  confidence: number;
  detection_type: string;
  action: string;
  status: string;
  user_id: string;
  category?: string;
  storage_type?: string;
};

interface DetectionPopupProps {
  pendingDetections: DetectionEvent[];
  onConfirm: (detectionId: string, action: "added" | "removed" | "dismissed", storageType?: "room" | "fridge" | "freezer") => void;
}

export default function DetectionPopup({ pendingDetections, onConfirm }: DetectionPopupProps) {
  const [timeLeft, setTimeLeft] = useState(15);
  const [storageType, setStorageType] = useState<"room" | "fridge" | "freezer">("fridge");
  
  // Show the oldest pending detection
  const currentDetection = pendingDetections[0];

  useEffect(() => {
    if (!currentDetection) return;
    
    setTimeLeft(15);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onConfirm(currentDetection.id, "dismissed");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentDetection, onConfirm]);

  if (!currentDetection) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-slate-900 border border-emerald-500/50 shadow-2xl shadow-emerald-900/20 rounded-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="p-4 relative">
        <button 
          onClick={() => onConfirm(currentDetection.id, "dismissed")} 
          className="absolute top-2 right-2 text-slate-500 hover:text-white transition"
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0 border border-emerald-500/30">
            <span className="text-xl">📸</span>
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">Camera Detected</h3>
            <p className="text-sm text-emerald-400 capitalize">{currentDetection.item_name}</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          Would you like to add this item to your pantry?
        </p>

        <div className="flex gap-1 mb-4 bg-slate-800 p-1 rounded-lg">
          {(["room", "fridge", "freezer"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setStorageType(type)}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                storageType === type 
                  ? "bg-slate-700 text-white shadow-sm" 
                  : "text-slate-400 hover:text-slate-300 hover:bg-slate-700/50"
              }`}
            >
              {type === "room" ? "🏠 Room" : type === "fridge" ? "❄️ Fridge" : "🧊 Freezer"}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => onConfirm(currentDetection.id, "added", storageType)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition"
          >
            <Plus size={14} /> Add
          </button>
          <button 
            onClick={() => onConfirm(currentDetection.id, "removed")}
            className="flex-1 bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-300 py-2 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition border border-slate-700 hover:border-red-500/30"
          >
            <Trash2 size={14} /> Remove
          </button>
        </div>
        {pendingDetections.length > 1 && (
          <div className="mt-3 text-center text-xs text-slate-500">
            {pendingDetections.length - 1} more pending...
          </div>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="h-1 bg-slate-800 w-full">
        <div 
          className="h-full bg-emerald-500 transition-all duration-1000 ease-linear"
          style={{ width: `${(timeLeft / 15) * 100}%` }}
        />
      </div>
    </div>
  );
}
