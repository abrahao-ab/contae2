import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
}

interface CreateTransactionBody {
  phone: string
  amount: number
  type: 'income' | 'expense'
  description?: string
  category_name?: string
  date?: string
  source?: 'web' | 'whatsapp_text' | 'whatsapp_voice' | 'whatsapp_image'
}

async function verifyWebhookSignature(req: Request, body: string): Promise<boolean> {
  const signature = req.headers.get('x-webhook-signature')
  const secret = Deno.env.get('WEBHOOK_SECRET')
  
  if (!secret) {
    console.error('WEBHOOK_SECRET not configured')
    return false
  }
  
  if (!signature) {
    console.error('Missing x-webhook-signature header')
    return false
  }
  
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    
    const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(body))
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBytes)))
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying signature:', error)
    return false
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const bodyText = await req.text()
    
    // Verificar assinatura HMAC
    const isValid = await verifyWebhookSignature(req, bodyText)
    if (!isValid) {
      console.error('Invalid webhook signature')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: CreateTransactionBody = JSON.parse(bodyText)
    console.log('Create transaction request:', JSON.stringify(body))

    const { phone, amount, type, description, category_name, date, source = 'whatsapp_text' } = body

    if (!phone || !amount || !type) {
      return new Response(
        JSON.stringify({ error: 'Phone, amount, and type are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (type !== 'income' && type !== 'expense') {
      return new Response(
        JSON.stringify({ error: 'Type must be "income" or "expense"' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (whatsappError || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'User not found', message: 'Usuário não encontrado para este telefone' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id

    let categoryId = null
    if (category_name) {
      const { data: categories } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', userId)

      if (categories) {
        const matchedCategory = categories.find(
          c => c.name.toLowerCase() === category_name.toLowerCase() ||
               c.name.toLowerCase().includes(category_name.toLowerCase())
        )
        if (matchedCategory) {
          categoryId = matchedCategory.id
        }
      }
    }

    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: Math.abs(amount),
        type,
        description: description || (type === 'income' ? 'Receita' : 'Despesa'),
        category_id: categoryId,
        source,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Error creating transaction:', transactionError)
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction', details: transactionError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emoji = type === 'income' ? '💰' : '💸'
    const message = `${emoji} ${type === 'income' ? 'Receita' : 'Despesa'} de R$ ${Math.abs(amount).toFixed(2)} registrada com sucesso!`

    console.log('Transaction created:', transaction.id)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        transaction: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description,
          date: transaction.date,
          category_id: categoryId
        }
      }),
      { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Create transaction error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})