import { createSupabaseServer } from "./supabase-server";
import { cookies } from "next/headers";

export async function getAuthUser() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log("[auth-guard] All cookies:", allCookies.map(c => c.name));

  const supabase = createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    console.error("[auth-guard] getUser error:", error?.message);
    return null;
  }

  return user;
}
