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

// Formata data para YYYY-MM-DD no timezone especificado
function formatDateToString(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Parse de data no formato YYYY-MM-DD
function parseDate(dateStr: string): Date | null {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) return null
  
  const year = parseInt(match[1])
  const month = parseInt(match[2]) - 1
  const day = parseInt(match[3])
  
  const date = new Date(year, month, day)
  if (isNaN(date.getTime())) return null
  
  return date
}

interface DateRange {
  startDate: Date
  endDate: Date
  periodLabel: string
  periodCode: string
}

// Calcula o range de datas baseado no período especificado
function calculateDateRange(period: string, timezone: string = 'America/Sao_Paulo'): DateRange {
  // Usa a data atual no timezone do usuário
  const now = new Date()
  const today = new Date(now.toLocaleString('en-US', { timeZone: timezone }))
  
  let startDate: Date
  let endDate: Date = new Date(today)
  let periodLabel: string
  let periodCode: string = period

  // Período padrão
  const periodLower = period.toLowerCase().trim()

  // ========== PERÍODO: HOJE ==========
  if (periodLower === 'day' || periodLower === 'today' || periodLower === 'hoje') {
    startDate = new Date(today)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(today)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = 'de hoje'
    periodCode = 'day'
  }
  // ========== PERÍODO: ONTEM ==========
  else if (periodLower === 'yesterday' || periodLower === 'ontem') {
    startDate = new Date(today)
    startDate.setDate(today.getDate() - 1)
    startDate.setHours(0, 0, 0, 0)
    endDate = new Date(startDate)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = 'de ontem'
    periodCode = 'yesterday'
  }
  // ========== PERÍODO: ESTA SEMANA ==========
  else if (periodLower === 'week' || periodLower === 'this_week' || periodLower.includes('esta semana') || periodLower.includes('essa semana')) {
    const dayOfWeek = today.getDay()
    startDate = new Date(today)
    startDate.setDate(today.getDate() - dayOfWeek)
    startDate.setHours(0, 0, 0, 0)
    // Fim da semana = sábado
    endDate = new Date(startDate)
    endDate.setDate(startDate.getDate() + 6)
    endDate.setHours(23, 59, 59, 999)
    periodLabel = 'desta semana'
    periodCode = 'week'
  }
  // ========== PERÍODO: SEMANA PASSADA ==========
  else if (periodLower === 'last_week' || periodLower.includes('semana passada')) {
    const dayOfWeek = today.getDay()
    const lastSunday = new Date(today)
    lastSunday.setDate(today.getDate() - dayOfWeek - 7)
    lastSunday.setHours(0, 0, 0, 0)
    const lastSaturday = new Date(lastSunday)
    lastSaturday.setDate(lastSunday.getDate() + 6)
    lastSaturday.setHours(23, 59, 59, 999)
    startDate = lastSunday
    endDate = lastSaturday
    periodLabel = 'da semana passada'
    periodCode = 'last_week'
  }
  // ========== PERÍODO: MÊS ATUAL ==========
  else if (periodLower === 'month' || periodLower === 'this_month' || periodLower.includes('mês atual') || periodLower.includes('mes atual') || periodLower.includes('este mês') || periodLower.includes('esse mês') || periodLower.includes('este mes') || periodLower.includes('esse mes')) {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0) // Último dia do mês
    periodLabel = 'deste mês'
    periodCode = 'month'
  }
  // ========== PERÍODO: MÊS PASSADO ==========
  else if (periodLower === 'last_month' || periodLower.includes('mês passado') || periodLower.includes('mes passado')) {
    const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    startDate = lastMonth
    endDate = new Date(today.getFullYear(), today.getMonth(), 0) // Último dia do mês anterior
    periodLabel = `de ${getMonthName(lastMonth.getMonth() + 1)} de ${lastMonth.getFullYear()}`
    periodCode = 'last_month'
  }
  // ========== PERÍODO: TRIMESTRE (ÚLTIMOS 3 MESES) ==========
  else if (periodLower === 'quarter' || periodLower === 'last_quarter' || periodLower.includes('último trimestre') || periodLower.includes('ultimo trimestre') || periodLower.includes('últimos 3 meses') || periodLower.includes('ultimos 3 meses')) {
    startDate = new Date(today.getFullYear(), today.getMonth() - 2, 1)
    endDate = new Date(today) // Até hoje
    periodLabel = 'dos últimos 3 meses'
    periodCode = 'quarter'
  }
  // ========== PERÍODO: SEMESTRE (ÚLTIMOS 6 MESES) ==========
  else if (periodLower === 'semester' || periodLower === 'last_semester' || periodLower.includes('último semestre') || periodLower.includes('ultimo semestre') || periodLower.includes('últimos 6 meses') || periodLower.includes('ultimos 6 meses')) {
    startDate = new Date(today.getFullYear(), today.getMonth() - 5, 1)
    endDate = new Date(today) // Até hoje
    periodLabel = 'dos últimos 6 meses'
    periodCode = 'semester'
  }
  // ========== PERÍODO: ANO ATUAL ==========
  else if (periodLower === 'year' || periodLower === 'this_year' || periodLower.includes('ano atual') || periodLower.includes('este ano') || periodLower.includes('esse ano')) {
    startDate = new Date(today.getFullYear(), 0, 1)
    endDate = new Date(today.getFullYear(), 11, 31)
    periodLabel = 'deste ano'
    periodCode = 'year'
  }
  // ========== PERÍODO: ANO PASSADO ==========
  else if (periodLower === 'last_year' || periodLower.includes('ano passado')) {
    startDate = new Date(today.getFullYear() - 1, 0, 1)
    endDate = new Date(today.getFullYear() - 1, 11, 31)
    periodLabel = `de ${today.getFullYear() - 1}`
    periodCode = 'last_year'
  }
  // ========== PERÍODO: ÚLTIMAS X SEMANAS ==========
  else if (periodLower.match(/^(últimas?|ultimas?)\s*(\d+)\s*semanas?$/) || periodLower.match(/^last_(\d+)_weeks?$/)) {
    const match = periodLower.match(/(\d+)/)
    const weeks = match ? parseInt(match[1]) : 1
    startDate = new Date(today)
    startDate.setDate(today.getDate() - (weeks * 7))
    startDate.setHours(0, 0, 0, 0)
    periodLabel = `das últimas ${weeks} semanas`
    periodCode = `last_${weeks}_weeks`
  }
  // ========== PERÍODO: ÚLTIMOS X MESES ==========
  else if (periodLower.match(/^(últimos?|ultimos?)\s*(\d+)\s*m[eê]s(es)?$/) || periodLower.match(/^last_(\d+)_months?$/)) {
    const match = periodLower.match(/(\d+)/)
    const months = match ? parseInt(match[1]) : 1
    startDate = new Date(today.getFullYear(), today.getMonth() - months + 1, 1)
    endDate = new Date(today) // Até hoje
    periodLabel = `dos últimos ${months} meses`
    periodCode = `last_${months}_months`
  }
  // ========== PERÍODO: ÚLTIMOS X DIAS ==========
  else if (periodLower.match(/^(últimos?|ultimos?)\s*(\d+)\s*dias?$/) || periodLower.match(/^last_(\d+)_days?$/)) {
    const match = periodLower.match(/(\d+)/)
    const days = match ? parseInt(match[1]) : 7
    startDate = new Date(today)
    startDate.setDate(today.getDate() - days + 1)
    startDate.setHours(0, 0, 0, 0)
    periodLabel = `dos últimos ${days} dias`
    periodCode = `last_${days}_days`
  }
  // ========== PERÍODO: MÊS ESPECÍFICO (ex: "dezembro de 2025", "12/2025") ==========
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
      periodCode = `${year}-${String(month).padStart(2, '0')}`
    } else {
      // Fallback
      startDate = new Date(today.getFullYear(), today.getMonth(), 1)
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
      periodLabel = 'deste mês'
      periodCode = 'month'
    }
  }
  // ========== DEFAULT: MÊS ATUAL ==========
  else {
    startDate = new Date(today.getFullYear(), today.getMonth(), 1)
    endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    periodLabel = 'deste mês'
    periodCode = 'month'
  }

  return { startDate, endDate, periodLabel, periodCode }
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
    
    // Novos parâmetros para intervalo personalizado
    const customStartDate = url.searchParams.get('start_date')
    const customEndDate = url.searchParams.get('end_date')

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

    // Variáveis para o range de datas
    let startDateStr: string
    let endDateStr: string
    let periodLabel: string
    let periodCode: string

    // Se start_date e end_date foram informados, usa o intervalo personalizado
    if (customStartDate && customEndDate) {
      const parsedStart = parseDate(customStartDate)
      const parsedEnd = parseDate(customEndDate)
      
      if (!parsedStart || !parsedEnd) {
        return new Response(
          JSON.stringify({ error: 'Invalid date format. Use YYYY-MM-DD.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      if (parsedStart > parsedEnd) {
        return new Response(
          JSON.stringify({ error: 'start_date must be before or equal to end_date.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      startDateStr = customStartDate
      endDateStr = customEndDate
      periodLabel = `de ${customStartDate} a ${customEndDate}`
      periodCode = 'custom'
      
      console.log('Using custom date range:', { startDateStr, endDateStr })
    } else {
      // Calcula o range de datas baseado no período
      const dateRange = calculateDateRange(period, timezone)
      startDateStr = formatDateToString(dateRange.startDate)
      endDateStr = formatDateToString(dateRange.endDate)
      periodLabel = dateRange.periodLabel
      periodCode = dateRange.periodCode
    }

    console.log('Date range:', { startDateStr, endDateStr, periodLabel, periodCode })

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
          period: periodCode,
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
