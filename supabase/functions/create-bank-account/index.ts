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

const defaultColors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#64748b', '#10b981', '#6366f1'
]

const defaultIcons = [
  'building-2', 'landmark', 'wallet', 'piggy-bank', 'banknote'
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { phone, name, bank_name, icon, color } = await req.json()

    if (!phone || !name) {
      return new Response(
        JSON.stringify({ error: 'Phone and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    console.log(`Creating bank account "${name}" for phone: ${normalizedPhone}`)

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

    // Verificar tipo de conta do usuário
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('account_type')
      .eq('user_id', whatsappData.user_id)
      .maybeSingle()

    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Buscar limites do plano
    const { data: planLimit } = await supabase
      .from('plan_limits')
      .select('limit_value, is_unlimited')
      .eq('plan_id', profileData.account_type)
      .eq('feature_key', 'bank_accounts')
      .maybeSingle()

    // Contar contas existentes
    const { count: currentCount } = await supabase
      .from('bank_accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', whatsappData.user_id)

    const accountCount = currentCount || 0

    // Verificar se pode criar mais contas
    if (planLimit && !planLimit.is_unlimited && planLimit.limit_value !== null) {
      if (accountCount >= planLimit.limit_value) {
        console.log(`User ${whatsappData.user_id} reached bank account limit: ${accountCount}/${planLimit.limit_value}`)
        return new Response(
          JSON.stringify({ 
            error: 'Limit reached',
            message: `Você atingiu o limite de ${planLimit.limit_value} conta(s) bancária(s) do seu plano. Faça upgrade para adicionar mais contas.`,
            current_count: accountCount,
            limit: planLimit.limit_value,
            account_type: profileData.account_type
          }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    console.log(`User account type: ${profileData.account_type}, current accounts: ${accountCount}, proceeding with creation`)

    // Verificar se já existe conta com mesmo nome
    const { data: existingAccount } = await supabase
      .from('bank_accounts')
      .select('id, name')
      .eq('user_id', whatsappData.user_id)
      .ilike('name', name)
      .maybeSingle()

    if (existingAccount) {
      console.log('Bank account already exists:', existingAccount.id)
      return new Response(
        JSON.stringify({
          success: true,
          account_id: existingAccount.id,
          name: existingAccount.name,
          message: 'Bank account already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)]
    const randomIcon = defaultIcons[Math.floor(Math.random() * defaultIcons.length)]
    
    const { data: newAccount, error: insertError } = await supabase
      .from('bank_accounts')
      .insert({
        user_id: whatsappData.user_id,
        name: name,
        bank_name: bank_name || null,
        icon: icon || randomIcon,
        color: color || randomColor
      })
      .select('id, name, bank_name, icon, color')
      .single()

    if (insertError) {
      console.error('Error creating bank account:', insertError)
      throw insertError
    }

    console.log('Bank account created:', newAccount.id)
    return new Response(
      JSON.stringify({
        success: true,
        account_id: newAccount.id,
        name: newAccount.name,
        bank_name: newAccount.bank_name,
        icon: newAccount.icon,
        color: newAccount.color,
        message: 'Bank account created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-bank-account:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})