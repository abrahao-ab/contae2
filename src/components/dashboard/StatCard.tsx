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
    income: 'bg-card border-l-4 border-l-success border-border',
    expense: 'bg-card border-l-4 border-l-destructive border-border',
    primary: 'bg-primary border-primary',
  };

  const iconBgVariants = {
    default: 'bg-muted text-muted-foreground',
    income: 'bg-success/15 text-success',
    expense: 'bg-destructive/15 text-destructive',
    primary: 'bg-primary-foreground/20 text-primary-foreground',
  };

  const textVariants = {
    default: 'text-card-foreground',
    income: 'text-card-foreground',
    expense: 'text-card-foreground',
    primary: 'text-primary-foreground',
  };

  const subtextVariants = {
    default: 'text-muted-foreground',
    income: 'text-muted-foreground',
    expense: 'text-muted-foreground',
    primary: 'text-primary-foreground/80',
  };

  return (
    <Card className={cn('border overflow-hidden transition-all duration-300 hover:shadow-lg', variants[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className={cn('text-sm font-medium', subtextVariants[variant])}>
              {title}
            </p>
            <p className={cn('text-2xl lg:text-3xl font-bold tracking-tight', textVariants[variant])}>
              {value}
            </p>
            {trend && (
              <div className={cn(
                'flex items-center gap-1 text-sm font-medium mt-2',
                trend.isPositive ? 'text-success' : 'text-destructive'
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
