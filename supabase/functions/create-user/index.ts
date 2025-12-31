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

    const { phone, name } = await req.json()

    if (!phone || !name) {
      return new Response(
        JSON.stringify({ error: 'Phone and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    console.log(`Creating user: ${name} with phone: ${normalizedPhone}`)

    const { data: existing } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'User already exists', user_id: existing.user_id }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      phone: normalizedPhone,
      phone_confirm: true,
      user_metadata: {
        full_name: name,
        phone: normalizedPhone
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      throw authError
    }

    console.log('User created successfully:', authData.user.id)

    return new Response(
      JSON.stringify({
        success: true,
        user_id: authData.user.id,
        message: 'User created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-user:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})