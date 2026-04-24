import fs from 'fs';
import path from 'path';

let foodDbCache: any = null;

export function getFoodDatabase() {
  if (foodDbCache) return foodDbCache;

  try {
    const dbPath = path.join(process.cwd(), '../food_database.json');
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      foodDbCache = JSON.parse(data);
      return foodDbCache;
    }
  } catch (error) {
    console.error("Failed to load food_database.json", error);
  }
  return { items: [] };
}

export function getServingSize(itemName: string): number {
  const db = getFoodDatabase();
  const searchName = itemName.toLowerCase();
  
  // Try exact match
  const exactMatch = db.items.find((item: any) => item.name.toLowerCase() === searchName);
  if (exactMatch && exactMatch.serving_size_g) return exactMatch.serving_size_g;
  
  // Try keyword match
  const kwMatch = db.items.find((item: any) => item.keywords && item.keywords.includes(searchName));
  if (kwMatch && kwMatch.serving_size_g) return kwMatch.serving_size_g;
  
  // Try substring
  const subMatch = db.items.find((item: any) => item.name.toLowerCase().includes(searchName) || searchName.includes(item.name.toLowerCase()));
  if (subMatch && subMatch.serving_size_g) return subMatch.serving_size_g;

  return 100; // Default fallback
}

export function getShelfLife(itemName: string, storageType: string): number | null {
  const db = getFoodDatabase();
  const searchName = itemName.toLowerCase();
  
  let match = db.items.find((item: any) => item.name.toLowerCase() === searchName);
  if (!match) match = db.items.find((item: any) => item.keywords && item.keywords.includes(searchName));
  if (!match) match = db.items.find((item: any) => item.name.toLowerCase().includes(searchName) || searchName.includes(item.name.toLowerCase()));
  
  if (match) {
    const type = storageType.toLowerCase();
    if (type === 'room' && match.shelf_life_room_days !== undefined) return match.shelf_life_room_days;
    if (type === 'fridge' && match.shelf_life_fridge_days !== undefined) return match.shelf_life_fridge_days;
    if (type === 'freezer' && match.shelf_life_freezer_days !== undefined) return match.shelf_life_freezer_days;
    
    // Fallbacks
    if (match.shelf_life_fridge_days !== undefined) return match.shelf_life_fridge_days;
    if (match.shelf_life_room_days !== undefined) return match.shelf_life_room_days;
    if (match.shelf_life_freezer_days !== undefined) return match.shelf_life_freezer_days;
  }
  
  return null; // No match found
}
