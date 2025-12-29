import { AlertTriangle, CreditCard, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface CreditCardData {
  id: string;
  name: string;
  bankName: string;
  creditLimit: number;
  currentBalance: number;
  color?: string;
}

interface CreditCardAlertsProps {
  cards: CreditCardData[];
  threshold?: number; // Percentage threshold (default 80)
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CreditCardAlerts({ cards, threshold = 80 }: CreditCardAlertsProps) {
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  const cardsNearLimit = cards.filter((card) => {
    if (card.creditLimit === 0) return false;
    const usagePercent = (card.currentBalance / card.creditLimit) * 100;
    return usagePercent >= threshold && !dismissedAlerts.has(card.id);
  });

  const dismissAlert = (cardId: string) => {
    setDismissedAlerts((prev) => new Set([...prev, cardId]));
  };

  if (cardsNearLimit.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {cardsNearLimit.map((card) => {
        const usagePercent = Math.round((card.currentBalance / card.creditLimit) * 100);
        const available = card.creditLimit - card.currentBalance;
        const isOverLimit = usagePercent >= 100;
        const isCritical = usagePercent >= 90;

        return (
          <Alert
            key={card.id}
            variant="destructive"
            className={cn(
              'border-l-4 relative',
              isOverLimit
                ? 'border-l-destructive bg-destructive/10'
                : isCritical
                ? 'border-l-expense bg-expense/10'
                : 'border-l-warning bg-warning/10'
            )}
          >
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-foreground"
              onClick={() => dismissAlert(card.id)}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                  isOverLimit
                    ? 'bg-destructive/20'
                    : isCritical
                    ? 'bg-expense/20'
                    : 'bg-warning/20'
                )}
              >
                <AlertTriangle
                  className={cn(
                    'w-5 h-5',
                    isOverLimit
                      ? 'text-destructive'
                      : isCritical
                      ? 'text-expense'
                      : 'text-warning'
                  )}
                />
              </div>
              
              <div className="flex-1 pr-6">
                <AlertTitle
                  className={cn(
                    'font-semibold text-sm',
                    isOverLimit
                      ? 'text-destructive'
                      : isCritical
                      ? 'text-expense'
                      : 'text-warning'
                  )}
                >
                  {isOverLimit
                    ? 'Limite Excedido!'
                    : isCritical
                    ? 'Limite Crítico!'
                    : 'Alerta de Limite'}
                </AlertTitle>
                <AlertDescription className="text-sm text-muted-foreground mt-1">
                  <div className="flex items-center gap-2 mb-1">
                    <CreditCard className="w-4 h-4" style={{ color: card.color }} />
                    <span className="font-medium text-foreground">{card.name}</span>
                    <span className="text-xs">({card.bankName})</span>
                  </div>
                  <p>
                    {isOverLimit ? (
                      <>
                        Você excedeu o limite do cartão em{' '}
                        <span className="font-semibold text-destructive">
                          {formatCurrency(card.currentBalance - card.creditLimit)}
                        </span>
                      </>
                    ) : (
                      <>
                        Você está usando{' '}
                        <span className="font-semibold">{usagePercent}%</span> do limite.
                        Disponível:{' '}
                        <span className="font-semibold">{formatCurrency(available)}</span>
                      </>
                    )}
                  </p>
                </AlertDescription>
              </div>
            </div>
          </Alert>
        );
      })}
    </div>
  );
}
