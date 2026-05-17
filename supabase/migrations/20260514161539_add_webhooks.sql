-- Migration: Add Webhooks for Notifications
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 1. On Like
CREATE OR REPLACE TRIGGER "on_like_webhook"
AFTER INSERT ON "public"."swipes"
FOR EACH ROW
WHEN (NEW.type IN ('like', 'superlike'))
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'https://abkqqqldqihhxkylidbu.supabase.co/functions/v1/notify-on-like',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);

-- 2. On Match
CREATE OR REPLACE TRIGGER "on_match_webhook"
AFTER INSERT ON "public"."matches"
FOR EACH ROW
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'https://abkqqqldqihhxkylidbu.supabase.co/functions/v1/notify-on-match',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);

-- 3. On Message
CREATE OR REPLACE TRIGGER "on_message_webhook"
AFTER INSERT ON "public"."messages"
FOR EACH ROW
EXECUTE FUNCTION "supabase_functions"."http_request"(
  'https://abkqqqldqihhxkylidbu.supabase.co/functions/v1/notify-on-message',
  'POST',
  '{"Content-Type":"application/json"}',
  '{}',
  '1000'
);
