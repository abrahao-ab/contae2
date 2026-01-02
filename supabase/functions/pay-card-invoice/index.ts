import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Normaliza o telefone para formato +55XXXXXXXXXXX
function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('55') && digits.length >= 12) {
    return `+${digits}`;
  }
  if (digits.length === 11 || digits.length === 10) {
    return `+55${digits}`;
  }
  return `+${digits}`;
}

// Formata valor em reais
function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

// Formata data para exibição
function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const { 
      phone, 
      card_id, 
      card_name, 
      amount, 
      is_full_payment = false,
      bank_account_id,
      payment_date,
      timezone = 'America/Sao_Paulo'
    } = body;

    console.log('[pay-card-invoice] Request received:', { phone, card_id, card_name, amount, is_full_payment });

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: 'Telefone é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const normalizedPhone = normalizePhone(phone);
    console.log('[pay-card-invoice] Normalized phone:', normalizedPhone);

    // Buscar user_id pelo telefone
    const { data: whatsappData, error: whatsappError } = await supabase
      .from('whatsapp_numbers')
      .select('user_id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (whatsappError || !whatsappData) {
      console.error('[pay-card-invoice] User not found:', whatsappError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Usuário não encontrado',
          message: '❌ Não encontrei seu cadastro. Use o comando "cadastrar" primeiro.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = whatsappData.user_id;
    console.log('[pay-card-invoice] User found:', userId);

    // Buscar cartão - por ID ou por nome
    let cardQuery = supabase
      .from('credit_cards')
      .select('id, name, bank_name, current_balance, credit_limit')
      .eq('user_id', userId);

    if (card_id) {
      cardQuery = cardQuery.eq('id', card_id);
    } else if (card_name) {
      cardQuery = cardQuery.ilike('name', `%${card_name}%`);
    } else {
      // Se não especificou, listar cartões disponíveis
      const { data: cards } = await supabase
        .from('credit_cards')
        .select('id, name, bank_name, current_balance')
        .eq('user_id', userId)
        .gt('current_balance', 0);

      if (!cards || cards.length === 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Nenhum cartão com fatura em aberto',
            message: '✅ Parabéns! Você não tem nenhuma fatura em aberto.'
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const cardList = cards.map(c => `• ${c.name} (${c.bank_name}): ${formatCurrency(Number(c.current_balance))}`).join('\n');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Especifique o cartão',
          message: `💳 *Cartões com fatura em aberto:*\n\n${cardList}\n\n📝 Para pagar, diga: "pagar fatura [nome do cartão]" ou "pagar fatura [nome] valor [valor]"`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: cardData, error: cardError } = await cardQuery.maybeSingle();

    if (cardError || !cardData) {
      console.error('[pay-card-invoice] Card not found:', cardError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Cartão não encontrado',
          message: '❌ Não encontrei esse cartão. Use "listar cartões" para ver seus cartões.'
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentBalance = Number(cardData.current_balance);
    
    if (currentBalance <= 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `✅ O cartão *${cardData.name}* não tem fatura em aberto! Limite disponível: ${formatCurrency(Number(cardData.credit_limit))}`
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Determinar valor do pagamento
    let paymentAmount: number;
    let isFullPaymentFlag: boolean;

    if (is_full_payment || !amount) {
      // Pagamento total
      paymentAmount = currentBalance;
      isFullPaymentFlag = true;
    } else {
      // Pagamento parcial
      paymentAmount = Number(amount);
      isFullPaymentFlag = paymentAmount >= currentBalance;
      
      if (paymentAmount > currentBalance) {
        paymentAmount = currentBalance;
        isFullPaymentFlag = true;
      }
    }

    console.log('[pay-card-invoice] Payment details:', { paymentAmount, isFullPaymentFlag, currentBalance });

    // Determinar data do pagamento
    const now = new Date();
    const paymentDateValue = payment_date || now.toISOString().split('T')[0];

    // 1. Criar transação de despesa (saída da conta)
    const { data: transaction, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'expense',
        amount: paymentAmount,
        description: `Pagamento fatura ${cardData.name}${isFullPaymentFlag ? ' (Total)' : ' (Parcial)'}`,
        date: paymentDateValue,
        bank_account_id: bank_account_id || null,
        source: 'whatsapp',
        is_installment: false,
      })
      .select('id')
      .single();

    if (transactionError) {
      console.error('[pay-card-invoice] Transaction error:', transactionError);
      throw transactionError;
    }

    // 2. Registrar pagamento do cartão
    const { error: paymentError } = await supabase
      .from('card_payments')
      .insert({
        user_id: userId,
        credit_card_id: cardData.id,
        bank_account_id: bank_account_id || null,
        amount: paymentAmount,
        payment_date: paymentDateValue,
        is_full_payment: isFullPaymentFlag,
        transaction_id: transaction.id,
      });

    if (paymentError) {
      console.error('[pay-card-invoice] Payment record error:', paymentError);
      // Não falhar por causa disso, a transação já foi criada
    }

    // 3. Atualizar saldo do cartão
    const newBalance = Math.max(0, currentBalance - paymentAmount);
    const { error: updateError } = await supabase
      .from('credit_cards')
      .update({ current_balance: newBalance })
      .eq('id', cardData.id);

    if (updateError) {
      console.error('[pay-card-invoice] Card update error:', updateError);
      throw updateError;
    }

    // Calcular novo limite disponível
    const availableLimit = Number(cardData.credit_limit) - newBalance;

    console.log('[pay-card-invoice] Payment completed successfully');

    const message = isFullPaymentFlag
      ? `✅ *Fatura paga com sucesso!*\n\n💳 Cartão: ${cardData.name}\n💰 Valor pago: ${formatCurrency(paymentAmount)}\n📅 Data: ${formatDate(new Date(paymentDateValue))}\n\n🎉 Fatura quitada! Limite restaurado: ${formatCurrency(availableLimit)}`
      : `✅ *Pagamento registrado!*\n\n💳 Cartão: ${cardData.name}\n💰 Valor pago: ${formatCurrency(paymentAmount)}\n📅 Data: ${formatDate(new Date(paymentDateValue))}\n\n📊 Fatura restante: ${formatCurrency(newBalance)}\n💳 Limite disponível: ${formatCurrency(availableLimit)}`;

    return new Response(
      JSON.stringify({ 
        success: true,
        message,
        data: {
          card_id: cardData.id,
          card_name: cardData.name,
          payment_amount: paymentAmount,
          is_full_payment: isFullPaymentFlag,
          previous_balance: currentBalance,
          new_balance: newBalance,
          available_limit: availableLimit,
          transaction_id: transaction.id,
        }
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[pay-card-invoice] Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: '❌ Erro ao processar pagamento. Tente novamente.'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});