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

    const { subscriptionId } = await req.json();
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

    // In a real app, we would also fetch status from Paynow poll_url here
    if (subscription.poll_url) {
        const resp = await fetch(subscription.poll_url);
        const text = await resp.text();
        const params = new URLSearchParams(text);
        const status = params.get('status')?.toLowerCase();

        if (status === 'paid' || status === 'ok') {
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
            await supabase.from('profiles').update({ 
                is_premium: true,
                premium_until: expiryDate.toISOString()
            }).eq('id', subscription.user_id);
            
            return new Response(JSON.stringify({ status: 'paid' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        } else if (status === 'failed' || status === 'cancelled' || status === 'refused' || status === 'error') {
            // Update DB status to failed
            await supabase.from('subscriptions').update({ status: 'failed' }).eq('id', subscriptionId);
            
            return new Response(JSON.stringify({ 
                status: 'failed', 
                error: params.get('error') || 'Transaction failed or was cancelled.' 
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }
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
