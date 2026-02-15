import { ParsedInputSchema, HesitationAnalysisSchema } from "../schemas";
import type { ParsedInput, HesitationAnalysis, SessionContext } from "../types";
import { generateStructured } from "../../llm/client";

/**
 * LOGIC: Phase 1 - Triage User Input
 * Analyzes raw text to determine if we have a valid Problem + Decision.
 */
export async function triageUserInput(rawText: string): Promise<ParsedInput> {
  const cleanedText = rawText.trim();

  // 1. COST SAVING: Don't LLM empty strings
  if (!cleanedText || cleanedText.length < 5) {
    return {
      status: "INVALID",
      reason: "TOO_VAGUE",
      guidance: "I need a bit more detail. What is on your mind?",
    };
  }

  // 2. SYSTEM PROMPT
  const systemPrompt = `
    You are a Critical Thinking Coach. Your job is to analyze the user's input to extract the context.

    RULES:
    1. EXTRACT 'Problem Statement' (The core issue).
    2. EXTRACT 'Decisions' (Specific choices explicitly stated).
    
    SCENARIOS:
    - Case A (Problem + Decision): For example, user says "I hate my job and might quit." 
      -> status: VALID, decisions: ["Quit job"]
      
    - Case B (Problem Only): For example, user says "I hate my job." (No choice stated)
      -> status: VALID, decisions: [], elicitation_question: "You identified the problem. What is one specific choice you can make?"
      
    - Case C (Nonsense/Harmful): User says "blorp" or dangerous content.
      -> status: INVALID, reason: NONSENSE or HARMFUL.
      
    CONSTRAINT: Do NOT invent decisions. If they aren't there, return []. Do not decide for the user on any occasion. 
    GOAL: Guide the user so they can develop circumstancial analysis skill.
    You must return a JSON object matching one of these two structures exactly:
    OPTION 1 (Valid Input):
    {
      "status": "VALID",
      "problem_statement": "The core issue summary",
      "identified_decisions": ["Option A", "Option B"] 
      // Note: Return [] if problem is clear but no decision stated.
    }

    OPTION 2 (Invalid Input):
    {
      "status": "INVALID",
      "reason": "NONSENSE" | "OFF_TOPIC" | "HARMFUL" | "TOO_VAGUE",
      "guidance": "A helpful error message."
    }
  `;

  try {
    // 3. LLM EXECUTION
    const result = await generateStructured(
      systemPrompt,
      cleanedText,
      "gpt-5-mini",
    );

    // 4. ZOD VALIDATION
    // If LLM hallucinates a bad shape, this throws an error caught below
    const parsed = ParsedInputSchema.parse(result);
    return parsed;
  } catch (error) {
    console.error("Parse Error:", error);
    // Fallback if LLM fails completely
    return {
      status: "INVALID",
      reason: "NONSENSE",
      guidance:
        "I'm having trouble understanding. Could you rephrase the problem?",
    };
  }
}

/**
 * Analyze Hesitation
 * Maps a user's excuse ("I can't decide") to a System Action.
 */
export async function analyzeHesitation(
  userExcuse: string,
  currentContext: SessionContext,
): Promise<HesitationAnalysis> {
  // 1. CONTEXT PREP
  const contextSummary = `
    Problem: ${currentContext.problem}
    Decisions: ${currentContext.decisions.map((d) => d.text).join(", ")}
  `;

  // 2. SYSTEM PROMPT
  const systemPrompt = `
    The user has completed a SWOT analysis but refuses to choose.
    Current Context: ${contextSummary}
    User Excuse: "${userExcuse}"
    
    Task: Map their hesitation to a System Action.
    - "I don't understand what's wrong" -> REFINE_PROBLEM
    - "None of these look good" -> ADD_MORE_OPTIONS
    - "I'm scared of the risks" -> DEEPEN_ANALYSIS
    - "They all look good", "I can't pick just one", "Hard to choose" -> FORCE_DECISION
    Output strictly valid JSON matching HesitationAnalysisSchema.
  `;

  try {
    const result = await generateStructured(
      systemPrompt,
      userExcuse,
      "gpt-5-mini",
    );

    return HesitationAnalysisSchema.parse(result);
    //Default fallback
  } catch (error) {
    return {
      status: "INVALID",
      reason: "TOO_VAGUE",
      guidance:
        "I'm not sure how to help with that. Do you want to review the SWOT again?",
    };
  }
}
