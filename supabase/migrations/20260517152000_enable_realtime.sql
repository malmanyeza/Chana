-- Migration: Enable Realtime for swipes, matches, and messages
-- This guarantees instant client-side updates for Likes, Badges, and Match modals.

DO $$
BEGIN
  -- 1. Enable Realtime for swipes (for Likes list & Likes badge count)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'swipes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.swipes;
  END IF;

  -- 2. Enable Realtime for matches (for Matches list & Matches badge count)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'matches'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
  END IF;

  -- 3. Enable Realtime for messages (for instant chat messages & unmessaged matches badge decrement)
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;
END $$;
