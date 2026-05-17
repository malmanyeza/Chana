import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    const { record, old_record, type } = await req.json();

    // Only process INSERTs of likes/superlikes
    if (type !== 'INSERT' || (record.type !== 'like' && record.type !== 'superlike')) {
      return new Response("Not a like/superlike insert", { status: 200 });
    }

    const swiperId = record.swiper_id;
    const swipedId = record.swiped_id;

    // Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    console.log(`Processing like from ${swiperId} to ${swipedId}`);

    if (swiperId === swipedId) {
      console.log("Swiper is same as swiped, skipping notification");
      return new Response("Self-like, skipping notification", { status: 200 });
    }

    // 0. Check for mutual like (to avoid double notification with Match)
    const { data: mutualLike } = await supabase
      .from('swipes')
      .select('id')
      .eq('swiper_id', swipedId)
      .eq('swiped_id', swiperId)
      .in('type', ['like', 'superlike'])
      .single();

    if (mutualLike) {
      console.log(`Mutual like detected between ${swiperId} and ${swipedId}. Skipping Like notification to let Match notification handle it.`);
      return new Response("Mutual like, skipping for Match notification", { status: 200 });
    }

    // 1. Fetch recipient's push token
    const { data: recipient, error: recError } = await supabase
      .from('profiles')
      .select('push_token, full_name')
      .eq('id', swipedId)
      .single();

    if (recError || !recipient?.push_token) {
      console.log(`No push token for recipient ${swipedId}`);
      return new Response("No push token for recipient", { status: 200 });
    }

    // 2. Fetch sender's name
    const { data: sender } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', swiperId)
      .single();

    console.log(`Sending like notification to ${recipient.full_name} from ${sender?.full_name}`);

    const senderFirstName = sender?.full_name?.split(' ')[0] ?? "Someone";
    const title = record.type === 'superlike' ? "Super Like! 🌟" : "New Like! ❤️";
    const body = record.type === 'superlike' 
      ? `${senderFirstName} super liked you! 🌟` 
      : `${senderFirstName} liked your profile! ❤️`;

    // 3. Send to Expo
    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient.push_token,
        title,
        body,
        data: { type: 'like', swiperId },
        priority: 'high',
        sound: 'default',
        channelId: 'default',
      }),
    });
    
    const expoData = await expoResponse.json();
    console.log("Expo Response:", expoData);

    return new Response(JSON.stringify(expoData), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
