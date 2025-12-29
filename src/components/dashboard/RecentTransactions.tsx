import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, Plus, Receipt, User, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category?: string;
  date: string;
  source?: string;
  owner_type?: 'individual' | 'shared';
  couple_id?: string | null;
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
      <CardHeader className="flex flex-row items-center justify-between pb-2 px-3 sm:px-6">
        <CardTitle className="text-base sm:text-lg font-semibold text-card-foreground">Transações Recentes</CardTitle>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="ghost" size="sm" onClick={onViewAll} className="h-8 px-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
            Ver todas
          </Button>
          <Button variant="ghost" size="sm" onClick={onAddTransaction} className="h-8 px-2 text-xs sm:text-sm text-primary hover:text-primary/80">
            <Plus className="w-4 h-4 sm:mr-1" />
            <span className="hidden sm:inline">Nova</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        {transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Receipt className="w-10 h-10 sm:w-12 sm:h-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhuma transação registrada</p>
            <Button variant="outline" size="sm" onClick={onAddTransaction} className="mt-3">
              Adicionar transação
            </Button>
          </div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors active:scale-[0.99]"
              >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div
                    className={cn(
                      'w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      transaction.type === 'income' ? 'bg-income/10' : 'bg-expense/10'
                    )}
                  >
                    {transaction.type === 'income' ? (
                      <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-income" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 sm:w-5 sm:h-5 text-expense" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-sm sm:text-base text-card-foreground truncate">{transaction.description}</p>
                      {/* Owner type indicator */}
                      {transaction.couple_id && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className={cn(
                              "flex items-center justify-center w-4 h-4 rounded-full shrink-0",
                              transaction.owner_type === 'shared' 
                                ? "bg-pink-500/20 text-pink-500" 
                                : "bg-primary/20 text-primary"
                            )}>
                              {transaction.owner_type === 'shared' ? (
                                <Heart className="w-2.5 h-2.5" />
                              ) : (
                                <User className="w-2.5 h-2.5" />
                              )}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {transaction.owner_type === 'shared' ? 'Compartilhado' : 'Individual'}
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(transaction.date), "dd MMM", { locale: ptBR })}</span>
                      {transaction.category && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline truncate">{transaction.category}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={cn(
                    'font-semibold text-sm sm:text-base flex-shrink-0 ml-2',
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
