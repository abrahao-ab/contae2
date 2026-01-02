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
    const { phone, transaction_id, description, amount, delete_last, list_recent, limit = 5 } = body

    if (!phone) {
      return new Response(
        JSON.stringify({ error: 'Phone is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const normalizedPhone = normalizePhone(phone)

    // Find user by phone
    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle()

    if (whatsappError || !whatsappNumber) {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id

    // MODE 1: List recent transactions (for numbered selection)
    if (list_recent) {
      const { data: transactions, error: listError } = await supabase
        .from('transactions')
        .select('id, amount, type, description, date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (listError) {
        console.error('Error listing transactions:', listError)
        return new Response(
          JSON.stringify({ error: 'Erro ao listar transações' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!transactions || transactions.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: true, 
            message: '📭 Você não tem transações recentes.',
            transactions: [] 
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const formattedList = transactions.map((t, index) => {
        const emoji = t.type === 'income' ? '💰' : '💸'
        const date = new Date(t.date).toLocaleDateString('pt-BR')
        return `${index + 1}. ${emoji} R$ ${Number(t.amount).toFixed(2)} - ${t.description || 'Sem descrição'} (${date})`
      }).join('\n')

      return new Response(
        JSON.stringify({
          success: true,
          action: 'list',
          message: `📋 Suas últimas ${transactions.length} transações:\n\n${formattedList}\n\n💡 Para excluir, diga o número (ex: "apagar 1")`,
          transactions: transactions.map((t, index) => ({
            number: index + 1,
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            date: t.date
          }))
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODE 2: Delete last transaction
    if (delete_last) {
      const { data: lastTransaction, error: lastError } = await supabase
        .from('transactions')
        .select('id, amount, type, description, date')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (lastError || !lastTransaction) {
        return new Response(
          JSON.stringify({ error: 'Nenhuma transação encontrada para excluir' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', lastTransaction.id)
        .eq('user_id', userId)

      if (deleteError) {
        console.error('Error deleting transaction:', deleteError)
        return new Response(
          JSON.stringify({ error: 'Erro ao excluir transação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const emoji = lastTransaction.type === 'income' ? '💰' : '💸'
      return new Response(
        JSON.stringify({
          success: true,
          action: 'deleted',
          message: `🗑️ Última transação excluída:\n${emoji} R$ ${Number(lastTransaction.amount).toFixed(2)} - ${lastTransaction.description || 'Sem descrição'}`,
          deleted: lastTransaction
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODE 3: Delete by description + amount (fuzzy search)
    if (description || amount) {
      let query = supabase
        .from('transactions')
        .select('id, amount, type, description, date, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      // Filter by amount if provided
      if (amount) {
        const numAmount = Number(amount)
        // Allow 1% tolerance for rounding
        const minAmount = numAmount * 0.99
        const maxAmount = numAmount * 1.01
        query = query.gte('amount', minAmount).lte('amount', maxAmount)
      }

      // Filter by description if provided (case insensitive search)
      if (description) {
        query = query.ilike('description', `%${description}%`)
      }

      const { data: matches, error: searchError } = await query.limit(5)

      if (searchError) {
        console.error('Error searching transactions:', searchError)
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar transações' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!matches || matches.length === 0) {
        let searchCriteria = []
        if (description) searchCriteria.push(`"${description}"`)
        if (amount) searchCriteria.push(`R$ ${Number(amount).toFixed(2)}`)
        
        return new Response(
          JSON.stringify({ 
            error: `Nenhuma transação encontrada com ${searchCriteria.join(' e ')}`,
            suggestion: 'Tente "listar transações" para ver as mais recentes'
          }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // If only one match, delete it directly
      if (matches.length === 1) {
        const transaction = matches[0]
        
        const { error: deleteError } = await supabase
          .from('transactions')
          .delete()
          .eq('id', transaction.id)
          .eq('user_id', userId)

        if (deleteError) {
          console.error('Error deleting transaction:', deleteError)
          return new Response(
            JSON.stringify({ error: 'Erro ao excluir transação' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        const emoji = transaction.type === 'income' ? '💰' : '💸'
        return new Response(
          JSON.stringify({
            success: true,
            action: 'deleted',
            message: `🗑️ Transação excluída:\n${emoji} R$ ${Number(transaction.amount).toFixed(2)} - ${transaction.description || 'Sem descrição'}`,
            deleted: transaction
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Multiple matches - ask user to choose
      const formattedList = matches.map((t, index) => {
        const emoji = t.type === 'income' ? '💰' : '💸'
        const date = new Date(t.date).toLocaleDateString('pt-BR')
        return `${index + 1}. ${emoji} R$ ${Number(t.amount).toFixed(2)} - ${t.description || 'Sem descrição'} (${date})`
      }).join('\n')

      return new Response(
        JSON.stringify({
          success: true,
          action: 'multiple_matches',
          message: `🔍 Encontrei ${matches.length} transações similares:\n\n${formattedList}\n\n💡 Qual deseja excluir? Diga o número (ex: "apagar 1")`,
          transactions: matches.map((t, index) => ({
            number: index + 1,
            id: t.id,
            amount: t.amount,
            type: t.type,
            description: t.description,
            date: t.date
          }))
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // MODE 4: Delete by transaction_id (legacy/direct)
    if (transaction_id) {
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('id, amount, type, description')
        .eq('id', transaction_id)
        .eq('user_id', userId)
        .maybeSingle()

      if (fetchError || !transaction) {
        return new Response(
          JSON.stringify({ error: 'Transação não encontrada' }),
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
          JSON.stringify({ error: 'Erro ao excluir transação' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const emoji = transaction.type === 'income' ? '💰' : '💸'
      return new Response(
        JSON.stringify({
          success: true,
          action: 'deleted',
          message: `🗑️ Transação excluída:\n${emoji} R$ ${Number(transaction.amount).toFixed(2)} - ${transaction.description || 'Sem descrição'}`,
          deleted: transaction
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // No valid mode specified
    return new Response(
      JSON.stringify({ 
        error: 'Especifique o que deseja excluir',
        hint: 'Use: delete_last=true, ou description/amount, ou list_recent=true, ou transaction_id'
      }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete transaction error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
