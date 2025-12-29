import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionCard } from '@/components/transactions/TransactionCard';
import { TransactionFilters } from '@/components/transactions/TransactionFilters';
import { DeleteTransactionDialog } from '@/components/transactions/DeleteTransactionDialog';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { toast } from '@/hooks/use-toast';
import { Plus, Receipt, Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
  credit_card_id: string | null;
  bank_account_id: string | null;
  is_installment: boolean | null;
  current_installment: number | null;
  total_installments: number | null;
  parent_transaction_id: string | null;
  category: {
    id: string;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  credit_card: {
    id: string;
    name: string;
  } | null;
  bank_account: {
    id: string;
    name: string;
  } | null;
}

interface Category {
  id: string;
  name: string;
}

interface CreditCard {
  id: string;
  name: string;
  closing_day: number | null;
  due_day: number | null;
}

interface BankAccount {
  id: string;
  name: string;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Transactions() {
  const { user } = useAuth();
  const { createTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  // Form/Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null);

  const fetchData = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const [transactionsRes, categoriesRes, cardsRes, accountsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select(`
            id, type, amount, description, date,
            category_id, credit_card_id, bank_account_id,
            is_installment, current_installment, total_installments,
            parent_transaction_id,
            category:categories(id, name, icon, color),
            credit_card:credit_cards(id, name),
            bank_account:bank_accounts(id, name)
          `)
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase
          .from('categories')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name'),
        supabase
          .from('credit_cards')
          .select('id, name, closing_day, due_day')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('bank_accounts')
          .select('id, name')
          .eq('user_id', user.id)
          .order('name'),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (cardsRes.error) throw cardsRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setTransactions(transactionsRes.data as Transaction[] || []);
      setCategories(categoriesRes.data || []);
      setCreditCards(cardsRes.data || []);
      setBankAccounts(accountsRes.data || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar dados',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  const handleRefresh = useCallback(async () => {
    await fetchData();
    toast({
      title: 'Atualizado',
      description: 'Dados atualizados com sucesso.',
    });
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleCreateTransaction = async (data: any) => {
    if (!user) return;

    try {
      await createTransaction(user.id, {
        type: data.type,
        amount: data.amount,
        description: data.description,
        date: data.date,
        categoryId: data.categoryId,
        creditCardId: data.creditCardId,
        bankAccountId: data.bankAccountId,
        isInstallment: data.isInstallment,
        totalInstallments: data.totalInstallments,
      }, creditCards);

      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar transação',
        description: error.message,
      });
      throw error;
    }
  };

  const handleUpdateTransaction = async (data: any) => {
    if (!user || !editingTransaction) return;

    try {
      await updateTransaction(
        user.id,
        editingTransaction.id,
        {
          id: editingTransaction.id,
          type: editingTransaction.type,
          amount: editingTransaction.amount,
          credit_card_id: editingTransaction.credit_card_id,
        },
        {
          type: data.type,
          amount: data.amount,
          description: data.description,
          date: data.date,
          categoryId: data.categoryId,
          creditCardId: data.creditCardId,
          bankAccountId: data.bankAccountId,
        }
      );

      setEditingTransaction(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar transação',
        description: error.message,
      });
      throw error;
    }
  };

  const handleDeleteTransaction = async () => {
    if (!user || !deletingTransaction) return;

    try {
      await deleteTransaction(user.id, {
        id: deletingTransaction.id,
        type: deletingTransaction.type,
        amount: deletingTransaction.amount,
        credit_card_id: deletingTransaction.credit_card_id,
        is_installment: deletingTransaction.is_installment,
        total_installments: deletingTransaction.total_installments,
        parent_transaction_id: deletingTransaction.parent_transaction_id,
      });

      setDeletingTransaction(null);
      fetchData();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir transação',
        description: error.message,
      });
      throw error;
    }
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormOpen(true);
  };

  const openDeleteDialog = (transaction: Transaction) => {
    setDeletingTransaction(transaction);
    setDeleteDialogOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingTransaction(null);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setDateRange(undefined);
  };

  const hasActiveFilters = searchQuery !== '' || typeFilter !== 'all' || categoryFilter !== 'all' || !!dateRange;

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search filter
      if (searchQuery && !t.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      // Type filter
      if (typeFilter !== 'all' && t.type !== typeFilter) {
        return false;
      }
      // Category filter
      if (categoryFilter !== 'all' && t.category_id !== categoryFilter) {
        return false;
      }
      // Date range filter
      if (dateRange?.from) {
        const transDate = new Date(t.date);
        if (transDate < dateRange.from) return false;
        if (dateRange.to && transDate > dateRange.to) return false;
      }
      return true;
    });
  }, [transactions, searchQuery, typeFilter, categoryFilter, dateRange]);

  // Summary
  const summary = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);
    const expense = filteredTransactions
      .filter((t) => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return { income, expense, balance: income - expense };
  }, [filteredTransactions]);

  // Group by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach((t) => {
      const dateKey = format(new Date(t.date), 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [filteredTransactions]);

  return (
    <DashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-full">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="space-y-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">Transações</h1>
              <p className="text-sm text-muted-foreground">Gerencie suas receitas e despesas</p>
            </div>
            <Button 
              onClick={() => setFormOpen(true)} 
              className="bg-primary hover:bg-primary/90 gap-2 w-full sm:w-auto"
            >
              <Plus className="w-4 h-4" />
              Nova Transação
            </Button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-income/20 flex items-center justify-center">
                  <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-income" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Receitas</p>
                  <p className="text-sm sm:text-xl font-bold text-income">{formatCurrency(summary.income)}</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-expense/20 flex items-center justify-center">
                  <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-expense" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Despesas</p>
                  <p className="text-sm sm:text-xl font-bold text-expense">{formatCurrency(summary.expense)}</p>
                </div>
              </div>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center ${summary.balance >= 0 ? 'bg-income/20' : 'bg-expense/20'}`}>
                  <Receipt className={`w-4 h-4 sm:w-5 sm:h-5 ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground">Saldo</p>
                  <p className={`text-sm sm:text-xl font-bold ${summary.balance >= 0 ? 'text-income' : 'text-expense'}`}>
                    {formatCurrency(summary.balance)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <TransactionFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            typeFilter={typeFilter}
            onTypeChange={setTypeFilter}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            categories={categories}
            onClearFilters={clearFilters}
            hasActiveFilters={hasActiveFilters}
          />

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border">
              <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhuma transação registrada</p>
              <p className="text-sm text-muted-foreground mb-4 text-center px-4">Comece registrando sua primeira transação</p>
              <Button 
                onClick={() => setFormOpen(true)} 
                className="bg-primary hover:bg-primary/90 gap-2"
              >
                <Plus className="w-4 h-4" />
                Nova Transação
              </Button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border">
              <Receipt className="w-10 h-10 sm:w-12 sm:h-12 text-muted-foreground mb-4" />
              <p className="text-base sm:text-lg font-medium text-foreground mb-2">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground">Tente ajustar os filtros</p>
            </div>
          ) : (
            <div className="space-y-4 sm:space-y-6">
              {groupedTransactions.map(([dateKey, dayTransactions]) => (
                <div key={dateKey} className="space-y-2 sm:space-y-3">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <h3 className="text-xs sm:text-sm font-medium text-muted-foreground whitespace-nowrap">
                      {format(new Date(dateKey), "EEE, dd MMM", { locale: ptBR })}
                    </h3>
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      {dayTransactions.length}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {dayTransactions.map((transaction) => (
                      <TransactionCard
                        key={transaction.id}
                        transaction={transaction}
                        onEdit={openEditForm}
                        onDelete={openDeleteDialog}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PullToRefresh>

      {/* Form Dialog */}
      <TransactionForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
        categories={categories}
        creditCards={creditCards}
        bankAccounts={bankAccounts}
        transaction={editingTransaction}
      />

      {/* Delete Dialog */}
      <DeleteTransactionDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingTransaction(null);
        }}
        onConfirm={handleDeleteTransaction}
        transaction={deletingTransaction}
      />
    </DashboardLayout>
  );
}
