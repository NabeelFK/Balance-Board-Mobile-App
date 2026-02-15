import {
  SwotQuestionnaireSchema,
  SwotAnswerValidationSchema,
  SimulationSchema,
} from "../schemas";
import type {
  SwotQuestionnaire,
  SwotAnswerValidation,
  SimulationResult,
} from "../types";
import { generateStructured } from "../../llm/client";

export interface UserProfile {
  occupation?: string; // The raw bio text
  risk_tolerance?: string; // 'LOW' | 'MEDIUM' | 'HIGH'
}

// --- SWOT question ---
export const SWOT_ORDER = [
  "STRENGTH",
  "WEAKNESS",
  "OPPORTUNITY",
  "THREAT",
] as const;

/**
 * Generate Tailored Questions
 */
export async function generateSwotQuestions(
  problem: string,
  decision: string,
  userContext?: UserProfile,
): Promise<SwotQuestionnaire> {
  //Load personal context
  let contextBlock = `Problem: "${problem}"\nDecision: "${decision}"`;
  if (userContext && userContext.occupation) {
    contextBlock += `\nUser Bio/Context: "${userContext.occupation}"`;
    if (userContext.risk_tolerance) {
      contextBlock += `\nRisk Tolerance: ${userContext.risk_tolerance}`;
    }
  }
  const systemPrompt = `
    You are a Strategic Coach.
    Context: User has problem "${problem}" and is considering "${decision}".
    PERSONALIZATION RULES:
    - If 'User Bio/Context' is provided, you MUST tailor the questions to their specific background, skills, or constraints when relevant.
    - Example: If the bio says "Student", the Opportunity question should focus on internships or learning.
    Task: Generate 4 specific, probing questions (one for each SWOT quadrant).
    RETURN JSON MATCHING THIS EXACT STRUCTURE:
    {
      "status": "VALID",
      "decision_context": "${decision}",
      "quadrants": {
        "strength_q": "Question about internal assets/skills?",
        "weakness_q": "Question about internal gaps/resources?",
        "opportunity_q": "Question about external gains?",
        "threat_q": "Question about external risks?"
      }
    }
  `;

  try {
    const result = await generateStructured(
      systemPrompt,
      `Context: ${problem} -> Decision: ${decision}`,
    );
    return SwotQuestionnaireSchema.parse(result);
  } catch (error) {
    console.error("SWOT Gen Error:", error);
    return {
      status: "INVALID",
      reason: "NONSENSE",
      guidance: "Something went wrong. Please try again.",
    };
  }
}

/**
 * LOGIC: Phase 2.5 - Validate Answer
 */
export async function validateSwotAnswer(
  stepIndex: number,
  question: string,
  answer: string,
): Promise<SwotAnswerValidation> {
  const currentQuadrant = SWOT_ORDER[stepIndex];

  const systemPrompt = `
    You are a Logic Validator.
    Current Step: ${currentQuadrant}.
    Question Asked: "${question}"
    User Answer: "${answer}"
    
    Task: Validate if the answer is relevant and fits the quadrant.
    
    RETURN JSON MATCHING ONE OF THESE OPTIONS:

    OPTION 1 (Valid):
    {
      "status": "VALID",
    }

    OPTION 2 (Invalid - Wrong Quadrant, Nonsense, etc):
    {
      "status": "INVALID",
      "reason": "NONSENSE" | "OFF_TOPIC" | "WRONG_QUADRANT",
      "feedback": "Specific tip on how to fix it."
    }
  `;

  try {
    const result = await generateStructured(
      systemPrompt,
      "Analyze this answer.",
    );
    return SwotAnswerValidationSchema.parse(result);
  } catch (error) {
    return {
      status: "INVALID",
      reason: "NONSENSE",
      feedback: "I couldn't validate that answer. Please try again.",
    };
  }
}

/**
 * LOGIC: Phase 3 - Simulation
 */
export async function simulateOutcome(
  problem: string,
  decision: string,
  answers: { s: string; w: string; o: string; t: string },
  userContext?: UserProfile,
): Promise<SimulationResult> {
  let userProfileStr = "Generic User";
  if (userContext) {
    userProfileStr = `Bio: ${userContext.occupation || "Unknown"}, Risk Tolerance: ${userContext.risk_tolerance || "MEDIUM"}`;
  }
  const contextBlock = `
    Problem: ${problem}
    Decision: ${decision}
    User Profile: ${userProfileStr}
    User's Analysis:
    - Strengths: ${answers.s}
    - Weaknesses: ${answers.w}
    - Opportunities: ${answers.o}
    - Threats: ${answers.t}
  `;

  const systemPrompt = `
    You are a Predictive Engine.
    Analyze the user's SWOT data.
    PERSONALIZATION RULES:
    - Adjust the 'Probability' based on the User Profile. For example, if User is 'Low Risk Tolerance', highlight 'Safety' in the narrative.
    RETURN JSON MATCHING THIS EXACT STRUCTURE:
    {
      "status": "VALID",
      "decision_id": "optional-id",
      "predicted_outcome": "Narrative of the most likely future.",
      "probability": 75, // Number 0-100
    }
  `;

  try {
    const result = await generateStructured(systemPrompt, contextBlock);
    return SimulationSchema.parse(result);
  } catch (error) {
    return {
      status: "INVALID",
      reason: "TOO_VAGUE",
      guidance: "I need more detail to simulate an outcome.",
    };
  }
}
