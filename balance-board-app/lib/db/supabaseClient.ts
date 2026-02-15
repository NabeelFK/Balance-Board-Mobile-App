import { createClient } from "@supabase/supabase-js";

// Use EXPO_PUBLIC prefix for React Native/Expo
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  // During a hackathon, if process.env is acting up,
  // you can temporary hardcode these strings just to get the app running.
  throw new Error("MISSING SUPABASE KEYS. Check your .env file.");
}

export const supabase = createClient(url, key);
