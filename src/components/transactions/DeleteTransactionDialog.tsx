import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

interface Transaction {
  id: string;
  description: string | null;
  is_installment?: boolean | null;
  current_installment?: number | null;
  total_installments?: number | null;
  parent_transaction_id?: string | null;
}

interface DeleteTransactionDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (deleteAll: boolean) => Promise<void>;
  transaction: Transaction | null;
}

export function DeleteTransactionDialog({ open, onClose, onConfirm, transaction }: DeleteTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'single' | 'all'>('all');

  const isInstallment = transaction?.is_installment && transaction?.parent_transaction_id;

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm(deleteOption === 'all');
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      onClose();
      setDeleteOption('all');
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="bg-card border-border">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-card-foreground">Excluir transação</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            Tem certeza que deseja excluir a transação <strong>"{transaction?.description || 'Sem descrição'}"</strong>?
            <br />
            <br />
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isInstallment && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-3">
              Esta é a parcela {transaction?.current_installment} de {transaction?.total_installments}. O que deseja fazer?
            </p>
            <RadioGroup
              value={deleteOption}
              onValueChange={(value) => setDeleteOption(value as 'single' | 'all')}
              className="space-y-3"
            >
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single" className="flex-1 cursor-pointer">
                  <span className="font-medium text-foreground">Excluir apenas esta parcela</span>
                  <p className="text-sm text-muted-foreground">As outras parcelas serão mantidas</p>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 rounded-lg border border-expense/30 bg-expense/5 hover:bg-expense/10 transition-colors">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="flex-1 cursor-pointer">
                  <span className="font-medium text-foreground">Excluir todas as {transaction?.total_installments} parcelas</span>
                  <p className="text-sm text-muted-foreground">O saldo do cartão será restaurado</p>
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading} className="border-border text-foreground">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={loading}
            className="bg-expense text-white hover:bg-expense/90"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              isInstallment && deleteOption === 'all' 
                ? `Excluir ${transaction?.total_installments} parcelas`
                : 'Excluir'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
