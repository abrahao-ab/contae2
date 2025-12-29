import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Users, Heart } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  owner_type?: string;
}

interface CoupleSpendingChartProps {
  transactions: Transaction[];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
        <p className="font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">{formatCurrency(data.value)}</p>
        <p className="text-xs text-muted-foreground">{data.percentage}%</p>
      </div>
    );
  }
  return null;
};

export function CoupleSpendingChart({ transactions }: CoupleSpendingChartProps) {
  const chartData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === 'expense');
    
    const individual = expenses
      .filter((t) => t.owner_type === 'individual' || !t.owner_type)
      .reduce((sum, t) => sum + Number(t.amount), 0);
    
    const shared = expenses
      .filter((t) => t.owner_type === 'shared')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const total = individual + shared;

    if (total === 0) return [];

    return [
      {
        name: 'Individual',
        value: individual,
        percentage: ((individual / total) * 100).toFixed(1),
        color: 'hsl(var(--primary))',
        icon: Users,
      },
      {
        name: 'Compartilhado',
        value: shared,
        percentage: ((shared / total) * 100).toFixed(1),
        color: 'hsl(var(--chart-2))',
        icon: Heart,
      },
    ];
  }, [transactions]);

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  if (chartData.length === 0 || total === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Gastos: Individual vs Compartilhado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
            Nenhuma despesa encontrada no período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Heart className="w-4 h-4 text-primary" />
          Gastos: Individual vs Compartilhado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={70}
                paddingAngle={4}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex justify-center gap-6 mt-4">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-sm">
                <span className="text-muted-foreground">{item.name}:</span>{' '}
                <span className="font-medium text-foreground">{formatCurrency(item.value)}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="text-center mt-3 pt-3 border-t border-border">
          <span className="text-sm text-muted-foreground">Total de despesas: </span>
          <span className="font-semibold text-foreground">{formatCurrency(total)}</span>
        </div>
      </CardContent>
    </Card>
  );
}
