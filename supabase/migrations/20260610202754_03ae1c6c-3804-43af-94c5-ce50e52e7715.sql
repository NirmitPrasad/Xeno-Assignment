CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  city TEXT,
  tags TEXT[] DEFAULT '{}',
  total_orders INT NOT NULL DEFAULT 0,
  total_spent NUMERIC NOT NULL DEFAULT 0,
  last_order_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  price NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.orders(customer_id);

CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  segment_query TEXT,
  segment_description TEXT,
  message_template TEXT,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp','sms','email','rcs')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','running','completed','failed')),
  total_recipients INT NOT NULL DEFAULT 0,
  created_by_ai BOOLEAN NOT NULL DEFAULT true,
  ai_insight TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  personalised_text TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','delivered','failed','opened','read','clicked','retrying')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  retry_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.messages(campaign_id);
CREATE INDEX ON public.messages(customer_id);

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.events(message_id);

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

GRANT SELECT ON public.customers, public.products, public.orders, public.campaigns, public.messages, public.events, public.message_templates TO anon, authenticated;
GRANT ALL ON public.customers, public.products, public.orders, public.campaigns, public.messages, public.events, public.message_templates, public.contact_submissions, public.newsletter_subscribers TO service_role;

ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read customers" ON public.customers FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read orders" ON public.orders FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read campaigns" ON public.campaigns FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read messages" ON public.messages FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read events" ON public.events FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public read templates" ON public.message_templates FOR SELECT TO anon, authenticated USING (true);

CREATE OR REPLACE FUNCTION public.exec_sql_select(q text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF q !~* '^\s*select\s' THEN
    RAISE EXCEPTION 'Only SELECT queries allowed';
  END IF;
  IF q ~* '(;|--|insert|update|delete|drop|alter|truncate|grant|create|copy)' THEN
    RAISE EXCEPTION 'Unsafe SQL detected';
  END IF;
  RETURN QUERY EXECUTE 'SELECT row_to_json(t) FROM (' || q || ') t';
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql_select(text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql_select(text) TO service_role;

INSERT INTO public.message_templates (name, channel, body, description) VALUES
  ('Win-back offer', 'whatsapp', 'Hi {name}, we miss you in {city}! Here''s 20% off your next order — code COMEBACK20.', 'Re-engage lapsed customers'),
  ('VIP thank-you', 'email', 'Dear {name}, thank you for being a Lumière VIP. Enjoy early access to our new serum collection.', 'Reward top spenders'),
  ('Diwali offer', 'whatsapp', 'Happy Diwali {name}! ✨ Light up your routine with 25% off premium serums.', 'Festive seasonal blast');
