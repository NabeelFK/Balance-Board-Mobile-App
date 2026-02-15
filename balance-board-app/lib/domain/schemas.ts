import { z } from "zod";

// --- 0. SHARED ERROR PRIMITIVE ---
const InvalidResponseSchema = z.object({
  status: z.literal("INVALID"),
  reason: z.enum(["NONSENSE", "OFF_TOPIC", "HARMFUL", "TOO_VAGUE"]),
  guidance: z
    .string()
    .describe("Polite feedback telling the user what went wrong."),
});

// --- PHASE 1: INPUT PARSING ---
const ValidInputSchema = z.object({
  status: z.literal("VALID"),

  problem_statement: z
    .string()
    .min(1)
    .describe("Concise summary of the core issue."),

  // ALLOW EMPTY ARRAY: This lets us detect "Problem Only" (Case 2)
  identified_decisions: z
    .array(z.string())
    .describe(
      "List of distinct options. Return [] if user stated a problem but no specific choices.",
    ),

  // Helper for the UI when decisions are missing
  elicitation_question: z
    .string()
    .min(1)
    .optional()
    .describe(
      "If no decisions found, a specific question asking for one (e.g., 'What is one action you could take?').",
    ),
});

export const ParsedInputSchema = z.discriminatedUnion("status", [
  ValidInputSchema,
  InvalidResponseSchema,
]);

// --- PHASE 2: SWOT GENERATION ---
const ValidSwotSchema = z.object({
  status: z.literal("VALID"),
  decision_context: z.string().min(1),
  quadrants: z.object({
    strength_q: z
      .string()
      .min(1)
      .describe("Question about internal advantages."),
    weakness_q: z.string().min(1).describe("Question about internal gaps."),
    opportunity_q: z.string().min(1).describe("Question about external gains."),
    threat_q: z.string().min(1).describe("Question about external risks."),
  }),
});

export const SwotQuestionnaireSchema = z.discriminatedUnion("status", [
  ValidSwotSchema,
  InvalidResponseSchema,
]);

// --- PHASE 2.5: ANSWER VALIDATION ---
const ValidAnswerSchema = z.object({
  status: z.literal("VALID"),
  classification: z.enum(["STRONG", "WEAK"]),
  refined_answer: z.string().describe("Cleaned-up version of their answer."),
});

const InvalidAnswerSchema = z.object({
  status: z.literal("INVALID"),
  reason: z.enum(["NONSENSE", "OFF_TOPIC", "WRONG_QUADRANT"]),
  feedback: z.string().describe("Helpful tip to correct them."),
});

export const SwotAnswerValidationSchema = z.discriminatedUnion("status", [
  ValidAnswerSchema,
  InvalidAnswerSchema,
]);

// --- PHASE 3: OUTCOME SIMULATION ---
const ValidSimulationSchema = z.object({
  status: z.literal("VALID"),
  decision_id: z.string().optional(),
  predicted_outcome: z.string().min(1),
  probability: z.number().min(0).max(100),
  key_risks: z.array(z.string().min(1)),
});

export const SimulationSchema = z.discriminatedUnion("status", [
  ValidSimulationSchema,
  InvalidResponseSchema,
]);

// --- PHASE 4: LOOPBACK / HESITATION ---
const ValidHesitationSchema = z.object({
  status: z.literal("VALID"),
  user_sentiment: z.string(),
  recommended_action: z.enum([
    "REFINE_PROBLEM", // -> Go back to Input
    "ADD_MORE_OPTIONS", // -> Go back to Decision Expansion
    "DEEPEN_ANALYSIS", // -> Redo SWOT with higher strictness
    "FORCE_DECISION", // -> They are ready, just scared.
  ]),
  guidance_message: z.string(),
});

export const HesitationAnalysisSchema = z.discriminatedUnion("status", [
  ValidHesitationSchema,
  InvalidResponseSchema,
]);
