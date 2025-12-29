import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CreditCard {
  id: string;
  name: string;
  closing_day: number | null;
  due_day?: number | null;
}

interface CreateTransactionData {
  type: 'income' | 'expense';
  amount: string;
  description: string;
  date: Date;
  categoryId?: string;
  creditCardId?: string;
  bankAccountId?: string;
  isInstallment?: boolean;
  totalInstallments?: number;
}

interface TransactionWithCard {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  credit_card_id: string | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function useTransactions() {
  /**
   * Calcula a data de vencimento da fatura para uma compra no cartão
   * - Se a compra foi antes do fechamento: vai para a fatura atual (vence no mês seguinte)
   * - Se a compra foi após o fechamento: vai para a próxima fatura (vence dois meses depois)
   */
  const getInvoiceDueDate = (
    transactionDate: Date, 
    closingDay: number | null, 
    dueDay: number | null
  ): Date => {
    const closingDayValue = closingDay || 1;
    const dueDayValue = dueDay || 10;
    
    const purchaseDay = transactionDate.getDate();
    const purchaseMonth = transactionDate.getMonth();
    const purchaseYear = transactionDate.getFullYear();
    
    let dueMonth: number;
    let dueYear: number;
    
    if (purchaseDay <= closingDayValue) {
      // Compra antes do fechamento: fatura vence no mês seguinte
      dueMonth = purchaseMonth + 1;
      dueYear = purchaseYear;
    } else {
      // Compra após o fechamento: fatura vence dois meses depois
      dueMonth = purchaseMonth + 2;
      dueYear = purchaseYear;
    }
    
    // Ajustar ano se o mês passou de dezembro
    if (dueMonth > 11) {
      dueYear += Math.floor(dueMonth / 12);
      dueMonth = dueMonth % 12;
    }
    
    return new Date(dueYear, dueMonth, dueDayValue);
  };

  const createTransaction = useCallback(async (
    userId: string,
    data: CreateTransactionData,
    creditCards: CreditCard[]
  ) => {
    const totalAmount = parseFloat(data.amount);
    const isInstallment = data.isInstallment && data.totalInstallments && data.totalInstallments > 1;
    const totalInstallments = isInstallment ? data.totalInstallments : null;
    const installmentAmount = isInstallment && totalInstallments ? totalAmount / totalInstallments : totalAmount;

    // Get credit card info if a card is selected
    let closingDay: number | null = null;
    let dueDay: number | null = null;
    const isCreditCardExpense = data.creditCardId && data.type === 'expense';
    
    if (data.creditCardId) {
      const selectedCard = creditCards.find(c => c.id === data.creditCardId);
      closingDay = selectedCard?.closing_day || null;
      dueDay = selectedCard?.due_day || null;
    }

    // Store original purchase date for credit card transactions
    const originalPurchaseDate = format(data.date, 'yyyy-MM-dd');

    // If installment, create multiple transactions (one per month)
    if (isInstallment && totalInstallments) {
      const transactionsToInsert = [];
      const firstDueDate = isCreditCardExpense 
        ? getInvoiceDueDate(new Date(data.date), closingDay, dueDay)
        : new Date(data.date);

      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = new Date(firstDueDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        transactionsToInsert.push({
          user_id: userId,
          type: data.type,
          amount: installmentAmount,
          description: `${data.description} (${i + 1}/${totalInstallments})`,
          date: format(installmentDate, 'yyyy-MM-dd'),
          purchase_date: isCreditCardExpense ? originalPurchaseDate : null,
          category_id: data.categoryId || null,
          credit_card_id: data.creditCardId || null,
          bank_account_id: data.bankAccountId || null,
          is_installment: true,
          total_installments: totalInstallments,
          current_installment: i + 1,
          source: 'web' as const,
        });
      }

      const { error } = await supabase.from('transactions').insert(transactionsToInsert);
      if (error) throw error;
    } else {
      // Single transaction - use due date if credit card expense
      const transactionDate = isCreditCardExpense
        ? getInvoiceDueDate(new Date(data.date), closingDay, dueDay)
        : data.date;

      const transactionData = {
        user_id: userId,
        type: data.type,
        amount: totalAmount,
        description: data.description,
        date: format(transactionDate, 'yyyy-MM-dd'),
        purchase_date: isCreditCardExpense ? originalPurchaseDate : null,
        category_id: data.categoryId || null,
        credit_card_id: data.creditCardId || null,
        bank_account_id: data.bankAccountId || null,
        is_installment: false,
        total_installments: null,
        current_installment: null,
        source: 'web' as const,
      };

      const { error } = await supabase.from('transactions').insert(transactionData);
      if (error) throw error;
    }

    // Update credit card balance if credit card was used (add full amount for installments)
    if (data.creditCardId && data.type === 'expense') {
      const { data: cardData } = await supabase
        .from('credit_cards')
        .select('current_balance')
        .eq('id', data.creditCardId)
        .single();

      if (cardData) {
        await supabase
          .from('credit_cards')
          .update({ current_balance: cardData.current_balance + totalAmount })
          .eq('id', data.creditCardId);
      }
    }

    toast({
      title: 'Transação criada',
      description: isInstallment && totalInstallments
        ? `${totalInstallments} parcelas de ${formatCurrency(installmentAmount)} criadas.`
        : 'A transação foi registrada com sucesso.',
    });
  }, []);

