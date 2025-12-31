import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const phone = url.searchParams.get('phone')
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const type = url.searchParams.get('type')

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone parameter is required' }),
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

    let query = supabase
      .from('transactions')
      .select('id, amount, type, description, date, source, categories(name, icon)')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit)

    if (type === 'income' || type === 'expense') {
      query = query.eq('type', type)
    }

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let message = `📋 *Últimas ${transactions?.length || 0} transações:*\n\n`
    
    transactions?.forEach((t) => {
      const emoji = t.type === 'income' ? '💰' : '💸'
      const sign = t.type === 'income' ? '+' : '-'
      const category = (t.categories as any)?.name || 'Sem categoria'
      message += `${emoji} ${sign}R$ ${Number(t.amount).toFixed(2)}\n`
      message += `   ${t.description || 'Sem descrição'}\n`
      message += `   📁 ${category} | 📅 ${t.date}\n\n`
    })

    console.log('Transactions listed for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: {
          count: transactions?.length || 0,
          transactions: transactions?.map(t => ({
            id: t.id,
            amount: Number(t.amount),
            type: t.type,
            description: t.description,
            date: t.date,
            source: t.source,
            category: (t.categories as any)?.name
          }))
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('List transactions error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})