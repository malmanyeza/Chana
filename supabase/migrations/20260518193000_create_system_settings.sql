-- Migration: Create system_settings table for dynamic app configurations

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Select policy: Anyone can read system settings
CREATE POLICY "Anyone can read system settings." ON public.system_settings
    FOR SELECT USING (true);

-- Insert/Update/Delete policy: Authenticated users can modify system settings
CREATE POLICY "Authenticated users can modify system settings." ON public.system_settings
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

-- Seed default settings
INSERT INTO public.system_settings (key, value)
VALUES 
    ('free_swipes_limit', '20')
ON CONFLICT (key) DO NOTHING;
