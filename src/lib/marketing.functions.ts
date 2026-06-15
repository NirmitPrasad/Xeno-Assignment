import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const ContactInput = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  message: z.string().trim().min(1).max(2000),
});

export const submitContact = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ContactInput.parse(input))
  .handler(async ({ data: { name, email, message } }) => {
    try {
      console.log(`[Cafe-Marketing-Engine] Processing contact submission from ${email}...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error } = await (supabaseAdmin as any).from("contact_submissions").insert({ name, email, message });
      if (error) throw new Error(error.message);
      console.log(`[Cafe-Marketing-Engine] Contact submission logged.`);
      return { ok: true };
    } catch (err: any) {
      console.error(`[Cafe-Marketing-Engine] Error processing contact submission:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to submit contact form: ${err.message}`);
    }
  });

const NewsletterInput = z.object({
  email: z.string().trim().email().max(255),
});

export const subscribeNewsletter = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => NewsletterInput.parse(input))
  .handler(async ({ data: { email } }) => {
    try {
      console.log(`[Cafe-Marketing-Engine] Adding ${email} to our coffee newsletter...`);
      const { supabaseAdmin } = await import("@/lib/supabase");
      const { error } = await (supabaseAdmin as any)
        .from("newsletter_subscribers")
        .upsert({ email: email.toLowerCase() }, { onConflict: "email" });
      if (error) throw new Error(error.message);
      console.log(`[Cafe-Marketing-Engine] Newsletter subscription confirmed.`);
      return { ok: true };
    } catch (err: any) {
      console.error(`[Cafe-Marketing-Engine] Error subscribing to newsletter:`, err);
      throw new Error(`[Roastery-DB-Error] Failed to subscribe to newsletter: ${err.message}`);
    }
  });
