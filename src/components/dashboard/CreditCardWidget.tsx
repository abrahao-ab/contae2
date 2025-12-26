import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CreditCardData {
  id: string;
  name: string;
  bankName: string;
  lastFourDigits?: string;
  creditLimit: number;
  currentBalance: number;
  color?: string;
}

interface CreditCardWidgetProps {
  cards: CreditCardData[];
  onAddCard?: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CreditCardWidget({ cards, onAddCard }: CreditCardWidgetProps) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold">Cartões de Crédito</CardTitle>
        <Button variant="ghost" size="sm" onClick={onAddCard} className="h-8 px-2">
          <Plus className="w-4 h-4 mr-1" />
          Adicionar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {cards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <CreditCard className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">Nenhum cartão cadastrado</p>
            <Button variant="outline" size="sm" onClick={onAddCard} className="mt-3">
              Adicionar cartão
            </Button>
          </div>
        ) : (
          cards.map((card) => {
            const usagePercent = (card.currentBalance / card.creditLimit) * 100;
            const available = card.creditLimit - card.currentBalance;
            
            return (
              <div
                key={card.id}
                className="p-4 rounded-xl bg-muted/50 border border-border/50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: card.color || 'hsl(var(--primary))' }}
                    >
                      <CreditCard className="w-5 h-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{card.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {card.bankName} {card.lastFourDigits && `•••• ${card.lastFourDigits}`}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Utilizado</span>
                    <span className="font-medium text-foreground">
                      {formatCurrency(card.currentBalance)}
                    </span>
                  </div>
                  <Progress 
                    value={usagePercent} 
                    className={cn(
                      'h-2',
                      usagePercent > 80 ? '[&>div]:bg-expense' : usagePercent > 50 ? '[&>div]:bg-warning' : '[&>div]:bg-income'
                    )}
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Disponível: {formatCurrency(available)}</span>
                    <span>Limite: {formatCurrency(card.creditLimit)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
