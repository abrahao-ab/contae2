import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCardForm } from '@/components/cards/CreditCardForm';
import { CreditCardCard } from '@/components/cards/CreditCardCard';
import { DeleteCardDialog } from '@/components/cards/DeleteCardDialog';
import { CardDetailView } from '@/components/cards/CardDetailView';
import { UpgradeBanner } from '@/components/upgrade/UpgradeBanner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { useFeatureCheck } from '@/components/upgrade/FeatureGate';
import { toast } from '@/hooks/use-toast';
import { 
  Plus, 
  CreditCard, 
  Loader2, 
  TrendingUp, 
  TrendingDown,
  Wallet,
  Lock
} from 'lucide-react';

interface CreditCardData {
  id: string;
  name: string;
  bank_name: string;
  last_four_digits: string | null;
  credit_limit: number;
  current_balance: number;
  closing_day: number | null;
  due_day: number | null;
  color: string | null;
  is_active: boolean | null;
}

interface Transaction {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  category: {
    name: string;
    color: string | null;
  } | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export default function Cards() {
  const { user } = useAuth();
  const { canCreate, getLimit, isFree, isUnlimited } = usePlanLimits();
  const { checkAndShowUpgrade, UpgradeDialogComponent } = useFeatureCheck();
  const [cards, setCards] = useState<CreditCardData[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form/Dialog states
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCardData | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCard, setDeletingCard] = useState<CreditCardData | null>(null);
  
  // Detail view
  const [selectedCard, setSelectedCard] = useState<CreditCardData | null>(null);
  const [cardTransactions, setCardTransactions] = useState<Transaction[]>([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const cardLimit = getLimit('credit_cards');
  const canCreateCard = canCreate('credit_cards', cards.length);
  const isCardsUnlimited = isUnlimited('credit_cards');

  const fetchCards = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credit_cards')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      
      const formattedCards = (data || []).map((c) => ({
        id: c.id,
        name: c.name,
        bank_name: c.bank_name,
        last_four_digits: c.last_four_digits,
        credit_limit: Number(c.credit_limit),
        current_balance: Number(c.current_balance),
        closing_day: c.closing_day,
        due_day: c.due_day,
        color: c.color,
        is_active: c.is_active,
      }));
      
      setCards(formattedCards);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar cartões',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCardTransactions = async (cardId: string) => {
    if (!user) return;
    
    setLoadingTransactions(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id, description, amount, date,
          category:categories(name, color)
        `)
        .eq('user_id', user.id)
        .eq('credit_card_id', cardId)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setCardTransactions(data as Transaction[] || []);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao carregar transações',
        description: error.message,
      });
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchCards();
  }, [user]);

  const handleCreateClick = () => {
    if (!checkAndShowUpgrade('credit_cards', cards.length)) {
      return;
    }
    setFormOpen(true);
  };

  const handleCreateCard = async (data: any) => {
    if (!user) return;

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

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao criar cartão',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Cartão criado',
      description: `O cartão "${data.name}" foi criado com sucesso.`,
    });
    
    fetchCards();
  };

  const handleUpdateCard = async (data: any) => {
    if (!user || !editingCard) return;

    const { error } = await supabase
      .from('credit_cards')
      .update({
        name: data.name,
        bank_name: data.bankName,
        last_four_digits: data.lastFourDigits || null,
        credit_limit: parseFloat(data.creditLimit),
        closing_day: parseInt(data.closingDay),
        due_day: parseInt(data.dueDay),
        color: data.color,
      })
      .eq('id', editingCard.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao atualizar cartão',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Cartão atualizado',
      description: `O cartão "${data.name}" foi atualizado com sucesso.`,
    });
    
    setEditingCard(null);
    fetchCards();
  };

  const handleDeleteCard = async () => {
    if (!user || !deletingCard) return;

    // Update transactions to remove credit_card_id reference
    await supabase
      .from('transactions')
      .update({ credit_card_id: null })
      .eq('credit_card_id', deletingCard.id)
      .eq('user_id', user.id);

    const { error } = await supabase
      .from('credit_cards')
      .delete()
      .eq('id', deletingCard.id)
      .eq('user_id', user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Erro ao excluir cartão',
        description: error.message,
      });
      throw error;
    }

    toast({
      title: 'Cartão excluído',
      description: `O cartão "${deletingCard.name}" foi excluído.`,
    });
    
    setDeletingCard(null);
    fetchCards();
  };

  const openEditForm = (card: CreditCardData) => {
    setEditingCard(card);
    setFormOpen(true);
  };

  const openDeleteDialog = (card: CreditCardData) => {
    setDeletingCard(card);
    setDeleteDialogOpen(true);
  };

  const openCardDetail = (card: CreditCardData) => {
    setSelectedCard(card);
    fetchCardTransactions(card.id);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingCard(null);
  };

  // Summary stats
  const summary = useMemo(() => {
    const activeCards = cards.filter((c) => c.is_active);
    const totalLimit = activeCards.reduce((sum, c) => sum + c.credit_limit, 0);
    const totalUsed = activeCards.reduce((sum, c) => sum + c.current_balance, 0);
    const totalAvailable = totalLimit - totalUsed;
    const usagePercentage = totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0;
    
    return { totalLimit, totalUsed, totalAvailable, usagePercentage, activeCount: activeCards.length };
  }, [cards]);

  // If showing card detail
  if (selectedCard) {
    return (
      <DashboardLayout>
        <div className="pt-12 lg:pt-0">
          {loadingTransactions ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <CardDetailView
              card={selectedCard}
              transactions={cardTransactions}
              onClose={() => setSelectedCard(null)}
            />
          )}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Cartões de Crédito</h1>
            <p className="text-muted-foreground">
              Gerencie seus cartões, limites e faturas
              {!isCardsUnlimited && cardLimit !== null && (
                <span className="ml-2 text-sm">
                  ({cards.length}/{cardLimit} usados)
                </span>
              )}
            </p>
          </div>
          <Button 
            onClick={handleCreateClick} 
            className="bg-primary hover:bg-primary/90 gap-2"
            disabled={!canCreateCard}
          >
            {!canCreateCard ? (
              <>
                <Lock className="w-4 h-4" />
                Limite atingido
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Novo Cartão
              </>
            )}
          </Button>
        </div>

        {/* Upgrade Banner when limit reached */}
        {!canCreateCard && isFree() && (
          <UpgradeBanner
            feature="cartões de crédito ilimitados"
            description={`Você atingiu o limite de ${cardLimit} cartão no plano gratuito. Faça upgrade para cadastrar cartões ilimitados!`}
          />
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Cartões Ativos</p>
                  <p className="text-xl font-bold text-foreground">{summary.activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-income/20 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-income" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Limite Total</p>
                  <p className="text-xl font-bold text-income">{formatCurrency(summary.totalLimit)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-expense/20 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-expense" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Usado</p>
                  <p className="text-xl font-bold text-expense">{formatCurrency(summary.totalUsed)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponível</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(summary.totalAvailable)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Progress */}
        {summary.totalLimit > 0 && (
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Uso Total de Crédito</span>
                  <span className="text-sm text-muted-foreground">
                    {summary.usagePercentage.toFixed(1)}% usado
                  </span>
                </div>
                <Progress 
                  value={Math.min(summary.usagePercentage, 100)} 
                  className="h-3"
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{formatCurrency(summary.totalUsed)} usado</span>
                  <span>{formatCurrency(summary.totalAvailable)} disponível</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Cards Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 bg-card rounded-xl border border-border">
            <CreditCard className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground mb-2">Nenhum cartão cadastrado</p>
            <p className="text-muted-foreground mb-4">Adicione seu primeiro cartão de crédito</p>
            <Button 
              onClick={handleCreateClick} 
              className="bg-primary hover:bg-primary/90 gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Cartão
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {cards.map((card) => (
              <CreditCardCard
                key={card.id}
                card={card}
                onEdit={openEditForm}
                onDelete={openDeleteDialog}
                onClick={openCardDetail}
              />
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <CreditCardForm
        open={formOpen}
        onClose={closeForm}
        onSubmit={editingCard ? handleUpdateCard : handleCreateCard}
        card={editingCard}
      />

      {/* Delete Dialog */}
      <DeleteCardDialog
        open={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeletingCard(null);
        }}
        onConfirm={handleDeleteCard}
        card={deletingCard}
      />

      <UpgradeDialogComponent />
    </DashboardLayout>
  );
}
