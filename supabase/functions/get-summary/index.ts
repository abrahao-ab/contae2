import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Normaliza o telefone para o formato +55XXXXXXXXXXX
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/\D/g, '')
  
  if (!cleaned.startsWith('55')) {
    cleaned = '55' + cleaned
  }
  
  return '+' + cleaned
}

// Mapeia nomes de meses em português para números
function getMonthNumber(monthName: string): number | null {
  const months: Record<string, number> = {
    'janeiro': 1, 'jan': 1,
    'fevereiro': 2, 'fev': 2,
    'março': 3, 'mar': 3, 'marco': 3,
    'abril': 4, 'abr': 4,
    'maio': 5, 'mai': 5,
    'junho': 6, 'jun': 6,
    'julho': 7, 'jul': 7,
    'agosto': 8, 'ago': 8,
    'setembro': 9, 'set': 9,
    'outubro': 10, 'out': 10,
    'novembro': 11, 'nov': 11,
    'dezembro': 12, 'dez': 12
  }
  
  const normalized = monthName.toLowerCase().trim()
  return months[normalized] || null
}

// Retorna o nome do mês em português
function getMonthName(month: number): string {
  const months = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ]
  return months[month - 1] || ''
}

interface DateRange {
  startDate: Date
  endDate: Date
  periodLabel: string
}

// Calcula o range de datas baseado no período especificado
function calculateDateRange(period: string, timezone: string = 'America/Sao_Paulo'): DateRange {
  // Usa a data atual no timezone do usuário
  const now = new Date()
  const today = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  let startDate: Date
  let endDate: Date = new Date(today)
  let periodLabel: string

  // Período padrão
  const periodLower = period.toLowerCase().trim()

  // Padrões para períodos relativos
  // "mês passado", "mes passado"
  if (periodLower === 'last_month' || periodLower.includes('mês passado') || periodLower.includes('mes passado')) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    startDate = lastMonth
    endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Último dia do mês anterior
    periodLabel = `de ${getMonthName(lastMonth.getMonth() + 1)} de ${lastMonth.getFullYear()}`
  }
  // "semana passada"
  else if (periodLower === 'last_week' || periodLower.includes('semana passada')) {
    const dayOfWeek = today.getDay()
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() - dayOfWeek - 7)
    const lastSaturday = new Date(lastSunday)
    lastSaturday.setDate(lastSunday.getDate() + 6)
    startDate = lastSunday
    endDate = lastSaturday
    periodLabel = 'da semana passada'
  }
  // "últimas X semanas" ou "ultimas X semanas"
  else if (periodLower.match(/^(últimas?|ultimas?)\s*(\d+)\s*semanas?$/) || periodLower.match(/^last_(\d+)_weeks?$/)) {
    const match = periodLower.match(/(\d+)/)
    const weeks = match ? parseInt(match[1]) : 1
    startDate = new Date(today)
    startDate.setDate(today.getDate() - (weeks * 7))
    periodLabel = `das últimas ${weeks} semanas`
  }
  // "últimos X meses" ou "ultimos X meses"
  else if (periodLower.match(/^(últimos?|ultimos?)\s*(\d+)\s*m[eê]s(es)?$/) || periodLower.match(/^last_(\d+)_months?$/)) {
    const match = periodLower.match(/(\d+)/)
    const months = match ? parseInt(match[1]) : 1
    startDate = new Date(today.getFullYear(), today.getMonth() - months, 1)
    periodLabel = `dos últimos ${months} meses`
  }
  // "últimos X dias" ou "ultimos X dias"
  else if (periodLower.match(/^(últimos?|ultimos?)\s*(\d+)\s*dias?$/) || periodLower.match(/^last_(\d+)_days?$/)) {
    const match = periodLower.match(/(\d+)/)
    const days = match ? parseInt(match[1]) : 7
    startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    periodLabel = `dos últimos ${days} dias`
  }
  // Mês específico: "dezembro de 2025", "dez 2025", "12/2025", "dezembro/2025"
  else if (periodLower.match(/^(\w+)\s*(de\s*)?(\d{4})$/) || periodLower.match(/^(\d{1,2})[\/\-](\d{4})$/)) {
    let month: number | null = null
    let year: number

    // Formato "12/2025" ou "12-2025"
    const numericMatch = periodLower.match(/^(\d{1,2})[\/\-](\d{4})$/)
    if (numericMatch) {
      month = parseInt(numericMatch[1])
      year = parseInt(numericMatch[2])
    } else {
      // Formato "dezembro de 2025" ou "dez 2025"
      const textMatch = periodLower.match(/^(\w+)\s*(de\s*)?(\d{4})$/)
      if (textMatch) {
        month = getMonthNumber(textMatch[1])
        year = parseInt(textMatch[3])
      } else {
        // Fallback para mês atual
        month = today.getMonth() + 1
        year = today.getFullYear()
      }
    }

    if (month && month >= 1 && month <= 12) {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0) // Último dia do mês
      periodLabel = `de ${getMonthName(month)} de ${year}`
    } else {
      // Fallback
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      periodLabel = 'deste mês'
    }
  }
  // "este mês" ou "esse mês"
  else if (periodLower === 'month' || periodLower === 'this_month' || periodLower.includes('este mês') || periodLower.includes('esse mês') || periodLower.includes('este mes') || periodLower.includes('esse mes')) {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    periodLabel = 'deste mês'
  }
  // "esta semana" ou "essa semana"
  else if (periodLower === 'week' || periodLower === 'this_week' || periodLower.includes('esta semana') || periodLower.includes('essa semana')) {
    const dayOfWeek = today.getDay()
    startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek)
    periodLabel = 'desta semana'
  }
  // "este ano" ou "esse ano"
  else if (periodLower === 'year' || periodLower === 'this_year' || periodLower.includes('este ano') || periodLower.includes('esse ano')) {
    startDate = new Date(today.getFullYear(), 0, 1)
    periodLabel = 'deste ano'
  }
  // "ano passado"
  else if (periodLower === 'last_year' || periodLower.includes('ano passado')) {
    startDate = new Date(today.getFullYear() - 1, 0, 1)
    endDate = new Date(today.getFullYear() - 1, 11, 31)
    periodLabel = `de ${today.getFullYear() - 1}`
  }
  // "hoje"
  else if (periodLower === 'today' || periodLower === 'hoje') {
    startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = 'de hoje'
  }
  // "ontem"
  else if (periodLower === 'yesterday' || periodLower === 'ontem') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 1)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = 'de ontem'
  }
  // Default: mês atual
  else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    periodLabel = 'deste mês'
  }

  return { startDate, endDate, periodLabel }
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
    let phone = url.searchParams.get('phone')
    const period = url.searchParams.get('period') || 'month'
    const timezone = url.searchParams.get('timezone') || 'America/Sao_Paulo'

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Normaliza o telefone
    phone = normalizePhone(phone)
    console.log('Normalized phone:', phone)

    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (whatsappError || !whatsappNumber) {
      console.error('WhatsApp lookup error:', whatsappError)
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

    // Calcula o range de datas
    const { startDate, endDate, periodLabel } = calculateDateRange(period, timezone)

    const startDateStr = startDate.toISOString().split('T')[0]
    const endDateStr = endDate.toISOString().split('T')[0]

    console.log('Date range:', { startDateStr, endDateStr, periodLabel })

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

    console.log('Summary generated for user:', userId, 'Period:', periodLabel)

    return new Response(
      JSON.stringify({
        success: true,
        message,
        data: {
          period,
          periodLabel,
          startDate: startDateStr,
          endDate: endDateStr,
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
