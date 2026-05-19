-- Trigger function to automatically expire premium status on profiles
CREATE OR REPLACE FUNCTION public.check_premium_expiry_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_premium is true but premium_until has passed, automatically flip is_premium to false
    IF NEW.is_premium = TRUE AND NEW.premium_until IS NOT NULL AND NEW.premium_until < NOW() THEN
        NEW.is_premium := FALSE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook trigger BEFORE INSERT OR UPDATE ON profiles
DROP TRIGGER IF EXISTS ensure_premium_expiry ON public.profiles;
CREATE TRIGGER ensure_premium_expiry
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.check_premium_expiry_trigger();
