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
    const type = url.searchParams.get('type') // income | expense
    const startDate = url.searchParams.get('start_date') // YYYY-MM-DD
    const endDate = url.searchParams.get('end_date') // YYYY-MM-DD
    const period = url.searchParams.get('period') // today | yesterday | this_week | last_week | this_month | last_month | this_year
    const timezone = url.searchParams.get('timezone') || 'America/Sao_Paulo'

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

    // Calcula as datas baseado no fuso horário do usuário
    const { filterStartDate, filterEndDate, periodLabel } = calculateDateRange(
      period,
      startDate,
      endDate,
      timezone
    )

    let query = supabase
      .from('transactions')
      .select('id, amount, type, description, date, source, categories(name, icon)')
      .eq('user_id', userId)
      .order('date', { ascending: false })

    // Aplica filtros de data se existirem
    if (filterStartDate) {
      query = query.gte('date', filterStartDate)
    }
    if (filterEndDate) {
      query = query.lte('date', filterEndDate)
    }

    // Aplica filtro de tipo
    if (type === 'income' || type === 'expense') {
      query = query.eq('type', type)
    }

    // Aplica limite
    query = query.limit(limit)

    const { data: transactions, error: transactionsError } = await query

    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError)
      return new Response(
        JSON.stringify({ error: 'Failed to fetch transactions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calcula totais
    const totalIncome = transactions
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0
    
    const totalExpense = transactions
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0

    const balance = totalIncome - totalExpense

    // Monta a mensagem formatada
    let message = ''
    
    if (periodLabel) {
      message += `📋 *Transações - ${periodLabel}*\n\n`
    } else {
      message += `📋 *Últimas ${transactions?.length || 0} transações:*\n\n`
    }

    if (type === 'income') {
      message = message.replace('Transações', 'Receitas')
    } else if (type === 'expense') {
      message = message.replace('Transações', 'Despesas')
    }

    transactions?.forEach((t) => {
      const emoji = t.type === 'income' ? '💰' : '💸'
      const sign = t.type === 'income' ? '+' : '-'
      const category = (t.categories as any)?.name || 'Sem categoria'
      const formattedDate = formatDateForDisplay(t.date, timezone)
      message += `${emoji} ${sign}R$ ${Number(t.amount).toFixed(2)}\n`
      message += `   ${t.description || 'Sem descrição'}\n`
      message += `   📁 ${category} | 📅 ${formattedDate}\n\n`
    })

    // Adiciona resumo
    if (transactions && transactions.length > 0) {
      message += `━━━━━━━━━━━━━━━━━━\n`
      message += `📊 *Resumo:*\n`
      if (!type || type !== 'expense') {
        message += `💰 Receitas: R$ ${totalIncome.toFixed(2)}\n`
      }
      if (!type || type !== 'income') {
        message += `💸 Despesas: R$ ${totalExpense.toFixed(2)}\n`
      }
      if (!type) {
        const balanceEmoji = balance >= 0 ? '✅' : '⚠️'
        message += `${balanceEmoji} Saldo: R$ ${balance.toFixed(2)}\n`
      }
    } else {
      message += `ℹ️ Nenhuma transação encontrada para o período selecionado.`
    }

    console.log('Transactions listed for user:', userId, 'Period:', periodLabel || 'all')

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: {
          count: transactions?.length || 0,
          period: periodLabel || null,
          start_date: filterStartDate || null,
          end_date: filterEndDate || null,
          timezone,
          summary: {
            total_income: totalIncome,
            total_expense: totalExpense,
            balance
          },
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

// Função para calcular o range de datas baseado no período e timezone
function calculateDateRange(
  period: string | null,
  startDate: string | null,
  endDate: string | null,
  timezone: string
): { filterStartDate: string | null; filterEndDate: string | null; periodLabel: string | null } {
  
  // Se datas explícitas foram fornecidas, usa elas
  if (startDate && endDate) {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: timezone }
    const startFormatted = start.toLocaleDateString('pt-BR', options)
    const endFormatted = end.toLocaleDateString('pt-BR', options)
    return {
      filterStartDate: startDate,
      filterEndDate: endDate,
      periodLabel: `${startFormatted} a ${endFormatted}`
    }
  }

  if (!period) {
    return { filterStartDate: null, filterEndDate: null, periodLabel: null }
  }

  // Obtém a data atual no timezone do usuário
  const now = new Date()
  const userDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  const year = userDate.getFullYear()
  const month = userDate.getMonth()
  const day = userDate.getDate()
  const dayOfWeek = userDate.getDay()

  let filterStartDate: string
  let filterEndDate: string
  let periodLabel: string

  switch (period) {
    case 'today':
      filterStartDate = formatDate(year, month, day)
      filterEndDate = formatDate(year, month, day)
      periodLabel = 'Hoje'
      break

    case 'yesterday':
      const yesterday = new Date(userDate)
      yesterday.setDate(day - 1)
      filterStartDate = formatDate(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate())
      filterEndDate = filterStartDate
      periodLabel = 'Ontem'
      break

    case 'this_week':
      // Início da semana (domingo)
      const startOfWeek = new Date(userDate)
      startOfWeek.setDate(day - dayOfWeek)
      filterStartDate = formatDate(startOfWeek.getFullYear(), startOfWeek.getMonth(), startOfWeek.getDate())
      filterEndDate = formatDate(year, month, day)
      periodLabel = 'Esta semana'
      break

    case 'last_week':
      // Semana anterior
      const lastWeekEnd = new Date(userDate)
      lastWeekEnd.setDate(day - dayOfWeek - 1)
      const lastWeekStart = new Date(lastWeekEnd)
      lastWeekStart.setDate(lastWeekEnd.getDate() - 6)
      filterStartDate = formatDate(lastWeekStart.getFullYear(), lastWeekStart.getMonth(), lastWeekStart.getDate())
      filterEndDate = formatDate(lastWeekEnd.getFullYear(), lastWeekEnd.getMonth(), lastWeekEnd.getDate())
      periodLabel = 'Semana passada'
      break

    case 'this_month':
      filterStartDate = formatDate(year, month, 1)
      filterEndDate = formatDate(year, month, day)
      periodLabel = getMonthName(month) + ' ' + year
      break

    case 'last_month':
      const lastMonth = month === 0 ? 11 : month - 1
      const lastMonthYear = month === 0 ? year - 1 : year
      const lastDayOfLastMonth = new Date(lastMonthYear, lastMonth + 1, 0).getDate()
      filterStartDate = formatDate(lastMonthYear, lastMonth, 1)
      filterEndDate = formatDate(lastMonthYear, lastMonth, lastDayOfLastMonth)
      periodLabel = getMonthName(lastMonth) + ' ' + lastMonthYear
      break

    case 'this_year':
      filterStartDate = formatDate(year, 0, 1)
      filterEndDate = formatDate(year, month, day)
      periodLabel = 'Ano ' + year
      break

    case 'last_year':
      const lastYear = year - 1
      filterStartDate = formatDate(lastYear, 0, 1)
      filterEndDate = formatDate(lastYear, 11, 31)
      periodLabel = 'Ano ' + lastYear
      break

    default:
      // Tenta interpretar como mês específico (ex: "dezembro_2025" ou "12_2025")
      const monthMatch = period.match(/^(\w+)_(\d{4})$/)
      if (monthMatch) {
        const monthName = monthMatch[1].toLowerCase()
        const targetYear = parseInt(monthMatch[2])
        const targetMonth = getMonthNumber(monthName)
        
        if (targetMonth !== -1) {
          const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate()
          filterStartDate = formatDate(targetYear, targetMonth, 1)
          filterEndDate = formatDate(targetYear, targetMonth, lastDayOfMonth)
          periodLabel = getMonthName(targetMonth) + ' ' + targetYear
          break
        }
      }
      
      return { filterStartDate: null, filterEndDate: null, periodLabel: null }
  }

  return { filterStartDate, filterEndDate, periodLabel }
}

function formatDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDateForDisplay(dateStr: string, timezone: string): string {
  const date = new Date(dateStr + 'T12:00:00')
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: timezone
  })
}

function getMonthName(month: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[month] || ''
}

function getMonthNumber(monthName: string): number {
  const months: Record<string, number> = {
    'janeiro': 0, 'jan': 0,
    'fevereiro': 1, 'fev': 1,
    'março': 2, 'marco': 2, 'mar': 2,
    'abril': 3, 'abr': 3,
    'maio': 4, 'mai': 4,
    'junho': 5, 'jun': 5,
    'julho': 6, 'jul': 6,
    'agosto': 7, 'ago': 7,
    'setembro': 8, 'set': 8,
    'outubro': 9, 'out': 9,
    'novembro': 10, 'nov': 10,
    'dezembro': 11, 'dez': 11,
    '01': 0, '1': 0,
    '02': 1, '2': 1,
    '03': 2, '3': 2,
    '04': 3, '4': 3,
    '05': 4, '5': 4,
    '06': 5, '6': 5,
    '07': 6, '7': 6,
    '08': 7, '8': 7,
    '09': 8, '9': 8,
    '10': 9,
    '11': 10,
    '12': 11
  }
  return months[monthName] ?? -1
}
