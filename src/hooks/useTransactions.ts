import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface CreditCard {
  id: string;
  name: string;
  closing_day: number | null;
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
  const getFirstInstallmentDate = (transactionDate: Date, closingDay: number | null): Date => {
    const closingDayValue = closingDay || 1;
    
    // Start with the transaction date
    let firstDate = new Date(transactionDate);
    
    // If the transaction day is after closing day, first installment goes to next month's invoice
    if (transactionDate.getDate() > closingDayValue) {
      firstDate.setMonth(firstDate.getMonth() + 1);
    }
    
    return firstDate;
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

    // Get credit card closing day if a card is selected
    let closingDay: number | null = null;
    if (data.creditCardId) {
      const selectedCard = creditCards.find(c => c.id === data.creditCardId);
      closingDay = selectedCard?.closing_day || null;
    }

    // If installment, create multiple transactions (one per month)
    if (isInstallment && totalInstallments) {
      const transactionsToInsert = [];
      const baseDate = getFirstInstallmentDate(new Date(data.date), closingDay);

      for (let i = 0; i < totalInstallments; i++) {
        const installmentDate = new Date(baseDate);
        installmentDate.setMonth(installmentDate.getMonth() + i);

        transactionsToInsert.push({
          user_id: userId,
          type: data.type,
          amount: installmentAmount,
          description: `${data.description} (${i + 1}/${totalInstallments})`,
          date: format(installmentDate, 'yyyy-MM-dd'),
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
      // Single transaction
      const transactionData = {
        user_id: userId,
        type: data.type,
        amount: totalAmount,
        description: data.description,
        date: format(data.date, 'yyyy-MM-dd'),
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
