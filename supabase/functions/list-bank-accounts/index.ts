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
    console.log(`Listing bank accounts for phone: ${normalizedPhone}`)

    // Buscar user_id pelo telefone
    const { data: whatsappData, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (whatsappError || !whatsappData) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar contas bancárias do usuário
    const { data: accounts, error: accountsError } = await supabase
      .from('bank_accounts')
      .select('id, name, bank_name, icon, color, created_at')
      .eq('user_id', whatsappData.user_id)
      .order('name')

    if (accountsError) {
      console.error('Error fetching bank accounts:', accountsError)
      throw accountsError
    }

    // Buscar limites do plano para informar ao usuário
    const { data: profileData } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', whatsappData.user_id)
      .maybeSingle()

    let limitInfo = null
    if (profileData) {
      const { data: planLimit } = await supabase
        .from('plan_limits')
        .select('limit_value, is_unlimited')
        .eq('plan_id', profileData.account_type)
        .eq('feature_key', 'bank_accounts')
        .maybeSingle()

      if (planLimit) {
        limitInfo = {
          current: accounts?.length || 0,
          limit: planLimit.is_unlimited ? null : planLimit.limit_value,
          is_unlimited: planLimit.is_unlimited,
          can_create_more: planLimit.is_unlimited || (accounts?.length || 0) < (planLimit.limit_value || 0)
        }
      }
    }

    console.log(`Found ${accounts?.length || 0} bank accounts`)
    return new Response(
      JSON.stringify({
        success: true,
        user_id: whatsappData.user_id,
        accounts: accounts || [],
        total: accounts?.length || 0,
        limit_info: limitInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in list-bank-accounts:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})