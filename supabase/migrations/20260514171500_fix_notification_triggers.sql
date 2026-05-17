-- Migration: Fix Notification Triggers with Correct Payloads
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Helper function to call Edge Functions with row data
CREATE OR REPLACE FUNCTION public.handle_notification_trigger()
RETURNS TRIGGER AS $$
DECLARE
  payload jsonb;
  function_name text;
BEGIN
  -- Determine which function to call based on the table
  IF TG_TABLE_NAME = 'swipes' THEN
    function_name := 'notify-on-like';
  ELSIF TG_TABLE_NAME = 'matches' THEN
    function_name := 'notify-on-match';
  ELSIF TG_TABLE_NAME = 'messages' THEN
    function_name := 'notify-on-message';
  END IF;

  -- Build the payload expected by the Edge Function
  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'type', TG_OP,
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA
  );

  -- Perform the asynchronous HTTP request
  PERFORM net.http_post(
    url := 'https://abkqqqldqihhxkylidbu.supabase.co/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFia3FxcWxkcWloaHhreWxpZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTQyMDQsImV4cCI6MjA5MzM5MDIwNH0.w0kkGNhdPugThy_8ySY35mvIf6a1fS3HdaKXMmkEKRk'
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Drop old triggers if they exist
DROP TRIGGER IF EXISTS on_like_webhook ON public.swipes;
DROP TRIGGER IF EXISTS on_match_webhook ON public.matches;
DROP TRIGGER IF EXISTS on_message_webhook ON public.messages;

-- 2. Create new triggers using the helper function
CREATE TRIGGER on_like_trigger
AFTER INSERT ON public.swipes
FOR EACH ROW
WHEN (NEW.type IN ('like', 'superlike'))
EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER on_match_trigger
AFTER INSERT ON public.matches
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_trigger();

CREATE TRIGGER on_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_notification_trigger();
