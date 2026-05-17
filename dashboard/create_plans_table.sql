-- Create the subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  price NUMERIC NOT NULL,
  period TEXT NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read the plans (so the mobile app can fetch them)
CREATE POLICY "Public plans are viewable by everyone." ON subscription_plans
  FOR SELECT USING (true);

-- Allow anonymous users to update the plans (TEMPORARY: because dashboard has no admin login yet)
-- WARNING: In a production app with real money, you MUST restrict this to authenticated admins only.
CREATE POLICY "Allow dashboard to update plans." ON subscription_plans
  FOR UPDATE USING (true);

-- Allow anonymous users to insert plans (TEMPORARY)
CREATE POLICY "Allow dashboard to insert plans." ON subscription_plans
  FOR INSERT WITH CHECK (true);

-- Seed the initial data that was previously hardcoded in the app
INSERT INTO subscription_plans (id, title, price, period, is_popular)
VALUES 
  ('weekly', 'Weekly', 1.00, 'week', false),
  ('monthly', 'Monthly', 3.00, 'month', true)
ON CONFLICT (id) DO NOTHING;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
