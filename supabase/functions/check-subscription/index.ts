import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

    const { subscriptionId, rawPaynowResponse } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('id', subscriptionId)
      .single();

    if (subError || !subscription) throw new Error("Subscription not found");

    // If it's already paid, we return success
    if (subscription.status === 'paid') {
      return new Response(JSON.stringify({ status: 'paid' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Helper function to upgrade subscription status and user profile
    const upgradeSubscription = async () => {
      console.log(`[check-subscription] Upgrading subscription ${subscriptionId} and user ${subscription.user_id} to Chana Gold Premium`);
      // 1. Update subscription status
      await supabase.from('subscriptions').update({ status: 'paid' }).eq('id', subscriptionId);
      
      // 2. Calculate Expiry Date
      const now = new Date();
      const expiryDate = new Date();
      if (subscription.plan_id === 'weekly') {
          expiryDate.setDate(now.getDate() + 7);
      } else if (subscription.plan_id === 'monthly') {
          expiryDate.setDate(now.getDate() + 30);
      }

      // 3. UPGRADE USER with Expiry
      const { error: profileErr } = await supabase.from('profiles').update({ 
          is_premium: true,
          premium_until: expiryDate.toISOString()
      }).eq('id', subscription.user_id);

      if (profileErr) {
        console.error(`[check-subscription] Error upgrading user profile:`, profileErr);
      } else {
        console.log(`[check-subscription] User profile successfully upgraded until ${expiryDate.toISOString()}`);
      }
    };

    // PROCESS PROXIED RESPONSE FROM CLIENT (IP-bypass method)
    if (rawPaynowResponse) {
      console.log(`[check-subscription] Processing rawPaynowResponse from client: ${rawPaynowResponse}`);
      const params = new URLSearchParams(rawPaynowResponse);
      const status = params.get('status')?.toLowerCase()?.trim();
      console.log(`[check-subscription] Client-proxied Paynow payment status: "${status}"`);

      if (status === 'paid' || status === 'ok' || status === 'awaiting delivery') {
          await upgradeSubscription();
          return new Response(JSON.stringify({ status: 'paid' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      } else if (status === 'failed' || status === 'cancelled' || status === 'refused' || status === 'error') {
          console.log(`[check-subscription] Client-proxied payment failed/cancelled. Updating status to failed.`);
          await supabase.from('subscriptions').update({ status: 'failed' }).eq('id', subscriptionId);
          return new Response(JSON.stringify({ 
              status: 'failed', 
              error: params.get('error') || 'Transaction failed or was cancelled.' 
          }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
    } else {
      console.log(`[check-subscription] No rawPaynowResponse received in request body. Falling back to server fetch.`);
    }

    // FALLBACK SERVER-SIDE FETCH (May fail if cloud IP is blocked by Paynow)
    if (subscription.poll_url) {
        console.log(`[check-subscription] Fetching poll_url from server: ${subscription.poll_url}`);
        try {
          const resp = await fetch(subscription.poll_url, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              }
          });
          const text = await resp.text();
          console.log(`[check-subscription] Server-side Paynow raw response: ${text}`);
          const params = new URLSearchParams(text);
          const status = params.get('status')?.toLowerCase()?.trim();
          console.log(`[check-subscription] Server-side Paynow payment status: "${status}"`);

          if (status === 'paid' || status === 'ok' || status === 'awaiting delivery') {
              await upgradeSubscription();
              return new Response(JSON.stringify({ status: 'paid' }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
          } else if (status === 'failed' || status === 'cancelled' || status === 'refused' || status === 'error') {
              console.log(`[check-subscription] Server-side payment failed/cancelled. Updating status to failed.`);
              await supabase.from('subscriptions').update({ status: 'failed' }).eq('id', subscriptionId);
              return new Response(JSON.stringify({ 
                  status: 'failed', 
                  error: params.get('error') || 'Transaction failed or was cancelled.' 
              }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
              });
          }
        } catch (fetchErr) {
          console.error('[check-subscription] Server-side fetch failed:', fetchErr);
        }
    } else {
      console.log(`[check-subscription] No poll_url is set in the subscription record yet.`);
    }

    return new Response(JSON.stringify({ status: subscription.status }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
