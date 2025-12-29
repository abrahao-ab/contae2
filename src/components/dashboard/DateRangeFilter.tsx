import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
}

const presets = [
  {
    label: 'Este mês',
    getValue: () => ({
      from: startOfMonth(new Date()),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Mês passado',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
    }),
  },
  {
    label: 'Últimos 3 meses',
    getValue: () => ({
      from: startOfMonth(subMonths(new Date(), 2)),
      to: endOfMonth(new Date()),
    }),
  },
  {
    label: 'Este ano',
    getValue: () => ({
      from: startOfYear(new Date()),
      to: endOfYear(new Date()),
    }),
  },
];

export function DateRangeFilter({ dateRange, onDateRangeChange }: DateRangeFilterProps) {
  const handlePreset = (preset: typeof presets[0]) => {
    onDateRangeChange(preset.getValue());
  };

  const handlePrevMonth = () => {
    if (dateRange?.from) {
      const newFrom = startOfMonth(subMonths(dateRange.from, 1));
      const newTo = endOfMonth(newFrom);
      onDateRangeChange({ from: newFrom, to: newTo });
    }
  };

  const handleNextMonth = () => {
    if (dateRange?.from) {
      const newFrom = startOfMonth(subMonths(dateRange.from, -1));
      const newTo = endOfMonth(newFrom);
      onDateRangeChange({ from: newFrom, to: newTo });
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      {/* Quick presets */}
      <div className="flex items-center gap-2 bg-muted p-1 rounded-lg overflow-x-auto">
        {presets.map((preset) => (
          <Button
            key={preset.label}
            variant="ghost"
            size="sm"
            onClick={() => handlePreset(preset)}
            className={cn(
              'h-8 px-3 transition-all whitespace-nowrap',
              dateRange?.from &&
                format(dateRange.from, 'yyyy-MM-dd') === format(preset.getValue().from, 'yyyy-MM-dd') &&
                dateRange?.to &&
                format(dateRange.to, 'yyyy-MM-dd') === format(preset.getValue().to, 'yyyy-MM-dd')
                ? 'bg-primary text-white hover:bg-primary/90 hover:text-white'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
            )}
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Date navigation and picker */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'justify-start text-left font-normal min-w-[220px]',
                !dateRange && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, 'dd/MM/yy', { locale: ptBR })} -{' '}
                    {format(dateRange.to, 'dd/MM/yy', { locale: ptBR })}
                  </>
                ) : (
                  format(dateRange.from, 'dd/MM/yyyy', { locale: ptBR })
                )
              ) : (
                <span>Selecionar período</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={onDateRangeChange}
              numberOfMonths={2}
              locale={ptBR}
              className="pointer-events-auto"
            />
          </PopoverContent>
        </Popover>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleNextMonth}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
