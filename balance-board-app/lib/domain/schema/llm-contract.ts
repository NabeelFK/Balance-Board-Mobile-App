import { z } from "zod";

// The LLM Output for "Generate SWOT Questions"
export const SwotQuestionnaireSchema = z.object({
  decision_target: z.string().describe("The specific decision being analyzed"),

  // We force the LLM to ask 1 probing question per quadrant
  questions: z.object({
    strength_q: z
      .string()
      .describe(
        "Question checking if this leverages user's specific advantage.",
      ),
    weakness_q: z
      .string()
      .describe("Question probing for a specific vulnerability."),
    opportunity_q: z
      .string()
      .describe("Question about potential upside or external gain."),
    threat_q: z.string().describe("Question about external risks or blockers."),
  }),
});
