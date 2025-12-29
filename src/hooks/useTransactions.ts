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
  ownerType?: 'individual' | 'partner' | 'shared';
  coupleId?: string;
}

interface TransactionWithCard {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  credit_card_id: string | null;
  is_installment?: boolean | null;
  total_installments?: number | null;
  parent_transaction_id?: string | null;
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
   * - Se a compra foi antes ou no dia do fechamento: vai para a fatura atual (vence no mesmo mês ou próximo)
   * - Se a compra foi após o fechamento: vai para a próxima fatura (vence no mês seguinte)
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
    
    // Se o dia de vencimento é maior que o dia de fechamento, 
    // a fatura vence no mesmo mês que fecha
    // Caso contrário, vence no mês seguinte ao fechamento
    const dueSameMonthAsClosing = dueDayValue > closingDayValue;
    
    if (purchaseDay <= closingDayValue) {
      // Compra antes ou no dia do fechamento: entra na fatura atual
      if (dueSameMonthAsClosing) {
        // Vencimento no mesmo mês do fechamento
        dueMonth = purchaseMonth;
        dueYear = purchaseYear;
      } else {
        // Vencimento no mês seguinte ao fechamento
        dueMonth = purchaseMonth + 1;
        dueYear = purchaseYear;
      }
    } else {
      // Compra após o fechamento: vai para a próxima fatura
      if (dueSameMonthAsClosing) {
        dueMonth = purchaseMonth + 1;
        dueYear = purchaseYear;
      } else {
        dueMonth = purchaseMonth + 2;
        dueYear = purchaseYear;
      }
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
      const firstDueDate = isCreditCardExpense 
        ? getInvoiceDueDate(new Date(data.date), closingDay, dueDay)
        : new Date(data.date);

      // Insert first installment to get its ID
      const firstInstallmentDate = new Date(firstDueDate);
      const { data: firstTransaction, error: firstError } = await supabase
        .from('transactions')
        .insert({
          user_id: userId,
          type: data.type,
          amount: installmentAmount,
          description: `${data.description} (1/${totalInstallments})`,
          date: format(firstInstallmentDate, 'yyyy-MM-dd'),
          purchase_date: isCreditCardExpense ? originalPurchaseDate : null,
          category_id: data.categoryId || null,
          credit_card_id: data.creditCardId || null,
          bank_account_id: data.bankAccountId || null,
          is_installment: true,
          total_installments: totalInstallments,
          current_installment: 1,
          source: 'web' as const,
          couple_id: data.coupleId || null,
          owner_type: (data.ownerType === 'shared' ? 'shared' : 'individual') as 'individual' | 'shared',
        })
        .select('id')
        .single();

      if (firstError) throw firstError;

      const parentId = firstTransaction.id;

      // Update first transaction to reference itself as parent
      await supabase
        .from('transactions')
        .update({ parent_transaction_id: parentId })
        .eq('id', parentId);

      // Insert remaining installments with parent_transaction_id
      if (totalInstallments > 1) {
        const remainingTransactions = [];
        for (let i = 1; i < totalInstallments; i++) {
          const installmentDate = new Date(firstDueDate);
          installmentDate.setMonth(installmentDate.getMonth() + i);

          remainingTransactions.push({
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
            parent_transaction_id: parentId,
            source: 'web' as const,
            couple_id: data.coupleId || null,
            owner_type: (data.ownerType === 'shared' ? 'shared' : 'individual') as 'individual' | 'shared',
          });
        }

        const { error } = await supabase.from('transactions').insert(remainingTransactions);
        if (error) throw error;
      }
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
        couple_id: data.coupleId || null,
        owner_type: (data.ownerType === 'shared' ? 'shared' : 'individual') as 'individual' | 'shared',
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
    transaction: TransactionWithCard,
    deleteAllInstallments: boolean = true
  ) => {
    // Check if this is an installment transaction
    const isInstallment = transaction.is_installment && transaction.parent_transaction_id;
    
    if (isInstallment && deleteAllInstallments && transaction.parent_transaction_id) {
      const parentId = transaction.parent_transaction_id;
      
      // Get all related installments (including the parent itself)
      // We need to get transactions where parent_transaction_id = parentId OR id = parentId
      const { data: allInstallments } = await supabase
        .from('transactions')
        .select('id, amount, credit_card_id, type')
        .or(`parent_transaction_id.eq.${parentId},id.eq.${parentId}`)
        .eq('user_id', userId);

      if (allInstallments && allInstallments.length > 0) {
        // Calculate total amount to restore to credit card
        const totalAmount = allInstallments.reduce((sum, t) => sum + Number(t.amount), 0);
        const creditCardId = allInstallments[0].credit_card_id;
        const transactionType = allInstallments[0].type;

        // Restore credit card balance if applicable
        if (creditCardId && transactionType === 'expense') {
          const { data: cardData } = await supabase
            .from('credit_cards')
            .select('current_balance')
            .eq('id', creditCardId)
            .single();

          if (cardData) {
            await supabase
              .from('credit_cards')
              .update({ current_balance: Math.max(0, cardData.current_balance - totalAmount) })
              .eq('id', creditCardId);
          }
        }

        // First delete child installments (those with parent_transaction_id)
        await supabase
          .from('transactions')
          .delete()
          .eq('parent_transaction_id', parentId)
          .neq('id', parentId)
          .eq('user_id', userId);

        // Then delete the parent transaction
        const { error } = await supabase
          .from('transactions')
          .delete()
          .eq('id', parentId)
          .eq('user_id', userId);

        if (error) throw error;

        toast({
          title: 'Parcelas excluídas',
          description: `${allInstallments.length} parcelas foram removidas.`,
        });
      }
    } else {
      // Single transaction or delete only this installment
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
    }
  }, []);

  return {
    createTransaction,
    updateTransaction,
    deleteTransaction,
  };
}
