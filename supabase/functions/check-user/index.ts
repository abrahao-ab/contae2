import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '')
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('55')) {
      normalized = '+' + normalized
    } else {
      normalized = '+55' + normalized
    }
  }
  return normalized
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const url = new URL(req.url)
    const phone = url.searchParams.get('phone')

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    console.log(`Checking user with phone: ${normalizedPhone}`)

    const { data: whatsappData, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (whatsappError) {
      console.error('Error checking whatsapp_numbers:', whatsappError)
      throw whatsappError
    }

    if (!whatsappData) {
      console.log('User not found')
      return new Response(
        JSON.stringify({ exists: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', whatsappData.user_id)
      .maybeSingle()

    if (profileError) {
      console.error('Error checking profile:', profileError)
    }

    console.log('User found:', whatsappData.user_id)
    return new Response(
      JSON.stringify({
        exists: true,
        user_id: whatsappData.user_id,
        status: 'active',
        account_type: profileData?.account_type || 'free'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in check-user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})