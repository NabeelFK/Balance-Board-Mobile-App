import { z } from "zod";
import {
  ParsedInputSchema,
  SwotQuestionnaireSchema,
  SimulationSchema,
  HesitationAnalysisSchema,
  SwotAnswerValidationSchema,
} from "./schemas";

// --- 1. INPUT PARSING TYPES ---
export type ParsedInput = z.infer<typeof ParsedInputSchema>;

export function isValidInput(
  input: ParsedInput,
): input is Extract<ParsedInput, { status: "VALID" }> {
  return input.status === "VALID";
}

// --- 2. SWOT GENERATION TYPES ---
export type SwotQuestionnaire = z.infer<typeof SwotQuestionnaireSchema>;

export function isValidSwot(
  swot: SwotQuestionnaire,
): swot is Extract<SwotQuestionnaire, { status: "VALID" }> {
  return swot.status === "VALID";
}

// --- 3. OUTCOME SIMULATION TYPES ---
export type SimulationResult = z.infer<typeof SimulationSchema>;

export function isValidSimulation(
  sim: SimulationResult,
): sim is Extract<SimulationResult, { status: "VALID" }> {
  return sim.status === "VALID";
}

// --- 4. LOOPBACK TYPES ---
export type HesitationAnalysis = z.infer<typeof HesitationAnalysisSchema>;

export function isValidHesitation(
  hes: HesitationAnalysis,
): hes is Extract<HesitationAnalysis, { status: "VALID" }> {
  return hes.status === "VALID";
}

// --- 5. ANSWER VALIDATION TYPES ---
export type SwotAnswerValidation = z.infer<typeof SwotAnswerValidationSchema>;

export function isValidAnswer(
  val: SwotAnswerValidation,
): val is Extract<SwotAnswerValidation, { status: "VALID" }> {
  return val.status === "VALID";
}

// --- 6. FRONTEND STATE ENTITIES ---
// These are used by React to store the running session
export interface DecisionEntity {
  id: string;
  text: string;
  // We store the 4 answers here once validated
  swotAnswers?: {
    s: string;
    w: string;
    o: string;
    t: string;
  };
  simulation?: SimulationResult;
}

export interface SessionContext {
  problem: string;
  decisions: DecisionEntity[];
}
