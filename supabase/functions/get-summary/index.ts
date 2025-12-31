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
    const period = url.searchParams.get('period') || 'month'

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

    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', userId)
      .maybeSingle()

    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
    }

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = new Date().toISOString().split('T')[0]

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('amount, type, category_id, categories(name)')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .lte('date', endDateStr)

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let totalIncome = 0
    let totalExpense = 0
    const categoryTotals: Record<string, number> = {}

    for (const t of transactions || []) {
      if (t.type === 'income') {
        totalIncome += Number(t.amount)
      } else {
        totalExpense += Number(t.amount)
        const categoryName = (t.categories as any)?.name || 'Outros'
        categoryTotals[categoryName] = (categoryTotals[categoryName] || 0) + Number(t.amount)
      }
    }

    const balance = totalIncome - totalExpense
    const transactionCount = transactions?.length || 0

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([name, amount]) => ({ name, amount }))

    const periodLabel = period === 'week' ? 'desta semana' : period === 'year' ? 'deste ano' : 'deste mês'
    
    let message = `📊 *Resumo Financeiro ${periodLabel}*\n\n`
    message += `💰 Receitas: R$ ${totalIncome.toFixed(2)}\n`
    message += `💸 Despesas: R$ ${totalExpense.toFixed(2)}\n`
    message += `📈 Saldo: R$ ${balance.toFixed(2)}\n`
    message += `📝 Total de transações: ${transactionCount}\n`
    
    if (topCategories.length > 0) {
      message += `\n*Maiores gastos:*\n`
      topCategories.forEach((cat, i) => {
        message += `${i + 1}. ${cat.name}: R$ ${cat.amount.toFixed(2)}\n`
      })
    }

    console.log('Summary generated for user:', userId)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: {
          period,
          totalIncome,
          totalExpense,
          balance,
          transactionCount,
          topCategories,
          userName: profile?.full_name
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Summary error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})