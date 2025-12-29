import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, apikey',
}

interface EvolutionWebhookMessage {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: {
        text: string
      }
      audioMessage?: {
        url: string
        mimetype: string
      }
      imageMessage?: {
        url: string
        caption?: string
      }
    }
    messageType?: string
  }
}

interface TransactionData {
  amount: number
  description: string
  type: 'income' | 'expense'
  category_name?: string
  date?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
    const requestApiKey = req.headers.get('apikey')
    
    // Verificar apikey da Evolution API
    if (evolutionApiKey && requestApiKey !== evolutionApiKey) {
      console.error('Invalid API key')
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const body: EvolutionWebhookMessage = await req.json()
    console.log('Received Evolution API webhook:', JSON.stringify(body))

    // Verificar se é um evento de mensagem recebida
    if (body.event !== 'messages.upsert' || body.data?.key?.fromMe) {
      return new Response(
        JSON.stringify({ success: true, message: 'Event ignored' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data } = body
    const remoteJid = data.key.remoteJid
    
    // Extrair número de telefone (formato: 5511999999999@s.whatsapp.net)
    const phone = remoteJid.replace('@s.whatsapp.net', '').replace('@c.us', '')
    
    // Extrair conteúdo da mensagem
    let content = ''
    let messageType: 'text' | 'voice' | 'image' = 'text'
    
    if (data.message?.conversation) {
      content = data.message.conversation
    } else if (data.message?.extendedTextMessage?.text) {
      content = data.message.extendedTextMessage.text
    } else if (data.message?.audioMessage) {
      messageType = 'voice'
      // TODO: Implementar transcrição de áudio
      console.log('Audio message received - transcription not implemented')
      return new Response(
        JSON.stringify({ success: true, message: 'Audio messages not yet supported' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else if (data.message?.imageMessage) {
      messageType = 'image'
      content = data.message.imageMessage.caption || ''
      if (!content) {
        console.log('Image message without caption')
        return new Response(
          JSON.stringify({ success: true, message: 'Image without caption' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    if (!phone || !content) {
      console.log('Missing phone or content:', { phone, content })
      return new Response(
        JSON.stringify({ error: 'Phone and message content are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Processing message from ${phone}: ${content}`)

    // Find user by phone in whatsapp_numbers table
    const { data: whatsappNumber, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', phone)
      .maybeSingle()

    if (whatsappError || !whatsappNumber) {
      console.log('User not found for phone:', phone)
      
      // Enviar resposta via Evolution API
      await sendEvolutionMessage(phone, 'Usuário não encontrado. Por favor, cadastre seu telefone no app em Configurações > WhatsApp.')
      
      return new Response(
        JSON.stringify({ 
          error: 'User not found',
          message: 'Usuário não encontrado'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = whatsappNumber.user_id
    const parsed = parseTransaction(content)
    
    if (!parsed) {
      await sendEvolutionMessage(phone, 'Não consegui entender a transação. Tente algo como: "gastei 50 reais com almoço" ou "recebi 1000 de salário"')
      
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Could not parse transaction'
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', userId)

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

    const source = messageType === 'image' ? 'whatsapp_image' : 'whatsapp_text'

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
      await sendEvolutionMessage(phone, 'Erro ao registrar transação. Tente novamente.')
      
      return new Response(
        JSON.stringify({ error: 'Failed to create transaction', details: transactionError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const responseMessage = parsed.type === 'income'
      ? `✅ Receita registrada: R$ ${parsed.amount.toFixed(2)} - ${parsed.description}`
      : `✅ Despesa registrada: R$ ${parsed.amount.toFixed(2)} - ${parsed.description}`

    console.log('Transaction created successfully:', transaction.id)
    
    // Enviar confirmação via Evolution API
    await sendEvolutionMessage(phone, responseMessage)

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

async function sendEvolutionMessage(phone: string, message: string) {
  const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL')
  const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')
  const evolutionInstance = Deno.env.get('EVOLUTION_INSTANCE')

  if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstance) {
    console.error('Evolution API credentials not configured')
    return
  }

  try {
    const response = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phone,
        text: message,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Error sending Evolution message:', errorText)
    } else {
      console.log('Evolution message sent successfully')
    }
  } catch (error) {
    console.error('Error sending Evolution message:', error)
  }
}

function parseTransaction(text: string): TransactionData | null {
  const normalizedText = text.toLowerCase().trim()
  
  const expensePatterns = [
    /(?:gastei|paguei|comprei|gastar|pagar|comprar)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:com|em|de|no|na)?\s*(.+)?/i,
    /(?:despesa|gasto)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:com|em|de)?\s*(.+)?/i,
    /(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de|com|em|no|na)\s+(.+)/i,
  ]
  
  const incomePatterns = [
    /(?:recebi|ganhei|receber|ganhar|entrou)\s+(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de|do|da)?\s*(.+)?/i,
    /(?:receita|entrada)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)\s*(?:reais?)?\s*(?:de)?\s*(.+)?/i,
    /(?:salário|salario|freelance|pagamento)\s*(?:de)?\s*(?:r\$?\s*)?(\d+(?:[.,]\d{2})?)/i,
  ]
  
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