import { supabase } from './supabaseClient';

export type DecisionPayload = {
  user_id: string | null;
  problem: string;
  chosen_decision: string;
  chosen_outcome: string;
  score: number;
  query_count: number;
  details?: any;
  created_at?: string;
};

export async function saveDecision(payload: DecisionPayload) {
  // Ensure we don't send an `id` so DB can generate bigint id
  const insertPayload = { ...payload } as any;
  delete insertPayload.id;

  const { data, error } = await supabase
    .from('decision_history')
    .insert(insertPayload)
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  return data;
}
