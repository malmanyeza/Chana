import "jsr:@supabase/functions-js/edge-runtime.d.ts"

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
    const paynowKey = Deno.env.get('PAYNOW_INTEGRATION_KEY') || '';
    const { fields, fieldOrder } = await req.json();

    let hashString = "";
    for (const k of fieldOrder) {
      hashString += fields[k];
    }
    hashString += paynowKey;

    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-512', encoder.encode(hashString));
    const hash = toHex(hashBuffer);

    return new Response(JSON.stringify({ hash }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
