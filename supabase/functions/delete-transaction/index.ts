import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body = await req.json()
    const { phone, transaction_id } = body

    if (!phone || !transaction_id) {
      return new Response(
        JSON.stringify({ error: 'Phone and transaction_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Find user by phone in whatsapp_numbers table
    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', phone)
      .single()

    if (whatsappError || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id

    // Verify transaction belongs to user and get details
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('id, amount, type, description')
      .eq('id', transaction_id)
      .eq('user_id', userId)
      .single()

    if (fetchError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transaction not found or unauthorized' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete transaction
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
