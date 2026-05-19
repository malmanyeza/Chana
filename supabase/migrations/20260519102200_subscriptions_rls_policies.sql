-- Enable Row Level Security on subscriptions table
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Select policy: Users can read their own subscriptions
DROP POLICY IF EXISTS "Users can read their own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can read their own subscriptions."
ON public.subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- Insert policy: Users can create their own subscriptions
DROP POLICY IF EXISTS "Users can create their own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can create their own subscriptions."
ON public.subscriptions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Update policy: Users can update their own subscriptions (needed for poll_url and cancel actions)
DROP POLICY IF EXISTS "Users can update their own subscriptions." ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions."
ON public.subscriptions
FOR UPDATE
USING (auth.uid() = user_id);
