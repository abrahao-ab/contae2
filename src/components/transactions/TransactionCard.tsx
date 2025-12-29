import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight, CreditCard, Building2, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as LucideIcons from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  is_installment: boolean | null;
  current_installment: number | null;
  total_installments: number | null;
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

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}

const getIcon = (iconName: string | null) => {
  if (!iconName) return LucideIcons.CircleDot;
  
  const iconMap: Record<string, any> = {
    'utensils': LucideIcons.UtensilsCrossed,
    'car': LucideIcons.Car,
    'home': LucideIcons.Home,
    'gamepad-2': LucideIcons.Gamepad2,
    'heart-pulse': LucideIcons.HeartPulse,
    'graduation-cap': LucideIcons.GraduationCap,
    'shopping-bag': LucideIcons.ShoppingBag,
    'wrench': LucideIcons.Wrench,
    'wallet': LucideIcons.Wallet,
    'trending-up': LucideIcons.TrendingUp,
    'gift': LucideIcons.Gift,
    'plane': LucideIcons.Plane,
    'smartphone': LucideIcons.Smartphone,
    'shirt': LucideIcons.Shirt,
    'paw-print': LucideIcons.PawPrint,
    'circle-dot': LucideIcons.CircleDot,
  };
  
  return iconMap[iconName] || LucideIcons.CircleDot;
};

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function TransactionCard({ transaction, onEdit, onDelete }: TransactionCardProps) {
  const isIncome = transaction.type === 'income';
  const CategoryIcon = transaction.category ? getIcon(transaction.category.icon) : LucideIcons.CircleDot;

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Category Icon */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: transaction.category?.color || (isIncome ? '#22c55e' : '#ef4444') }}
        >
          {isIncome ? (
            <ArrowUpRight className="w-5 h-5 text-white" />
          ) : (
            <CategoryIcon className="w-5 h-5 text-white" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-card-foreground truncate">
              {transaction.description || 'Sem descrição'}
            </p>
            {transaction.is_installment && transaction.current_installment && transaction.total_installments && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground flex items-center gap-1 shrink-0">
                <Repeat className="w-3 h-3" />
                {transaction.current_installment}/{transaction.total_installments}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{format(new Date(transaction.date), "dd MMM yyyy", { locale: ptBR })}</span>
            {transaction.category && (
              <>
                <span>•</span>
                <span>{transaction.category.name}</span>
              </>
            )}
            {transaction.credit_card && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  {transaction.credit_card.name}
                </span>
              </>
            )}
            {transaction.bank_account && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {transaction.bank_account.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Amount & Actions */}
      <div className="flex items-center gap-4">
        <p className={cn(
          'font-semibold text-lg',
          isIncome ? 'text-income' : 'text-expense'
        )}>
          {isIncome ? '+' : '-'} {formatCurrency(transaction.amount)}
        </p>

        <div className={cn(
          'flex items-center gap-1 transition-opacity',
          'opacity-0 group-hover:opacity-100'
        )}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={() => onEdit(transaction)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-expense"
            onClick={() => onDelete(transaction)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
