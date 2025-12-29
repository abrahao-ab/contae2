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

// Cores padrão para novas categorias
const defaultColors = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#64748b', '#10b981', '#6366f1'
]

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    const { phone, name, icon, color } = await req.json()

    if (!phone || !name) {
      return new Response(
        JSON.stringify({ error: 'Phone and name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)
    console.log(`Creating category "${name}" for phone: ${normalizedPhone}`)

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

    // Verificar se categoria já existe
    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', whatsappData.user_id)
      .ilike('name', name)
      .maybeSingle()

    if (existingCategory) {
      console.log('Category already exists:', existingCategory.id)
      return new Response(
        JSON.stringify({
          success: true,
          category_id: existingCategory.id,
          name: existingCategory.name,
          message: 'Category already exists'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Criar nova categoria
    const randomColor = defaultColors[Math.floor(Math.random() * defaultColors.length)]
    
    const { data: newCategory, error: insertError } = await supabase
      .from('categories')
      .insert({
        user_id: whatsappData.user_id,
        name: name,
        icon: icon || 'tag',
        color: color || randomColor,
        is_default: false
      })
      .select('id, name')
      .single()

    if (insertError) {
      console.error('Error creating category:', insertError)
      throw insertError
    }

    console.log('Category created:', newCategory.id)
    return new Response(
      JSON.stringify({
        success: true,
        category_id: newCategory.id,
        name: newCategory.name,
        message: 'Category created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error: any) {
    console.error('Error in create-category:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
