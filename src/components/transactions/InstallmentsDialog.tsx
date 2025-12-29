import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, CreditCard } from 'lucide-react';

interface Installment {
  id: string;
  description: string | null;
  amount: number;
  date: string;
  current_installment: number | null;
  total_installments: number | null;
}

interface InstallmentsDialogProps {
  open: boolean;
  onClose: () => void;
  installments: Installment[];
  loading?: boolean;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function InstallmentsDialog({ open, onClose, installments, loading }: InstallmentsDialogProps) {
  const totalAmount = installments.reduce((sum, i) => sum + Number(i.amount), 0);
  const today = new Date();

  // Sort installments by current_installment
  const sortedInstallments = [...installments].sort(
    (a, b) => (a.current_installment || 0) - (b.current_installment || 0)
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Parcelas da compra
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="text-sm text-muted-foreground">Total da compra</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Parcelas</p>
              <p className="text-lg font-bold text-foreground">{installments.length}x</p>
            </div>
          </div>

          {/* Installments List */}
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-2">
              {sortedInstallments.map((installment) => {
                const dueDate = new Date(installment.date);
                const isPast = dueDate < today;
                const isCurrentMonth = 
                  dueDate.getMonth() === today.getMonth() && 
                  dueDate.getFullYear() === today.getFullYear();

                return (
                  <div
                    key={installment.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isCurrentMonth 
                        ? 'border-primary/50 bg-primary/5' 
                        : isPast 
                          ? 'border-border bg-muted/30' 
                          : 'border-border bg-card'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {isPast ? (
                          <CheckCircle2 className="w-5 h-5 text-income" />
                        ) : (
                          <Clock className={`w-5 h-5 ${isCurrentMonth ? 'text-primary' : 'text-muted-foreground'}`} />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">
                              Parcela {installment.current_installment}/{installment.total_installments}
                            </span>
                            {isCurrentMonth && (
                              <Badge variant="outline" className="text-xs border-primary text-primary">
                                Atual
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Vence em {format(dueDate, "dd 'de' MMM, yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <span className={`font-semibold ${isPast ? 'text-muted-foreground' : 'text-expense'}`}>
                        {formatCurrency(installment.amount)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
