import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getAuthUser() {
  const cookieStore = await cookies();
  console.log("[getAuthUser] all cookies:", cookieStore.getAll().map(c => c.name));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set({ name, value, ...options });
            });
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// GET /api/detections — fetch recent detections for the logged-in user
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("detection_history")
    .select("*")
    .eq("user_id", user.id)
    .order("detected_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("[API /detections GET] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
