import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const listTemplates = createServerFn({ method: "GET" }).handler(async () => {
  try {
    console.log(`[Roastery-DB-Engine] Loading available coffee message templates...`);
    const { supabaseAdmin } = await import("@/lib/supabase");
    const { data } = await (supabaseAdmin as any)
      .from("message_templates")
      .select("*")
      .order("created_at", { ascending: false });
    console.log(`[Roastery-DB-Engine] Templates loaded successfully.`);
    return (data ?? []) as Array<{
      id: string;
      name: string;
      channel: string;
      body: string;
      description: string | null;
      created_at: string;
    }>;
  } catch (err: any) {
    console.error(`[Roastery-DB-Engine] Error loading templates:`, err);
    throw new Error(`[Roastery-DB-Error] Failed to fetch message templates: ${err.message}`);
  }
});

const TemplateInput = z.object({
  name: z.string().trim().min(1).max(100),
  channel: z.enum(["whatsapp", "sms", "email", "rcs"]),
  body: z.string().trim().min(1).max(2000),
  description: z.string().trim().max(300).optional().nullable(),
});

export const createTemplate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => TemplateInput.parse(input))
  .handler(async ({ data: { name, channel, body, description } }) => {
    try {
      console.log(`[Cafe-Marketing-Engine] Creating new template: ${name}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { data: row, error } = await (supabaseAdmin as any)
        .from("message_templates")
        .insert({
          name,
          channel,
          body,
          description: description ?? null,
        })
        .select()
        .single();
      if (error) throw new Error(error.message);
      console.log(`[Cafe-Marketing-Engine] Template created.`);
      return row;
    } catch (err: any) {
      console.error(`[Cafe-Marketing-Engine] Error creating template:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to create template: ${err.message}`);
    }
  });

export const deleteTemplate = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data: { id } }) => {
    try {
      console.log(`[Cafe-Marketing-Engine] Deleting template ${id}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error } = await (supabaseAdmin as any)
        .from("message_templates")
        .delete()
        .eq("id", id);
      if (error) throw new Error(error.message);
      console.log(`[Cafe-Marketing-Engine] Template deleted.`);
      return { ok: true };
    } catch (err: any) {
      console.error(`[Cafe-Marketing-Engine] Error deleting template:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to delete template: ${err.message}`);
    }
  });
