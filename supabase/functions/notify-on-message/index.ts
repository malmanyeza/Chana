import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
    // 1. Parse and validate request
    const bodyText = await req.text();
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Invalid JSON body", raw: bodyText }), { status: 400 });
    }

    const { record, type } = body;

    if (!record) {
      return new Response(JSON.stringify({ error: "Missing record in payload" }), { status: 400 });
    }

    const { match_id, sender_id, content } = record;

    if (!match_id || !sender_id) {
      return new Response(JSON.stringify({ error: "Missing IDs in record", record }), { status: 400 });
    }

    // 2. Initialize Supabase Client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing env variables" }), { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing message for match ${match_id} from ${sender_id}`);

    // 3. Get the match to find the recipient
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select('user1_id, user2_id')
      .eq('id', match_id)
      .single();

    if (matchError || !match) {
      console.error("Match lookup error:", matchError);
      return new Response("Match not found", { status: 200 });
    }

    const recipientId = match.user1_id === sender_id ? match.user2_id : match.user1_id;

    // 4. Fetch recipient token and sender name
    const [{ data: recipient, error: recError }, { data: sender, error: sendError }] = await Promise.all([
      supabase.from('profiles').select('push_token, full_name').eq('id', recipientId).single(),
      supabase.from('profiles').select('full_name').eq('id', sender_id).single(),
    ]);

    if (recError || !recipient?.push_token) {
      console.log(`No push token for recipient ${recipientId}`);
      return new Response("No push token for recipient", { status: 200 });
    }

    const senderFirstName = sender?.full_name?.split(' ')[0] ?? "Someone";
    
    // 5. Send notification to Expo
    console.log(`Sending message notification to ${recipient.full_name} from ${senderFirstName}`);

    const expoResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipient.push_token,
        title: senderFirstName,
        body: content.length > 100 ? content.substring(0, 97) + "..." : content,
        data: { type: 'message', matchId: match_id, senderId: sender_id },
        priority: 'high',
        sound: 'default',
        channelId: 'default',
      }),
    });

    const expoData = await expoResponse.json();
    console.log("Expo Response:", expoData);

    return new Response(JSON.stringify(expoData), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    });
  } catch (error) {
    console.error("Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
