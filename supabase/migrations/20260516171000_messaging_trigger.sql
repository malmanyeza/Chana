-- Migration: Ensure Messaging Push Notifications Trigger
-- Note: This trigger calls the notify-on-message Edge Function.
-- Use this if you want the database to automatically handle notifications.
-- If you encounter libcurl errors, rely on the app-side invocation instead.

CREATE OR REPLACE FUNCTION public.handle_message_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://abkqqqldqihhxkylidbu.supabase.co/functions/v1/notify-on-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFia3FxcWxkcWloaHhreWxpZGJ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4MTQyMDQsImV4cCI6MjA5MzM5MDIwNH0.w0kkGNhdPugThy_8ySY35mvIf6a1fS3HdaKXMmkEKRk'
    ),
    body := jsonb_build_object(
      'record', row_to_json(NEW),
      'type', 'INSERT',
      'table', 'messages',
      'schema', 'public'
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_trigger ON public.messages;

CREATE TRIGGER on_message_trigger
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_message_notification();
