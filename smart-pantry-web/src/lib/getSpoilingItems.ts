import { createClient } from "@supabase/supabase-js";
import { predictExpiryDate } from "./predictExpiry";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type SpoilingItem = {
  id: string;
  name: string;
  expiry_date: string;
  storage_type: string;
  quantity: number;
};

export type SpoilingUserGroup = {
  email: string;
  displayName: string | null;
  items: SpoilingItem[];
};

export async function getSpoilingItems(): Promise<Map<string, SpoilingUserGroup>> {
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  // 1. Fetch all items
  const { data: allItems, error } = await supabaseAdmin
    .from("pantry")
    .select("id, name, expiry_date, storage_type, category, quantity, user_id, added_at");

  if (error) {
    console.error("Error fetching pantry items:", error);
    return new Map();
  }

  const userItemsMap = new Map<string, SpoilingItem[]>();

  // 2. Process and backfill null expiry dates
  for (const item of allItems || []) {
    let finalExpiryDate = item.expiry_date;

    if (!finalExpiryDate) {
      finalExpiryDate = predictExpiryDate(item.category, item.storage_type, item.added_at);
      
      // Backfill in the background (no await needed for the whole loop unless we want to ensure consistency, but we do await here to be safe)
      await supabaseAdmin
        .from("pantry")
        .update({ expiry_date: finalExpiryDate })
        .eq("id", item.id);
    }

    // 3. Filter items expiring tomorrow
    if (finalExpiryDate === tomorrowStr) {
      if (!userItemsMap.has(item.user_id)) {
        userItemsMap.set(item.user_id, []);
      }
      userItemsMap.get(item.user_id)!.push({
        id: item.id,
        name: item.name,
        expiry_date: finalExpiryDate,
        storage_type: item.storage_type,
        quantity: item.quantity,
      });
    }
  }

  // 4. Group by user_id and fetch emails
  const result = new Map<string, SpoilingUserGroup>();
  
  if (userItemsMap.size === 0) {
    return result; // No items expiring tomorrow
  }

  // Fetch all users using admin auth
  const { data: usersData, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (usersError) {
    console.error("Error fetching users:", usersError);
    return result;
  }

  const usersMap = new Map(usersData.users.map(u => [u.id, u]));

  for (const [userId, items] of userItemsMap.entries()) {
    const user = usersMap.get(userId);
    if (user && user.email) {
      result.set(userId, {
        email: user.email,
        displayName: user.user_metadata?.display_name || user.user_metadata?.full_name || null,
        items,
      });
    }
  }

  return result;
}
