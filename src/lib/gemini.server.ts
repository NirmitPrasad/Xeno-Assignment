import { createGoogleGenerativeAI } from "@ai-sdk/google";

const DEFAULT_MODEL = "gemini-2.5-flash";

export function getGeminiApiKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing GEMINI_API_KEY");
  return key;
}

export function getGeminiModel() {
  const modelId = process.env.GEMINI_MODEL ?? DEFAULT_MODEL;
  return createGoogleGenerativeAI({ apiKey: getGeminiApiKey() })(modelId);
}
