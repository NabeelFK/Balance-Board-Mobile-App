import { z } from "zod";

// --- SUB-SCHEMAS ---

// 1. The Core Context (What are we solving? What decision are we having)
const ContextSchema = z.object({
  problem: z.string().describe("The core issue."),
  decisions: z
    .array(
      z.object({
        id: z.string().uuid(),
        text: z.string().describe("The decision text (e.g., 'Buy House')"),
        status: z.enum(["PENDING", "ANALYZED", "REJECTED"]),
      }),
    )
    .min(1),
});

// 2. The Analysis Data (The SWOT work) for each decision
const SwotSchema = z.object({
  decisionId: z.string().uuid(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
});

// 3. The Simulation Data (The Future Prediction)
const OutcomeSchema = z.object({
  decisionId: z.string().uuid(),
  predicted_outcome: z.string().describe("What is likely to happen."),
  confidence: z.number().min(0).max(100),
  risk_level: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]),
});

// --- THE MASTER STATE SCHEMA ---

export const SessionStateSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),

  // The Phase determines which UI controls are visible
  phase: z.enum([
    "COLLECTING_INPUT", // Loop: Problem/Decision input
    "CONFIRMING_SCOPE", // "Any other decisions?" (Yes/No)
    "SWOT_ANALYSIS", // User answering tailored questions
    "COMPUTING_FUTURES", // App generating outcomes
    "DECISION_POINT", // User choosing final path or looping back
  ]),

  // The Data Accumulator
  context: ContextSchema.nullable(),
  swot_analyses: z.array(SwotSchema).default([]),
  computed_outcomes: z.array(OutcomeSchema).default([]),

  // The Loopback Trigger (Why did they not decide?)
  hesitation_reason: z
    .enum([
      "NONE",
      "PROBLEM_UNCLEAR", // -> Go to COLLECTING_INPUT
      "DECISIONS_INCOMPLETE", // -> Go to CONFIRMING_SCOPE
      "ANALYSIS_WEAK", // -> Go to SWOT_ANALYSIS (with higher "temperature")
    ])
    .optional(),
});

export type SessionState = z.infer<typeof SessionStateSchema>;
