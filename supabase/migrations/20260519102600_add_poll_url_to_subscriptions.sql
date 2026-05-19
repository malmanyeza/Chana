-- Add poll_url column to subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS poll_url TEXT;

-- Reload the PostgREST schema cache
NOTIFY pgrst, 'reload schema';
