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
    console.log(`Listing credit cards for phone: ${normalizedPhone}`)

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

    // Buscar cartões de crédito do usuário
    const { data: cards, error: cardsError } = await supabase
      .from('credit_cards')
      .select('id, name, bank_name, last_four_digits, credit_limit, current_balance, closing_day, due_day, color, is_active, created_at')
      .eq('user_id', whatsappData.user_id)
      .eq('is_active', true)
      .order('name')

    if (cardsError) {
      console.error('Error fetching credit cards:', cardsError)
      throw cardsError
    }

    // Calcular informações adicionais para cada cartão
    const cardsWithInfo = (cards || []).map(card => ({
      ...card,
      available_credit: card.credit_limit - card.current_balance,
      usage_percentage: card.credit_limit > 0 
        ? Math.round((card.current_balance / card.credit_limit) * 100) 
        : 0
    }))

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
        .eq('feature_key', 'credit_cards')
        .maybeSingle()

      if (planLimit) {
        limitInfo = {
          current: cards?.length || 0,
          limit: planLimit.is_unlimited ? null : planLimit.limit_value,
          is_unlimited: planLimit.is_unlimited,
          can_create_more: planLimit.is_unlimited || (cards?.length || 0) < (planLimit.limit_value || 0)
        }
      }
    }

    // Calcular totais
    const totals = {
      total_limit: cardsWithInfo.reduce((sum, card) => sum + card.credit_limit, 0),
      total_balance: cardsWithInfo.reduce((sum, card) => sum + card.current_balance, 0),
      total_available: cardsWithInfo.reduce((sum, card) => sum + card.available_credit, 0)
    }

    console.log(`Found ${cards?.length || 0} credit cards`)
    return new Response(
      JSON.stringify({
        success: true,
        user_id: whatsappData.user_id,
        cards: cardsWithInfo,
        total: cards?.length || 0,
        totals,
        limit_info: limitInfo
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in list-credit-cards:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
