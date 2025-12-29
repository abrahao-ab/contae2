import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  color: string | null;
}

interface CategoryChartProps {
  transactions: Transaction[];
  categories: Category[];
  type: 'income' | 'expense';
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
        <p className="text-sm font-medium text-foreground">{data.name}</p>
        <p className="text-sm text-muted-foreground">
          {formatCurrency(data.value)} ({data.percentage.toFixed(1)}%)
        </p>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#64748b', '#10b981', '#6366f1',
];

export function CategoryChart({ transactions, categories, type }: CategoryChartProps) {
  const chartData = useMemo(() => {
    const filtered = transactions.filter((t) => t.type === type);
    const total = filtered.reduce((sum, t) => sum + t.amount, 0);

    // Group by category
    const grouped: Record<string, { amount: number; name: string; color: string }> = {};

    filtered.forEach((t) => {
      const category = categories.find((c) => c.id === t.category_id);
      const key = t.category_id || 'uncategorized';
      const name = category?.name || 'Sem categoria';
      const color = category?.color || '#94a3b8';

      if (!grouped[key]) {
        grouped[key] = { amount: 0, name, color };
      }
      grouped[key].amount += t.amount;
    });

    return Object.values(grouped)
      .map((item, index) => ({
        name: item.name,
        value: item.amount,
        color: item.color || COLORS[index % COLORS.length],
        percentage: (item.amount / total) * 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, categories, type]);

  const title = type === 'income' ? 'Receitas por Categoria' : 'Despesas por Categoria';

  if (chartData.length === 0) {
    return (
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[250px] text-muted-foreground">
            Nenhuma {type === 'income' ? 'receita' : 'despesa'} no período
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="right"
              verticalAlign="middle"
              formatter={(value) => (
                <span className="text-foreground text-sm">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
