import { useEffect, useState } from "react";
import { Trash2, X, Plus, Camera } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
  barcode?: string;
  barcode_data?: string;
  brand?: string;
  product_image_url?: string;
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

  return (
    <AnimatePresence>
      {currentDetection && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-50 w-80"
        >
          <Card className="overflow-hidden shadow-xl border-zinc-200">
            <div className="p-4 relative bg-white">
              <button 
                onClick={() => onConfirm(currentDetection.id, "dismissed")} 
                className="absolute top-2 right-2 text-zinc-400 hover:text-zinc-600 transition"
              >
                <X size={16} />
              </button>
              <div className="flex items-center gap-3 mb-3">
                {currentDetection.detection_type === "barcode" && currentDetection.product_image_url ? (
                  <div className="w-10 h-10 shrink-0 border border-zinc-200 rounded-xl overflow-hidden bg-white">
                    <img src={currentDetection.product_image_url} alt={currentDetection.item_name} className="w-full h-full object-contain" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0 border border-zinc-200">
                    <Camera size={20} className="text-zinc-700" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-zinc-900 leading-tight">
                    {currentDetection.detection_type === "barcode" ? "Barcode Detected" : "Camera Detected"}
                  </h3>
                  <p className="text-sm font-medium text-zinc-900 capitalize">{currentDetection.item_name}</p>
                  {currentDetection.detection_type === "barcode" && currentDetection.brand && (
                    <p className="text-xs text-zinc-500">{currentDetection.brand}</p>
                  )}
                </div>
              </div>

              <p className="text-xs text-zinc-500 mb-4 leading-relaxed">
                Would you like to add this item to your pantry?
              </p>

              <div className="flex gap-1 mb-4 bg-zinc-100 p-1 rounded-lg">
                {(["room", "fridge", "freezer"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setStorageType(type)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-md transition ${
                      storageType === type 
                        ? "bg-white text-zinc-900 shadow-sm" 
                        : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200/50"
                    }`}
                  >
                    {type === "room" ? "🏠 Room" : type === "fridge" ? "❄️ Fridge" : "🧊 Freezer"}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => onConfirm(currentDetection.id, "added", storageType)}
                  className="flex-1"
                >
                  <Plus size={14} className="mr-2" /> Add
                </Button>
                <Button 
                  onClick={() => onConfirm(currentDetection.id, "removed")}
                  variant="outline"
                  className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                >
                  <Trash2 size={14} className="mr-2" /> Remove
                </Button>
              </div>
              {pendingDetections.length > 1 && (
                <div className="mt-3 text-center text-xs font-medium text-zinc-400">
                  {pendingDetections.length - 1} more pending...
                </div>
              )}
            </div>
            
            {/* Progress bar */}
            <div className="h-1 bg-zinc-100 w-full">
              <div 
                className="h-full bg-zinc-900 transition-all duration-1000 ease-linear"
                style={{ width: `${(timeLeft / 15) * 100}%` }}
              />
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
