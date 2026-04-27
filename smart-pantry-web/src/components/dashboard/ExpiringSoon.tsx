import { AlertTriangle } from "lucide-react";
import { daysUntilExpiry } from "@/app/dashboard/constants";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ExpiringSoon({ pantry }: { pantry: any[] }) {
  const expiringItems = pantry.filter((p) => {
    const d = daysUntilExpiry(p.expiry_date);
    return d !== null && d <= 3 && d >= 0;
  });

  if (expiringItems.length === 0) return null;

  return (
    <Card className="border-t-4 border-t-amber-500 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-zinc-900">
          <AlertTriangle size={16} className="text-amber-500" /> Expiring Soon
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {expiringItems.map((p) => {
            const d = daysUntilExpiry(p.expiry_date);
            const isCritical = d !== null && d <= 1;
            return (
              <div key={p.id} className={`flex justify-between items-center ${isCritical ? 'animate-pulse' : ''}`}>
                <span className="text-sm text-zinc-700 capitalize font-medium">{p.name}</span>
                <Badge variant="outline" className={isCritical ? "text-red-600 border-red-200 bg-red-50" : "text-amber-600 border-amber-200 bg-amber-50"}>
                  {d}d left
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
