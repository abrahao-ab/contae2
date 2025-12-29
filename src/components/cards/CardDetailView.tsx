import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  CreditCard, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  ArrowLeft,
  Receipt,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
}

interface CardDetailViewProps {
  card: CreditCardData;
  transactions: Transaction[];
  onClose: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CardDetailView({ card, transactions, onClose }: CardDetailViewProps) {
  const usedPercentage = card.credit_limit > 0 
    ? (card.current_balance / card.credit_limit) * 100 
    : 0;
  const availableLimit = card.credit_limit - card.current_balance;

  // Group transactions by date
  const groupedTransactions = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    transactions.forEach((t) => {
      const dateKey = t.date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(t);
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{card.name}</h2>
          <p className="text-muted-foreground">{card.bank_name}</p>
        </div>
      </div>

      {/* Card Visual */}
      <div
        className="relative overflow-hidden rounded-2xl p-6"
        style={{
          background: `linear-gradient(135deg, ${card.color || '#3b82f6'}, ${card.color || '#3b82f6'}dd)`,
        }}
      >
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 w-32 h-32 border-2 border-white rounded-full" />
          <div className="absolute top-10 right-10 w-20 h-20 border-2 border-white rounded-full" />
        </div>

        <div className="relative z-10 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/80 text-sm">Fatura Atual</p>
              <p className="text-white font-bold text-3xl">{formatCurrency(card.current_balance)}</p>
            </div>
            <CreditCard className="w-10 h-10 text-white/80" />
          </div>

          <div className="flex items-center gap-2 text-white/90 font-mono text-lg">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>{card.last_four_digits || '••••'}</span>
          </div>

          <div className="space-y-2">
            <Progress 
              value={Math.min(usedPercentage, 100)} 
              className="h-3 bg-white/20"
            />
            <div className="flex items-center justify-between text-sm text-white/80">
              <span>{usedPercentage.toFixed(1)}% do limite usado</span>
              <span>Limite: {formatCurrency(card.credit_limit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingDown className="w-5 h-5 text-expense mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Gasto no mês</p>
            <p className="font-semibold text-foreground">{formatCurrency(totalSpent)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <TrendingUp className="w-5 h-5 text-income mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Disponível</p>
            <p className="font-semibold text-foreground">{formatCurrency(availableLimit)}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Fechamento</p>
            <p className="font-semibold text-foreground">Dia {card.closing_day || '-'}</p>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-center">
            <Calendar className="w-5 h-5 text-warning mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Vencimento</p>
            <p className="font-semibold text-foreground">Dia {card.due_day || '-'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-foreground">Transações do Cartão</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Receipt className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma transação neste cartão</p>
            </div>
          ) : (
            <div className="space-y-4">
              {groupedTransactions.map(([dateKey, dayTransactions]) => (
                <div key={dateKey} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {format(new Date(dateKey), "dd 'de' MMMM", { locale: ptBR })}
                  </p>
                  <div className="space-y-2">
                    {dayTransactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: transaction.category?.color || '#94a3b8' }}
                          />
                          <div>
                            <p className="font-medium text-sm text-foreground">
                              {transaction.description || 'Sem descrição'}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {transaction.category?.name || 'Sem categoria'}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold text-expense">
                          -{formatCurrency(transaction.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
