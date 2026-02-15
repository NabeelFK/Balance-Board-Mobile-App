import React, { createContext, useContext, useMemo } from "react";
import { useAuth } from "@clerk/clerk-expo";
import { createClerkSupabaseClient } from "../supabaseClient";

const SupabaseContext = createContext<any>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(() => getToken());
  }, [getToken]);

  return (
    <SupabaseContext.Provider value={supabase}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext);
  if (!ctx) throw new Error("useSupabase must be inside SupabaseProvider");
  return ctx;
}
