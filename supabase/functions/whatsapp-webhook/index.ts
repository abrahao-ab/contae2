import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WhatsAppMessage {
  phone: string
  message: string
  type: 'text' | 'voice' | 'image'
  transcription?: string // For voice messages
  extractedText?: string // For image OCR
}

interface TransactionData {
  amount: number
  description: string
  type: 'income' | 'expense'
  category_name?: string
  date?: string
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: WhatsAppMessage = await req.json()
    console.log('Received WhatsApp message:', JSON.stringify(body))

    const { phone, message, type, transcription, extractedText } = body

    // Get the actual message content based on type
    const content = type === 'voice' ? transcription : type === 'image' ? extractedText : message

    if (!phone || !content) {
      return new Response(
        JSON.stringify({ error: 'Phone and message content are required' }),
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
      console.log('User not found for phone:', phone)
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          message: 'Usuário não encontrado. Por favor, cadastre seu telefone no app em Configurações > WhatsApp.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id

    // Parse transaction from message content
    const parsed = parseTransaction(content)
    
    if (!parsed) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Não consegui entender a transação. Tente algo como: "gastei 50 reais com almoço" ou "recebi 1000 de salário"'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's categories
    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)

    // Try to match category
    let categoryId = null
    if (parsed.category_name && categories) {
      const matchedCategory = categories.find(
        c => c.name.toLowerCase().includes(parsed.category_name!.toLowerCase()) ||
             parsed.category_name!.toLowerCase().includes(c.name.toLowerCase())
      )
      if (matchedCategory) {
        categoryId = matchedCategory.id
      }
    }

    // Determine transaction source based on message type
    const source = type === 'voice' ? 'whatsapp_voice' : 
                   type === 'image' ? 'whatsapp_image' : 'whatsapp_text'

    // Create transaction
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: parsed.amount,
        description: parsed.description,
        type: parsed.type,
        category_id: categoryId,
        source: source,
        date: parsed.date || new Date().toISOString().split('T')[0]
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

    const responseMessage = parsed.type === 'income'
      ? `✅ Receita registrada: R$ ${parsed.amount.toFixed(2)} - ${parsed.description}`
      : `✅ Despesa registrada: R$ ${parsed.amount.toFixed(2)} - ${parsed.description}`

    console.log('Transaction created successfully:', transaction.id)

    return new Response(
      JSON.stringify({
        success: true,
        message: responseMessage,
        transaction: {
          id: transaction.id,
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          category: categoryId ? categories?.find(c => c.id === categoryId)?.name : null
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function parseTransaction(text: string): TransactionData | null {
  const normalizedText = text.toLowerCase().trim()
  
  // Patterns for expenses
  const expensePatterns = [
    /(?:gastei|paguei|comprei|gastar|pagar|comprar)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:com|em|de|no|na)?\s*(.+)?/i,
    /(?:despesa|gasto)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:com|em|de)?\s*(.+)?/i,
    /(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de|com|em|no|na)\s+(.+)/i,
  ]
  
  // Patterns for income
  const incomePatterns = [
    /(?:recebi|ganhei|receber|ganhar|entrou)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de|do|da)?\s*(.+)?/i,
    /(?:receita|entrada)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de)?\s*(.+)?/i,
    /(?:salário|salario|freelance|pagamento)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)/i,
  ]
  
  // Try expense patterns
  for (const pattern of expensePatterns) {
    const match = normalizedText.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      const description = match[2]?.trim() || 'Despesa via WhatsApp'
      return {
        amount,
        description: capitalizeFirst(description),
        type: 'expense',
        category_name: guessCategory(description)
      }
    }
  }
  
  // Try income patterns
  for (const pattern of incomePatterns) {
    const match = normalizedText.match(pattern)
    if (match) {
      const amount = parseFloat(match[1].replace(',', '.'))
      const description = match[2]?.trim() || 'Receita via WhatsApp'
      return {
        amount,
        description: capitalizeFirst(description),
        type: 'income',
        category_name: guessCategory(description)
      }
    }
  }
  
  return null
}

function guessCategory(description: string): string | undefined {
  const desc = description.toLowerCase()
  
  const categoryMap: Record<string, string[]> = {
    'Alimentação': ['almoço', 'jantar', 'café', 'lanche', 'restaurante', 'comida', 'mercado', 'supermercado', 'ifood', 'delivery'],
    'Transporte': ['uber', 'gasolina', 'combustível', 'estacionamento', 'ônibus', 'metro', 'táxi', '99', 'carro'],
    'Moradia': ['aluguel', 'condomínio', 'luz', 'água', 'gás', 'internet', 'energia'],
    'Lazer': ['cinema', 'netflix', 'spotify', 'show', 'festa', 'bar', 'cerveja', 'jogo'],
    'Saúde': ['remédio', 'farmácia', 'médico', 'consulta', 'exame', 'academia', 'plano de saúde'],
    'Educação': ['curso', 'livro', 'escola', 'faculdade', 'mensalidade'],
    'Compras': ['roupa', 'sapato', 'shopping', 'presente', 'eletrônico'],
    'Salário': ['salário', 'salario', 'pagamento', 'freelance', 'trabalho'],
  }
  
  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(keyword => desc.includes(keyword))) {
      return category
    }
  }
  
  return undefined
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
