"use server";

import { fetchUserContext } from "./db/context";
import {
  generateSwotQuestions,
  validateSwotAnswer,
  simulateOutcome,
} from "./domain/services/analysis";
import { triageUserInput } from "./domain/services/llm_parser";

/**
 * STEP 1: START CHAT
 * Returns an ordered array of sessions (1 -> N) based on identified decisions.
 */
export async function startChat(userId: string | null, rawInput: string) {
  // 1. Triage the Input
  const triage = await triageUserInput(rawInput);
  if (triage.status === "INVALID")
    return { type: "ERROR", message: triage.guidance };

  // 2. Load Personal Context
  const userProfile = await fetchUserContext(userId);

  // 3. Identify Decisions (Force at least one)
  const decisions =
    triage.identified_decisions.length > 0
      ? triage.identified_decisions
      : ["General Path"];

  console.log(`QUEUING ${decisions.length} TRACKS:`, decisions);

  // 4. Generate All SWOTs
  const sessionPromises = decisions.map(async (decision) => {
    const swot = await generateSwotQuestions(
      triage.problem_statement,
      decision,
      userProfile,
    );

    if (swot.status === "INVALID") return null;

    return {
      decision: decision,
      questions: [
        // The 4 Steps (S -> W -> O -> T)
        { key: "strength", text: swot.quadrants.strength_q },
        { key: "weakness", text: swot.quadrants.weakness_q },
        { key: "opportunity", text: swot.quadrants.opportunity_q },
        { key: "threat", text: swot.quadrants.threat_q },
      ],
    };
  });

  const results = await Promise.all(sessionPromises);
  const validSessions = results.filter((s) => s !== null);

  if (validSessions.length === 0) {
    return { type: "ERROR", message: "Could not generate analysis." };
  }

  return {
    type: "SUCCESS",
    problem: triage.problem_statement,
    sessions: validSessions, // Frontent iterates: sessions[0], then sessions[1]...
  };
}

/**
 * STEP 2: CHECK ANSWER
 */
export async function checkAnswer(
  stepIndex: number,
  question: string,
  answer: string,
) {
  const validation = await validateSwotAnswer(stepIndex, question, answer);
  return {
    valid: validation.status === "VALID",
  };
}

/**
 * STEP 3: GET RESULTS
 * Frontend calls this once per decision track when it finishes.
 */
export async function getResults(
  userId: string | null,
  problem: string,
  decision: string,
  answers: any,
) {
  const userProfile = await fetchUserContext(userId);
  return await simulateOutcome(problem, decision, answers, userProfile);
}
