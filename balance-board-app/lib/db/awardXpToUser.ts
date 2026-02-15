import { supabase } from './supabaseClient';

// Award XP to a user by Clerk user ID
export async function awardXpToUser(clerkUserId: string, amount: number, clientTxId: string) {
  // 1. Get the profile row for this Clerk user
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, xp')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (profileError || !profiles) {
    throw profileError || new Error('Profile not found');
  }

  const profileId = profiles.id;
  const currentXp = profiles.xp || 0;

  // 2. Insert XP event (idempotent by clientTxId)
  const { error: xpEventError } = await supabase
    .from('xp_events')
    .insert({
      profile_id: profileId,
      amount_xp: amount,
      reason: 'decision_completed',
      client_tx_id: clientTxId,
    });
  if (xpEventError && !String(xpEventError.message).includes('duplicate key')) {
    throw xpEventError;
  }

  // 3. Update XP on profile (add XP)
  const { error: xpUpdateError } = await supabase
    .from('profiles')
    .update({ xp: currentXp + amount })
    .eq('id', profileId);
  if (xpUpdateError) {
    throw xpUpdateError;
  }

  return { profileId, newXp: currentXp + amount };
}
