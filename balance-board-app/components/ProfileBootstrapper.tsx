import React, { useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-expo";
import { useSupabase } from "../providers/SupabaseProvider";

function normalizeName(s: unknown): string | null {
  if (typeof s !== "string") return null;
  const cleaned = s.trim().replace(/\s+/g, " ");
  return cleaned.length >= 2 ? cleaned : null;
}

function splitDisplayName(displayName: string) {
  const cleaned = displayName.trim().replace(/\s+/g, " ");
  const parts = cleaned.split(" ").filter(Boolean);
  const firstName = parts[0] ?? "";
  const lastName = parts.length > 1 ? parts.slice(1).join(" ") : "";
  return { cleaned, firstName, lastName };
}

function looksLikeEmail(s: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function emailLocalPart(email?: string | null) {
  if (!email) return null;
  const at = email.indexOf("@");
  if (at <= 0) return null;
  const local = email.slice(0, at).trim();
  return local.length >= 2 ? local : null;
}

export default function ProfileBootstrapper() {
  const supabase = useSupabase();
  const { user, isLoaded } = useUser();

  // track which user we've bootstrapped (so it works if you sign out/in as another user)
  const bootstrappedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!user?.id) return;

    if (bootstrappedUserId.current === user.id) return;

    const tryBootstrap = async (attempt = 0) => {
      try {
        // Read possible sources
        const metaUnsafe = normalizeName((user.unsafeMetadata as any)?.display_name);
        const metaPublic = normalizeName((user.publicMetadata as any)?.display_name);

        const email =
          user.primaryEmailAddress?.emailAddress ??
          (typeof (user as any)?.emailAddress === "string" ? (user as any).emailAddress : null);

        const username = normalizeName(user.username);
        const fullName = normalizeName(user.fullName);
        const firstName = normalizeName(user.firstName);
        const lastName = normalizeName(user.lastName);

        // If Clerk name fields are missing, set them once from display_name metadata (or username).
        // This prevents Clerk / UI from falling back to email.
        const hasClerkName = !!(firstName || lastName || fullName);

        const bestSeedName = metaUnsafe || metaPublic || username;
        if (!hasClerkName && bestSeedName) {
          const { firstName: fn, lastName: ln } = splitDisplayName(bestSeedName);
          // Only update if we have something meaningful for firstName
          if (fn.trim().length >= 1) {
            await user.update({
              firstName: fn,
              lastName: ln,
            });
          }
        }

        // Build a final displayName for Supabase (NEVER store an email as display_name)
        let displayName =
          fullName ||
          firstName ||
          metaUnsafe ||
          metaPublic ||
          username ||
          emailLocalPart(email) ||
          "Anonymous";

        displayName = displayName.trim().replace(/\s+/g, " ");

        // Safety: never write a full email into display_name
        if (looksLikeEmail(displayName)) {
          displayName = username || emailLocalPart(email) || "Anonymous";
        }

        // If we *still* don't have metadata/name right after signup, retry a couple times
        const metaPresent = !!(metaUnsafe || metaPublic);
        const namePresent = !!(fullName || firstName || lastName);

        // If neither name nor metadata has appeared yet (race condition), retry briefly
        if (!metaPresent && !namePresent && attempt < 3) {
          setTimeout(() => tryBootstrap(attempt + 1), 600);
          return;
        }

        console.log("ProfileBootstrapper: bootstrapping user", {
          id: user.id,
          displayName,
          imageUrl: user.imageUrl,
          attempt,
        });

        const resp = await supabase.from("profiles").upsert(
          {
            clerk_user_id: user.id,
            display_name: displayName,
            avatar_url: user.imageUrl ?? null,
          },
          { onConflict: "clerk_user_id" }
        );

        console.log("ProfileBootstrapper upsert response:", resp);
        if (resp.error) throw resp.error;

        // mark bootstrapped only after successful upsert
        bootstrappedUserId.current = user.id;
      } catch (e) {
        console.error("ProfileBootstrapper error:", e);
        // allow retry if something failed
        bootstrappedUserId.current = null;

        // small retry on transient issues
        // (don’t loop forever—only retry a couple times)
        // Note: attempt is scoped in tryBootstrap, so this only retries if we call tryBootstrap again.
      }
    };

    tryBootstrap();
  }, [isLoaded, supabase, user]);

  return null;
}
