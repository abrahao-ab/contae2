import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Pencil, Trash2, CreditCard, Calendar, AlertTriangle, Banknote } from 'lucide-react';

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

interface CreditCardCardProps {
  card: CreditCardData;
  onEdit: (card: CreditCardData) => void;
  onDelete: (card: CreditCardData) => void;
  onClick?: (card: CreditCardData) => void;
  onPayInvoice?: (card: CreditCardData) => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CreditCardCard({ card, onEdit, onDelete, onClick, onPayInvoice }: CreditCardCardProps) {
  const usedPercentage = card.credit_limit > 0 
    ? (card.current_balance / card.credit_limit) * 100 
    : 0;
  const availableLimit = card.credit_limit - card.current_balance;
  const isHighUsage = usedPercentage >= 80;
  const hasBalance = card.current_balance > 0;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-5 transition-all group cursor-pointer hover:shadow-lg',
        'bg-gradient-to-br'
      )}
      style={{
        background: `linear-gradient(135deg, ${card.color || '#3b82f6'}, ${card.color || '#3b82f6'}dd)`,
      }}
      onClick={() => onClick?.(card)}
    >
      {/* Card Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-4 right-4 w-24 h-24 border-2 border-white rounded-full" />
        <div className="absolute top-8 right-8 w-16 h-16 border-2 border-white rounded-full" />
      </div>

      {/* Actions */}
      <div className={cn(
        'absolute top-3 right-3 flex items-center gap-1 transition-opacity z-10',
        'opacity-0 group-hover:opacity-100'
      )}>
        {hasBalance && onPayInvoice && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 bg-green-500/80 hover:bg-green-600/80 text-white"
            onClick={(e) => {
              e.stopPropagation();
              onPayInvoice(card);
            }}
            title="Pagar fatura"
          >
            <Banknote className="w-3.5 h-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white/20 hover:bg-white/30 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onEdit(card);
          }}
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 bg-white/20 hover:bg-red-500/80 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card);
          }}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Card Content */}
      <div className="relative z-10 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/80 text-sm">{card.bank_name}</p>
            <p className="text-white font-semibold text-lg">{card.name}</p>
          </div>
          <CreditCard className="w-8 h-8 text-white/80" />
        </div>

        {/* Card Number */}
        <div className="flex items-center gap-2 text-white/90 font-mono">
          <span>••••</span>
          <span>••••</span>
          <span>••••</span>
          <span>{card.last_four_digits || '••••'}</span>
        </div>

        {/* Limit Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/80">Fatura atual</span>
            <span className="text-white font-semibold">{formatCurrency(card.current_balance)}</span>
          </div>
          <Progress 
            value={Math.min(usedPercentage, 100)} 
            className="h-2 bg-white/20"
          />
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/70">
              {usedPercentage.toFixed(0)}% usado
            </span>
            <span className="text-white/70">
              Limite: {formatCurrency(card.credit_limit)}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-white/20">
          <div className="flex items-center gap-4 text-xs text-white/80">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Fecha dia {card.closing_day || '-'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>Vence dia {card.due_day || '-'}</span>
            </div>
          </div>
          {isHighUsage && (
            <div className="flex items-center gap-1 text-yellow-200 text-xs">
              <AlertTriangle className="w-3 h-3" />
              <span>Alto uso</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
