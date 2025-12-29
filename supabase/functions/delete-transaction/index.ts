import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature',
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

  if (req.method !== 'DELETE' && req.method !== 'POST') {
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

    const body = JSON.parse(bodyText)
    const { phone, transaction_id } = body

    if (!phone || !transaction_id) {
      return new Response(
        JSON.stringify({ error: 'Phone and transaction_id are required' }),
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
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id

    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, amount, type, description')
      .eq('id', transaction_id)
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction_id)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error deleting transaction:', deleteError)
      return new Response(
        JSON.stringify({ error: 'Failed to delete transaction' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const emoji = transaction.type === 'income' ? '💰' : '💸'
    const message = `🗑️ Transação excluída: ${emoji} R$ ${Number(transaction.amount).toFixed(2)} - ${transaction.description}`

    console.log('Transaction deleted:', transaction_id)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        deleted: {
          id: transaction.id,
          amount: transaction.amount,
          type: transaction.type,
          description: transaction.description
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete transaction error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})