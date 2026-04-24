export const CATEGORIES = ["All", "fruits", "vegetables", "dairy", "meat_poultry", "grains", "snacks", "other"];

export const CATEGORY_EMOJI: Record<string, string> = {
  All: "🍽️", fruits: "🍎", vegetables: "🥦", dairy: "🥛",
  meat_poultry: "🍗", grains: "🌾", snacks: "🍪", other: "📦",
};

export function daysUntilExpiry(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}
