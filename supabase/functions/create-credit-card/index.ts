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

const bankColors: Record<string, string> = {
  'nubank': '#8B5CF6',
  'inter': '#FF7A00',
  'itau': '#003399',
  'itaú': '#003399',
  'bradesco': '#CC092F',
  'santander': '#EC0000',
  'banco do brasil': '#FFCC00',
  'bb': '#FFCC00',
  'caixa': '#005CA9',
  'c6': '#1A1A1A',
  'next': '#00FF87',
  'neon': '#00D4FF',
  'picpay': '#21C25E',
  'mercado pago': '#00BCFF',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { phone, bank, limit, name, closing_day, due_day, last_four_digits } = await req.json()

    if (!phone || !bank) {
      return new Response(
        JSON.stringify({ error: 'Phone and bank are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    console.log(`Creating credit card "${bank}" for phone: ${normalizedPhone}`)

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

    const userId = whatsappData.user_id

    // Get user's account type
    const { data: profileData } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', userId)
      .single()

    const accountType = profileData?.account_type || 'free'

    // Get plan limits for credit cards
    const { data: limitData } = await supabase
      .from('plan_limits')
      .select('limit_value, is_unlimited')
      .eq('plan_id', accountType)
      .eq('feature_key', 'credit_cards')
      .single()

    const isUnlimited = limitData?.is_unlimited || false
    const maxCards = limitData?.limit_value || 1

    // Count current credit cards
    const { count: currentCount } = await supabase
      .from('credit_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true)

    const cardCount = currentCount || 0

    // Check if user can create more cards
    if (!isUnlimited && cardCount >= maxCards) {
      console.log(`User ${userId} reached credit card limit: ${cardCount}/${maxCards}`)
      return new Response(
        JSON.stringify({ 
          error: 'Limite de cartões atingido',
          message: `Você atingiu o limite de ${maxCards} cartão(ões) do seu plano. Faça upgrade para adicionar mais cartões.`,
          current: cardCount,
          limit: maxCards,
          plan: accountType
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const bankLower = bank.toLowerCase()
    const cardColor = bankColors[bankLower] || '#6366f1'

    const { data: newCard, error: insertError } = await supabase
      .from('credit_cards')
      .insert({
        user_id: userId,
        name: name || bank,
        bank_name: bank,
        credit_limit: limit || 0,
        current_balance: 0,
        color: cardColor,
        closing_day: closing_day || null,
        due_day: due_day || null,
        last_four_digits: last_four_digits || null,
        is_active: true
      })
      .select('id, name, bank_name, credit_limit')
      .single()

    if (insertError) {
      console.error('Error creating credit card:', insertError)
      throw insertError
    }

    console.log('Credit card created:', newCard.id)
    return new Response(
      JSON.stringify({
        success: true,
        card_id: newCard.id,
        name: newCard.name,
        bank: newCard.bank_name,
        limit: newCard.credit_limit,
        message: 'Credit card created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-credit-card:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})