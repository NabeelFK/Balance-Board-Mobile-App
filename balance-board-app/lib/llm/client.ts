import OpenAI from "openai";

// 1. Initialize the Client
const API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
if (!API_KEY) {
  throw new Error("Missing OPENAI_API_KEY.");
}
export const openai = new OpenAI({
  apiKey: API_KEY,
  dangerouslyAllowBrowser: false, // Security: Force server-side use only
});

/**
 * 2. The Helper Function (The Wrapper)
 * Enforces JSON mode and handles the basic API handshake.
 */
export async function generateStructured(
  systemPrompt: string,
  userPrompt: string,
  model: string = "gpt-5-mini",
): Promise<any> {
  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt + "\n\nIMPORTANT: Return strictly valid JSON.",
        },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" }, // <--- The "JSON Mode" switch
    });

    const content = response.choices[0].message.content;

    if (!content) {
      throw new Error("LLM returned empty response.");
    }

    // Attempt to parse the JSON
    return JSON.parse(content);
  } catch (error) {
    console.error("LLM Client Error:", error);
    throw error; // Re-throw so the service knows it failed
  }
}
