-- Add the country column to the profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;

-- Force Supabase PostgREST to reload the schema cache so the new column is immediately available
NOTIFY pgrst, 'reload schema';
