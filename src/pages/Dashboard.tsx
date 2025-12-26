import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { CreditCardWidget } from '@/components/dashboard/CreditCardWidget';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import { PeriodFilter } from '@/components/dashboard/PeriodFilter';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { CreditCardForm } from '@/components/cards/CreditCardForm';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { startOfMonth, endOfMonth, format } from 'date-fns';

type Period = 'day' | 'week' | 'month' | 'year';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [transactionFormOpen, setTransactionFormOpen] = useState(false);
  const [cardFormOpen, setCardFormOpen] = useState(false);
  
  // Data states
  const [transactions, setTransactions] = useState<any[]>([]);
  const [creditCards, setCreditCards] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Calculated stats
  const [stats, setStats] = useState({
    balance: 0,
    income: 0,
    expense: 0,
    creditLimit: 0,
    creditUsed: 0,
  });

  const fetchData = async () => {
    if (!user) return;

    try {
      const startDate = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [transactionsRes, cardsRes, categoriesRes, accountsRes] = await Promise.all([
        supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate)
          .order('date', { ascending: false })
          .limit(10),
        supabase
          .from('credit_cards')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true),
        supabase
          .from('categories')
          .select('*')
          .eq('user_id', user.id),
        supabase
          .from('bank_accounts')
          .select('*')
          .eq('user_id', user.id),
      ]);

      if (transactionsRes.data) {
        const formattedTransactions = transactionsRes.data.map((t) => ({
          id: t.id,
          type: t.type,
          amount: Number(t.amount),
          description: t.description || '',
          date: t.date,
          source: t.source,
          category: categories.find((c) => c.id === t.category_id)?.name,
        }));
        setTransactions(formattedTransactions);

        // Calculate stats
        const income = transactionsRes.data
          .filter((t) => t.type === 'income')
          .reduce((sum, t) => sum + Number(t.amount), 0);
        const expense = transactionsRes.data
          .filter((t) => t.type === 'expense')
          .reduce((sum, t) => sum + Number(t.amount), 0);

        setStats((prev) => ({
          ...prev,
          income,
          expense,
          balance: income - expense,
        }));
      }

      if (cardsRes.data) {
        const formattedCards = cardsRes.data.map((c) => ({
          id: c.id,
          name: c.name,
          bankName: c.bank_name,
          lastFourDigits: c.last_four_digits,
          creditLimit: Number(c.credit_limit),
          currentBalance: Number(c.current_balance),
          color: c.color,
        }));
        setCreditCards(formattedCards);

        // Calculate credit stats
        const totalLimit = formattedCards.reduce((sum, c) => sum + c.creditLimit, 0);
        const totalUsed = formattedCards.reduce((sum, c) => sum + c.currentBalance, 0);
        setStats((prev) => ({
          ...prev,
          creditLimit: totalLimit,
          creditUsed: totalUsed,
        }));
      }

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }

      if (accountsRes.data) {
        setBankAccounts(accountsRes.data);
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
  };

  useEffect(() => {
    fetchData();
  }, [user, currentDate]);

  const handleAddTransaction = async (data: any) => {
    if (!user) return;

    try {
      const { error } = await supabase.from('transactions').insert({
        user_id: user.id,
        type: data.type,
        amount: parseFloat(data.amount),
        description: data.description,
        date: data.date,
        category_id: data.categoryId || null,
        credit_card_id: data.creditCardId || null,
        bank_account_id: data.bankAccountId || null,
        is_installment: data.isInstallment,
        total_installments: data.totalInstallments || null,
        current_installment: data.isInstallment ? 1 : null,
        source: 'web',
      });

      if (error) throw error;

      toast({
        title: 'Sucesso!',
        description: 'Transação registrada com sucesso.',
      });

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

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral das suas finanças</p>
        </div>

        {/* Period Filter */}
        <PeriodFilter
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
          currentDate={currentDate}
          onDateChange={setCurrentDate}
        />

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Saldo do Período"
            value={formatCurrency(stats.balance)}
            icon={<Wallet className="w-5 h-5" />}
            variant="primary"
          />
          <StatCard
            title="Receitas"
            value={formatCurrency(stats.income)}
            icon={<TrendingUp className="w-5 h-5" />}
            variant="income"
          />
          <StatCard
            title="Despesas"
            value={formatCurrency(stats.expense)}
            icon={<TrendingDown className="w-5 h-5" />}
            variant="expense"
          />
          <StatCard
            title="Limite Disponível"
            value={formatCurrency(stats.creditLimit - stats.creditUsed)}
            icon={<CreditCard className="w-5 h-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Transactions */}
          <div className="lg:col-span-2">
            <RecentTransactions
              transactions={transactions}
              onAddTransaction={() => setTransactionFormOpen(true)}
            />
          </div>

          {/* Credit Cards */}
          <div className="lg:col-span-1">
            <CreditCardWidget
              cards={creditCards}
              onAddCard={() => setCardFormOpen(true)}
            />
          </div>
        </div>
      </div>

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
