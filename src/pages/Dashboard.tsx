import { useState, useEffect, useMemo, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { CreditCardWidget } from '@/components/dashboard/CreditCardWidget';
import { CreditCardAlerts } from '@/components/dashboard/CreditCardAlerts';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { DateRangeFilter } from '@/components/dashboard/DateRangeFilter';
import { IncomeExpenseChart } from '@/components/dashboard/IncomeExpenseChart';
import { CategoryChart } from '@/components/dashboard/CategoryChart';
import { ExportReport } from '@/components/dashboard/ExportReport';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { CreditCardForm } from '@/components/cards/CreditCardForm';
import { PullToRefresh } from '@/components/ui/pull-to-refresh';
import { ViewModeToggle } from '@/components/couple/ViewModeToggle';
import { CoupleGoalsCard } from '@/components/couple/CoupleGoalsCard';
import { CoupleBudgetAlerts } from '@/components/couple/CoupleBudgetAlerts';
import { useAuth } from '@/hooks/useAuth';
import { useTransactions } from '@/hooks/useTransactions';
import { useCouple } from '@/hooks/useCouple';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wallet, TrendingUp, TrendingDown, CreditCard, Loader2, Heart } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { DateRange } from 'react-day-picker';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
  source: string;
  user_id?: string;
  couple_id?: string | null;
  owner_type?: string;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface CreditCardData {
  id: string;
  name: string;
  bankName: string;
  lastFourDigits: string | null;
  creditLimit: number;
  currentBalance: number;
  color: string | null;
  closing_day: number | null;
  due_day: number | null;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { createTransaction } = useTransactions();
  const { viewMode, couple, isCouplePlan, hasCouple } = useCouple();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  
  // Data states
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCardData[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Determine if we should show couple view
  const showCoupleView = isCouplePlan && hasCouple && viewMode === 'couple';

  const fetchData = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Build transactions query based on view mode
      let transactionsQuery;
      
      if (showCoupleView && couple) {
        // Couple view: get all transactions with this couple_id
        transactionsQuery = supabase
          .from('transactions')
          .select('id, type, amount, description, date, category_id, source, user_id, couple_id, owner_type')
          .eq('couple_id', couple.id)
          .order('date', { ascending: false });
      } else {
        // Individual view: get only user's transactions
        transactionsQuery = supabase
          .from('transactions')
          .select('id, type, amount, description, date, category_id, source, user_id, couple_id, owner_type')
          .eq('user_id', user.id)
          .order('date', { ascending: false });
      }

      // Apply date range filter
      if (dateRange?.from) {
        transactionsQuery = transactionsQuery.gte('date', format(dateRange.from, 'yyyy-MM-dd'));
      }
      if (dateRange?.to) {
        transactionsQuery = transactionsQuery.lte('date', format(dateRange.to, 'yyyy-MM-dd'));
      }

      // Fetch all data in parallel
      const [transactionsRes, cardsRes, categoriesRes, accountsRes] = await Promise.all([
        transactionsQuery,
        supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('categories')
          .select('id, name, icon, color')
          .or(`user_id.eq.${user.id}${couple ? `,couple_id.eq.${couple.id}` : ''}`),
        supabase
          .from('bank_accounts')
          .select('id, name')
          .eq('user_id', user.id),
      ]);

      if (transactionsRes.error) throw transactionsRes.error;
      if (cardsRes.error) throw cardsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      if (accountsRes.error) throw accountsRes.error;

      setAllTransactions(transactionsRes.data as Transaction[] || []);
      setCategories(categoriesRes.data || []);
      setBankAccounts(accountsRes.data || []);

      if (cardsRes.data) {
        const formattedCards = cardsRes.data.map((c) => ({
          id: c.id,
          name: c.name,
          bankName: c.bank_name,
          lastFourDigits: c.last_four_digits,
          creditLimit: Number(c.credit_limit),
          currentBalance: Number(c.current_balance),
          color: c.color,
          closing_day: c.closing_day,
          due_day: c.due_day,
        }));
        setCreditCards(formattedCards);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, dateRange, showCoupleView, couple]);

  const handleRefresh = useCallback(async () => {
    await fetchData();
    toast({
      title: 'Atualizado',
      description: 'Dados atualizados com sucesso.',
    });
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate stats
  const stats = useMemo(() => {
    const income = allTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const expense = allTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);
    const creditLimit = creditCards.reduce((sum, c) => sum + c.creditLimit, 0);
    const creditUsed = creditCards.reduce((sum, c) => sum + c.currentBalance, 0);

    return {
      balance: income - expense,
      income,
      expense,
      creditLimit,
      creditUsed,
    };
  }, [allTransactions, creditCards]);

  // Format transactions for RecentTransactions component
  const recentTransactions = useMemo(() => {
    return allTransactions.slice(0, 10).map((t) => ({
      id: t.id,
      type: t.type,
      amount: Number(t.amount),
      description: t.description || '',
      date: t.date,
      source: t.source,
      category: categories.find((c) => c.id === t.category_id)?.name,
    }));
  }, [allTransactions, categories]);

  // Chart data
  const chartTransactions = useMemo(() => {
    return allTransactions.map((t) => ({
      id: t.id,
      type: t.type as 'income' | 'expense',
      amount: Number(t.amount),
      date: t.date,
      category_id: t.category_id,
    }));
  }, [allTransactions]);

  const handleAddTransaction = async (data: any) => {
    if (!user) return;

    try {
      // Map creditCards to the format expected by useTransactions hook
      const cardsForHook = creditCards.map(c => ({
        id: c.id,
        name: c.name,
        closing_day: c.closing_day,
      }));

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
      }, cardsForHook);

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar a transação.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const handleAddCard = async (data: any) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('credit_cards').insert({
        user_id: user.id,
        name: data.name,
        bank_name: data.bankName,
        last_four_digits: data.lastFourDigits || null,
        credit_limit: parseFloat(data.creditLimit),
        closing_day: parseInt(data.closingDay),
        due_day: parseInt(data.dueDay),
        color: data.color,
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Cartão adicionado com sucesso.',
      });

      fetchData();
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível salvar o cartão.',
        variant: 'destructive',
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PullToRefresh onRefresh={handleRefresh} className="min-h-full">
        <div className="space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">
                    {showCoupleView ? 'Dashboard do Casal' : 'Dashboard'}
                  </h1>
                  {showCoupleView && <Heart className="w-5 h-5 text-primary" fill="currentColor" />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {showCoupleView ? 'Visão financeira conjunta' : 'Visão geral das suas finanças'}
                </p>
              </div>
              <ViewModeToggle />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <ExportReport
                transactions={allTransactions}
                categories={categories}
                dateRange={{ from: dateRange?.from, to: dateRange?.to }}
                stats={stats}
              />
            </div>
          </div>

          {/* Credit Card Alerts */}
          <CreditCardAlerts cards={creditCards} threshold={80} />

          {/* Couple Budget Alerts */}
          {showCoupleView && (
            <CoupleBudgetAlerts 
              transactions={chartTransactions} 
              categories={categories} 
            />
          )}

          {/* Date Range Filter */}
          <DateRangeFilter
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
          />

          {/* Stats Grid - 2 columns on mobile, 4 on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <StatCard
              title={showCoupleView ? "Saldo do Casal" : "Saldo"}
              value={formatCurrency(stats.balance)}
              icon={showCoupleView ? <Heart className="w-4 h-4 sm:w-5 sm:h-5" /> : <Wallet className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="primary"
            />
            <StatCard
              title="Receitas"
              value={formatCurrency(stats.income)}
              icon={<TrendingUp className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="income"
            />
            <StatCard
              title="Despesas"
              value={formatCurrency(stats.expense)}
              icon={<TrendingDown className="w-4 h-4 sm:w-5 sm:h-5" />}
              variant="expense"
            />
            <StatCard
              title="Limite Livre"
              value={formatCurrency(stats.creditLimit - stats.creditUsed)}
              icon={<CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />}
            />
          </div>

          {/* Charts - Stack on mobile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <IncomeExpenseChart transactions={chartTransactions} />
            <CategoryChart
              transactions={chartTransactions}
              categories={categories}
              type="expense"
            />
          </div>

          {/* Couple Goals Card - Only in couple view */}
          {showCoupleView && (
            <CoupleGoalsCard />
          )}

          {/* Main Content Grid - Stack on mobile/tablet */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* Transactions */}
            <div className="xl:col-span-2">
              <RecentTransactions
                transactions={recentTransactions}
                onAddTransaction={() => setTransactionFormOpen(true)}
              />
            </div>

            {/* Credit Cards */}
            <div className="xl:col-span-1">
              <CreditCardWidget
                cards={creditCards}
                onAddCard={() => setCardFormOpen(true)}
              />
            </div>
          </div>
        </div>
      </PullToRefresh>

      {/* Forms */}
      <TransactionForm
        open={transactionFormOpen}
        onClose={() => setTransactionFormOpen(false)}
        onSubmit={handleAddTransaction}
        categories={categories}
        creditCards={creditCards}
        bankAccounts={bankAccounts}
      />

      <CreditCardForm
        open={cardFormOpen}
        onClose={() => setCardFormOpen(false)}
        onSubmit={handleAddCard}
      />
    </DashboardLayout>
  );
}
