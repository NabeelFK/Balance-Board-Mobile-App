import React, { createContext, useContext, useMemo } from "react";
import { useSession } from "@clerk/clerk-expo";
import { createClerkSupabaseClient } from "../supabaseClient";

const SupabaseContext = createContext<any>(null);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const { session, isLoaded } = useSession();

  const supabase = useMemo(() => {
    return createClerkSupabaseClient(async () => {
      if (!session) return null;
      return session.getToken(); // Clerk JWT
    });
  }, [session]);

  // Avoid rendering anything until Clerk session is ready
  if (!isLoaded) return null;

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