  const updateTransaction = useCallback(async (
    userId: string,
    transactionId: string,
    oldTransaction: TransactionWithCard,
    data: CreateTransactionData
  ) => {
    const newAmount = parseFloat(data.amount);
    const oldAmount = oldTransaction.amount;
    const oldCardId = oldTransaction.credit_card_id;
    const newCardId = data.creditCardId || null;

    // Handle credit card balance changes
    if (oldTransaction.type === 'expense') {
      // If old transaction had a card, restore its balance
      if (oldCardId) {
        const { data: oldCardData } = await supabase
          .from('credit_cards')
          .select('current_balance')
          .eq('id', oldCardId)
          .single();

        if (oldCardData) {
          await supabase
            .from('credit_cards')
            .update({ current_balance: Math.max(0, oldCardData.current_balance - oldAmount) })
            .eq('id', oldCardId);
        }
      }
    }

    // If new transaction has a card and is expense, add to its balance
    if (newCardId && data.type === 'expense') {
      const { data: newCardData } = await supabase
        .from('credit_cards')
        .select('current_balance')
        .eq('id', newCardId)
        .single();

      if (newCardData) {
        await supabase
          .from('credit_cards')
          .update({ current_balance: newCardData.current_balance + newAmount })
          .eq('id', newCardId);
      }
    }

    const { error } = await supabase
      .from('transactions')
      .update({
        type: data.type,
        amount: newAmount,
        description: data.description,
        date: format(data.date, 'yyyy-MM-dd'),
        category_id: data.categoryId || null,
        credit_card_id: newCardId,
        bank_account_id: data.bankAccountId || null,
      })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (error) throw error;

    toast({
      title: 'Transação atualizada',
      description: 'As alterações foram salvas.',
    });
  }, []);

  const deleteTransaction = useCallback(async (
    userId: string,
    transaction: TransactionWithCard
  ) => {
    // If credit card was used, restore the balance
    if (transaction.credit_card_id && transaction.type === 'expense') {
      const { data: cardData } = await supabase
        .from('credit_cards')
        .select('current_balance')
        .eq('id', transaction.credit_card_id)
        .single();

      if (cardData) {
        await supabase
          .from('credit_cards')
          .update({ current_balance: Math.max(0, cardData.current_balance - transaction.amount) })
          .eq('id', transaction.credit_card_id);
      }
    }

    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', transaction.id)
      .eq('user_id', userId);

    if (error) throw error;

    toast({
      title: 'Transação excluída',
      description: 'A transação foi removida.',
    });
  }, []);

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
