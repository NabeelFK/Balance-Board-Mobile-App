import { createClient } from "@supabase/supabase-js";

export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
) {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options: RequestInit = {}) => {
        const token = await getToken();

        const headers = new Headers(options.headers);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }

        return fetch(url, { ...options, headers });
      },
    },
  });
}
