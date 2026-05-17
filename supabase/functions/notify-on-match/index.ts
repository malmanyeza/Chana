import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

serve(async (req) => {
  try {
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

    const { user1_id, user2_id, id: matchId } = record;
    if (!user1_id || !user2_id) {
      return new Response(JSON.stringify({ error: "Missing user IDs in record", record }), { status: 400 });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: "Missing environment variables on server", url: !!supabaseUrl, key: !!supabaseKey }), { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log(`Processing match ${matchId} between ${user1_id} and ${user2_id}`);
    
    // Fetch both profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name, push_token')
      .in('id', [user1_id, user2_id]);

    if (profileError) {
      console.error("Match Notification Error (Supabase Error):", profileError);
      return new Response(JSON.stringify({ error: "Database error fetching profiles", details: profileError }), { status: 200 });
    }

    if (!profiles || profiles.length === 0) {
      console.error(`Match Notification Error: No profiles found for IDs ${user1_id} and ${user2_id}`);
      return new Response("Could not find profiles", { status: 200 });
    }

    console.log(`Found ${profiles.length} profiles.`);

    const p1 = profiles.find(p => p.id === user1_id);
    const p2 = profiles.find(p => p.id === user2_id);

    const p1Name = p1?.full_name?.split(' ')[0] ?? "Someone";
    const p2Name = p2?.full_name?.split(' ')[0] ?? "Someone";

    const notifications = [];

    if (user1_id === user2_id) {
      // Self-test case
      if (p1?.push_token) {
        notifications.push({
          to: p1.push_token,
          title: "It's a Match! ❤️",
          body: `You matched with yourself! (Test Successful)`,
          data: { type: 'test', matchId },
        });
      }
    } else {
      // Normal match case
      if (p1?.push_token) {
        console.log(`User 1 (${user1_id}) has token. Preparing notification...`);
        notifications.push({
          to: p1.push_token,
          title: "It's a Match! ❤️",
          body: `You and ${p2Name} matched! Say hi!`,
          data: { type: 'match', matchId, partnerId: user2_id },
          priority: 'high',
          sound: 'default',
          channelId: 'default',
        });
      } else {
        console.log(`User 1 (${user1_id}) is missing a push token.`);
      }

      if (p2?.push_token) {
        console.log(`User 2 (${user2_id}) has token. Preparing notification...`);
        notifications.push({
          to: p2.push_token,
          title: "It's a Match! ❤️",
          body: `You and ${p1Name} matched! Say hi!`,
          data: { type: 'match', matchId, partnerId: user1_id },
          priority: 'high',
          sound: 'default',
          channelId: 'default',
        });
      } else {
        console.log(`User 2 (${user2_id}) is missing a push token.`);
      }
    }

    const expoResults = [];
    if (notifications.length > 0) {
      console.log(`Sending ${notifications.length} match notifications individually...`);
      
      for (const notification of notifications) {
        try {
          const res = await fetch(EXPO_PUSH_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(notification),
          });
          const resData = await res.json();
          console.log(`Notification sent to ${notification.to}. Response:`, resData);
          expoResults.push({ to: notification.to, response: resData });
        } catch (pushError) {
          console.error(`Failed to send notification to ${notification.to}:`, pushError);
          expoResults.push({ to: notification.to, error: pushError.message });
        }
      }
    } else {
      console.log("No push tokens found for either user in match.");
    }

    return new Response(JSON.stringify({ 
      processed: notifications.length,
      results: expoResults
    }), { 
      headers: { "Content-Type": "application/json" },
      status: 200 
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
