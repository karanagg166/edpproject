import { createSupabaseServer } from "./supabase-server";
import { cookies } from "next/headers";

export async function getAuthUser() {
  const cookieStore = await cookies();  const supabase = await createSupabaseServer();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}
