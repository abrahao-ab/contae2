import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: 'default' | 'income' | 'expense' | 'primary';
  className?: string;
}

export function StatCard({ title, value, icon, trend, variant = 'default', className }: StatCardProps) {
  const variants = {
    default: 'bg-card border-border',
    income: 'bg-card border-l-4 border-l-income border-border',
    expense: 'bg-card border-l-4 border-l-expense border-border',
    primary: 'gradient-primary border-transparent',
  };

  const iconBgVariants = {
    default: 'bg-muted text-muted-foreground',
    income: 'bg-income/10 text-income',
    expense: 'bg-expense/10 text-expense',
    primary: 'bg-white/20 text-white',
  };

  const textVariants = {
    default: 'text-card-foreground',
    income: 'text-card-foreground',
    expense: 'text-card-foreground',
    primary: 'text-white',
  };

  const subtextVariants = {
    default: 'text-muted-foreground',
    income: 'text-muted-foreground',
    expense: 'text-muted-foreground',
    primary: 'text-white/70',
  };

  return (
    <Card className={cn('border overflow-hidden transition-all duration-300 hover:shadow-lg', variants[variant], className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className={cn('text-sm font-medium', subtextVariants[variant])}>
              {title}
            </p>
            <p className={cn('text-2xl lg:text-3xl font-bold tracking-tight', textVariants[variant])}>
              {value}
            </p>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium',
                trend.isPositive ? 'text-income' : 'text-expense'
              )}>
                {trend.isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span>{trend.value}%</span>
                <span className={cn('font-normal', subtextVariants[variant])}>
                  vs mês anterior
                </span>
              </div>
            )}
          </div>
          <div className={cn('p-3 rounded-xl', iconBgVariants[variant])}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
