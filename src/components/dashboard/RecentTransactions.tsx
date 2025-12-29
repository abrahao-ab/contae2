import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Plus, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  source?: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
  onAddTransaction?: () => void;
  onViewAll?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const sourceLabels: Record<string, string> = {
  web: 'Web',
  whatsapp_text: 'WhatsApp',
  whatsapp_voice: 'Voz',
  whatsapp_image: 'Imagem',
};

export function RecentTransactions({ transactions, onAddTransaction, onViewAll }: RecentTransactionsProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-card-foreground">Transações Recentes</CardTitle>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-8 px-2 text-muted-foreground hover:text-foreground">
            Ver todas
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddTransaction} className="h-8 px-2 text-primary hover:text-primary/80">
            <Plus className="w-4 h-4 mr-1" />
            Nova
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Receipt className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhuma transação registrada</p>
            <Button variant="outline" size="sm" onClick={onAddTransaction} className="mt-3">
              Adicionar transação
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-5 h-5 text-income" />
                    ) : (
                      <ArrowDownRight className="w-5 h-5 text-expense" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-card-foreground">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(transaction.date), "dd 'de' MMM", { locale: ptBR })}</span>
                      {transaction.category && (
                        <>
                          <span>•</span>
                          <span>{transaction.category}</span>
                        </>
                      )}
                      {transaction.source && (
                        <>
                          <span>•</span>
                          <span className="text-primary">{sourceLabels[transaction.source] || transaction.source}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-semibold',
                    transaction.type === 'income' ? 'text-income' : 'text-expense'
                  )}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
