import { useMemo } from 'react';
import { useCouple } from '@/hooks/useCouple';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, TrendingUp, Heart } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string | null;
  owner_type?: string;
}

interface Category {
  id: string;
  name: string;
}

interface CoupleBudgetAlertsProps {
  transactions: Transaction[];
  categories: Category[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CoupleBudgetAlerts({ transactions, categories }: CoupleBudgetAlertsProps) {
  const { budgets, hasCouple, isCouplePlan, viewMode } = useCouple();

  const alerts = useMemo(() => {
    if (!isCouplePlan || !hasCouple || viewMode !== 'couple') {
      return [];
    }

    const alertsList: { 
      type: 'warning' | 'danger'; 
      categoryName: string; 
      spent: number; 
      limit: number; 
      percentage: number;
    }[] = [];

    // Calculate spending per category
    const spendingByCategory: Record<string, number> = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        if (t.category_id) {
          spendingByCategory[t.category_id] = (spendingByCategory[t.category_id] || 0) + t.amount;
        }
      });

    // Check each budget
    budgets.forEach(budget => {
      const spent = budget.category_id ? spendingByCategory[budget.category_id] || 0 : 0;
      const percentage = (spent / budget.monthly_limit) * 100;
      const categoryName = budget.category_id 
        ? categories.find(c => c.id === budget.category_id)?.name || 'Categoria'
        : 'Geral';

      if (percentage >= 100) {
        alertsList.push({
          type: 'danger',
          categoryName,
          spent,
          limit: budget.monthly_limit,
          percentage,
        });
      } else if (percentage >= budget.alert_threshold) {
        alertsList.push({
          type: 'warning',
          categoryName,
          spent,
          limit: budget.monthly_limit,
          percentage,
        });
      }
    });

    return alertsList;
  }, [budgets, transactions, categories, hasCouple, isCouplePlan, viewMode]);

  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert, index) => (
        <Alert 
          key={index} 
          variant={alert.type === 'danger' ? 'destructive' : 'default'}
          className={alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20' : ''}
        >
          <div className="flex items-start gap-3">
            {alert.type === 'danger' ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <TrendingUp className="h-4 w-4 text-yellow-600" />
            )}
            <div className="flex-1">
              <AlertTitle className="flex items-center gap-2 text-sm">
                <Heart className="w-3 h-3" />
                Alerta do Casal - {alert.categoryName}
              </AlertTitle>
              <AlertDescription className="text-xs mt-1">
                {alert.type === 'danger' ? (
                  <>
                    Orçamento excedido! Gastos de {formatCurrency(alert.spent)} ultrapassaram 
                    o limite de {formatCurrency(alert.limit)} ({alert.percentage.toFixed(0)}%)
                  </>
                ) : (
                  <>
                    Atenção! {alert.percentage.toFixed(0)}% do orçamento já utilizado. 
                    Gastos: {formatCurrency(alert.spent)} de {formatCurrency(alert.limit)}
                  </>
                )}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );
}
