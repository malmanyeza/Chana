import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const paynowId = Deno.env.get('PAYNOW_INTEGRATION_ID') || '';
    const paynowKey = Deno.env.get('PAYNOW_INTEGRATION_KEY') || '';

    const authHeader = req.headers.get('Authorization') || '';
    const jwt = authHeader.replace('Bearer ', '');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) throw new Error("Unauthorized");

    const { planId, phone, paymentMethod = 'ecocash' } = await req.json();
    const amount = planId === 'weekly' ? 1.00 : 3.00;

    // 1. Create subscription record
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        plan_id: planId,
        amount: amount,
        status: 'pending',
        payment_method: paymentMethod // Track method
      })
      .select()
      .single();

    if (subError) throw subError;

    // 2. Prepare Paynow fields
    const resultUrl = `${supabaseUrl}/functions/v1/paynow-webhook`;
    const returnUrl = paymentMethod === 'card' 
      ? `https://chana.dating/payment-complete?id=${subscription.id}` // App return URL
      : resultUrl;

    const initFields: Record<string, string> = {
      resulturl: resultUrl,
      returnurl: returnUrl,
      reference: subscription.id,
      amount: amount.toFixed(2),
      id: paynowId,
      additionalinfo: `Chana Gold ${planId}`,
      authemail: 'malmanyeza@gmail.com', // Merchant email
      status: 'Message'
    };

    const initFieldOrder = ['resulturl', 'returnurl', 'reference', 'amount', 'id', 'additionalinfo', 'authemail', 'status'];
    let hashString = "";
    for (const k of initFieldOrder) {
      hashString += initFields[k];
    }
    hashString += paynowKey;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
    initFields.hash = toHex(hashBuffer);

    return new Response(JSON.stringify({
      success: true,
      subscriptionId: subscription.id,
      paynow: {
        initUrl: 'https://www.paynow.co.zw/interface/initiatetransaction',
        initFields: initFields,
        initFieldOrder: [...initFieldOrder, 'hash'],
        expressUrl: 'https://www.paynow.co.zw/interface/remotetransaction',
        phone: phone,
        method: 'ecocash'
      }
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
