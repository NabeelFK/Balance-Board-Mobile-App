import { supabaseAdmin } from "./admin";
import type { UserProfile } from "../domain/services/analysis";

/**
 * Fetches all context chunks for a user and merges them into one profile.
 * Returns 'undefined' if user is missing or has no data.
 */
export async function fetchUserContext(
  userId: string | null | undefined,
): Promise<UserProfile | undefined> {
  // 1. Safety Check: If no user ID, don't waste a DB call
  if (!userId) return undefined;

  try {
    // 2. Fetch all chunks
    const { data, error } = await supabaseAdmin
      .from("user_context_chunks")
      .select("content")
      .eq("user_id", userId);
    // .order('created_at', { ascending: true }). Optional: Oldest memories first
    if (error) {
      console.warn("Supabase Read Error:", error.message);
      return undefined; // Fail gracefully, don't crash the app
    }

    if (!data || data.length === 0) {
      return undefined; // User has no saved context
    }

    // 3. Merge Paragraphs
    // The LLM prefers one big block of text over an array of strings.
    const fullBio = data.map((chunk) => chunk.content).join("\n\n");
    return {
      occupation: fullBio, // The Analysis service will inject this raw text into the prompt
      risk_tolerance: "MEDIUM", // Default safe value
    };
  } catch (err) {
    console.error("Critical DB Error:", err);
    return undefined;
  }
}
