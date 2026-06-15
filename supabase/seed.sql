-- Seed initial coffee-chain marketing templates
INSERT INTO public.message_templates (name, channel, body, description) VALUES
  (
    'Morning Brew Win-Back', 
    'whatsapp', 
    'Hi {name}, we miss your morning routine at our {city} cafe! ☕ Here''s 20% off your next Artisanal Cold Brew or Espresso order — code BREWBACK20.', 
    'Re-engage lapsed cafe guests who haven''t ordered a beverage recently'
  ),
  (
    'Roastery VIP Perks', 
    'email', 
    'Dear {full_name}, thank you for being a valued Gold-Tier Roastery Member. Enjoy early access to our limited-batch single-origin Monsoon Malabar coffee bean allocation.', 
    'Reward top-spending customer tiers with exclusive loyalty privileges'
  ),
  (
    'Monsoon Matcha Blast', 
    'whatsapp', 
    'Happy Monsoon season {name}! 🌧️ Warm up your day with a complimentary extra shot or syrup upgrade on any Large Specialty Latte or Matcha order today.', 
    'Seasonal weather-targeted behavioral broadcast'
  )
ON CONFLICT DO NOTHING;