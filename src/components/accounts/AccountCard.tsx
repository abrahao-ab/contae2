import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  icon: string | null;
  color: string | null;
}

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
  onDelete: (account: Account) => void;
}

const getIcon = (iconName: string | null) => {
  if (!iconName) return LucideIcons.Building2;
  
  const iconMap: Record<string, any> = {
    'building-2': LucideIcons.Building2,
    'wallet': LucideIcons.Wallet,
    'piggy-bank': LucideIcons.PiggyBank,
    'landmark': LucideIcons.Landmark,
    'credit-card': LucideIcons.CreditCard,
    'banknote': LucideIcons.Banknote,
    'coins': LucideIcons.Coins,
    'briefcase': LucideIcons.Briefcase,
    'home': LucideIcons.Home,
    'trending-up': LucideIcons.TrendingUp,
    'shield': LucideIcons.Shield,
    'star': LucideIcons.Star,
  };
  
  return iconMap[iconName] || LucideIcons.Building2;
};

export function AccountCard({ account, onEdit, onDelete }: AccountCardProps) {
  const IconComponent = getIcon(account.icon);

  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border hover:shadow-md transition-all group">
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: account.color || '#3b82f6' }}
        >
          <IconComponent className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-medium text-card-foreground">{account.name}</p>
          {account.bank_name && (
            <p className="text-sm text-muted-foreground">{account.bank_name}</p>
          )}
        </div>
      </div>

      <div className={cn(
        'flex items-center gap-1 transition-opacity',
        'opacity-0 group-hover:opacity-100'
      )}>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={() => onEdit(account)}
        >
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-expense"
          onClick={() => onDelete(account)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
