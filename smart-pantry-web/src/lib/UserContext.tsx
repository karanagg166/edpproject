"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";
import { useMemo } from "react";
type User = { id: string; display_name: string; email?: string };

interface UserContextType {
  user: User | null;
  activeUserId: string;
  signOut: () => Promise<void>;
  loading: boolean;
}

const UserContext = createContext<UserContextType>({
  user: null,
  activeUserId: "",
  signOut: async () => { },
  loading: true,
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useMemo(() => createSupabaseBrowser(), []);

  useEffect(() => {
    // Initial session check
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            display_name: "User",
          });

          const { data: userData } = await supabase
            .from("users")
            .select("display_name")
            .eq("id", session.user.id)
            .maybeSingle();

          if (userData?.display_name) {
            setUser(prev => prev ? { ...prev, display_name: userData.display_name } : null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Error fetching user session:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: { user: { id: any; email: any; }; }) => {
      if (session) {
        setUser({
          id: session.user.id,
          email: session.user.email,
          display_name: "User",
        });
        setLoading(false);

        const { data: userData } = await supabase
          .from("users")
          .select("display_name")
          .eq("id", session.user.id)
          .maybeSingle();

        if (userData?.display_name) {
          setUser(prev => prev ? { ...prev, display_name: userData.display_name } : null);
        }
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <UserContext.Provider value={{ user, activeUserId: user?.id || "", signOut, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
