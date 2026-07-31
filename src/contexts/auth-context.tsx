import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  role: "admin" | "treasurer" | "resident";
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  role: "resident",
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AuthContextValue["role"]>("resident");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user);
      const resolvedRole =
        (data.user?.user_metadata?.role as AuthContextValue["role"] | undefined) ?? "resident";
      setRole(resolvedRole);
      setLoading(false);
    };

    load();
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      const resolvedRole =
        (session?.user?.user_metadata?.role as AuthContextValue["role"] | undefined) ?? "resident";
      setRole(resolvedRole);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo(() => ({ user, loading, role }), [user, loading, role]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  return useContext(AuthContext);
}
