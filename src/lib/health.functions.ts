import { createServerFn } from "@tanstack/react-start";

export const checkEnvHealth = createServerFn({ method: "GET" }).handler(async () => {
  try {
    console.log(`[Roastery-System] Running backend barista health check...`);
    const required = [
      "SUPABASE_URL",
      "SUPABASE_PUBLISHABLE_KEY",
      "SUPABASE_SERVICE_ROLE_KEY",
      "GEMINI_API_KEY",
    ] as const;
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      console.warn(`[Roastery-System] Missing crucial environment beans: ${missing.join(", ")}`);
    } else {
      console.log(`[Roastery-System] All system beans are perfectly roasted.`);
    }
    return { ok: missing.length === 0, missing };
  } catch (err: any) {
    console.error(`[Roastery-System] Health check failed:`, err);
    throw new Error(`[Roastery-System-Error] Failed to execute health check: ${err.message}`);
  }
});
