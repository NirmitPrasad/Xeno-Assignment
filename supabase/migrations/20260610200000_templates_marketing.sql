CREATE TABLE public.message_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email','rcs')),
  body TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.message_templates TO anon, authenticated;
GRANT ALL ON public.message_templates TO service_role;
GRANT ALL ON public.contact_submissions TO service_role;
GRANT ALL ON public.newsletter_subscribers TO service_role;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read templates" ON public.message_templates FOR SELECT TO anon, authenticated USING (true);
INSERT INTO public.message_templates (name, channel, body, description) VALUES
  ('Win-back offer', 'whatsapp', 'Hi {name}, we miss you in {city}! Here''s 20% off your next order — code COMEBACK20.', 'Re-engage lapsed customers'),
  ('VIP thank-you', 'email', 'Dear {full_name}, thank you for being a Lumière VIP. Enjoy early access to our new serum collection.', 'Reward top spenders'),
  ('Diwali offer', 'whatsapp', 'Happy Diwali {name}! ✨ Light up your routine with 25% off premium serums.', 'Festive seasonal blast');
