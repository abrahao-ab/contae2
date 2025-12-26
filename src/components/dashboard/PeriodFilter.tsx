import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Period = 'day' | 'week' | 'month' | 'year';

interface PeriodFilterProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  currentDate: Date;
  onDateChange: (date: Date) => void;
}

const periods: { value: Period; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
  { value: 'year', label: 'Ano' },
];

export function PeriodFilter({ selectedPeriod, onPeriodChange, currentDate, onDateChange }: PeriodFilterProps) {
  const handlePrevious = () => {
    if (selectedPeriod === 'month') {
      onDateChange(subMonths(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (selectedPeriod === 'month') {
      onDateChange(addMonths(currentDate, 1));
    }
  };

  const getDateLabel = () => {
    if (selectedPeriod === 'month') {
      return format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });
    }
    return format(currentDate, 'dd/MM/yyyy');
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
        {periods.map((period) => (
          <Button
            key={period.value}
            variant="ghost"
            size="sm"
            onClick={() => onPeriodChange(period.value)}
            className={cn(
              'h-8 px-3 transition-all',
              selectedPeriod === period.value
                ? 'bg-primary text-white hover:bg-primary/90 hover:text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {period.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handlePrevious}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-lg min-w-[180px] justify-center">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-foreground capitalize">{getDateLabel()}</span>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={handleNext}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
