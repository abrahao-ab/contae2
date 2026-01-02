import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { Loader2, CreditCard, Wallet } from 'lucide-react';

interface CreditCardData {
  id: string;
  name: string;
  bank_name: string;
  current_balance: number;
  credit_limit: number;
}

interface BankAccount {
  id: string;
  name: string;
  bank_name: string | null;
}

interface PayInvoiceDialogProps {
  open: boolean;
  onClose: () => void;
  card: CreditCardData | null;
  onSuccess: () => void;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function PayInvoiceDialog({ open, onClose, card, onSuccess }: PayInvoiceDialogProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<'full' | 'partial'>('full');
  const [amount, setAmount] = useState('');
  const [bankAccountId, setBankAccountId] = useState<string>('');
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  useEffect(() => {
    if (open && user) {
      fetchBankAccounts();
      setPaymentType('full');
      setAmount('');
      setBankAccountId('');
    }
  }, [open, user]);

  const fetchBankAccounts = async () => {
    if (!user) return;
    setLoadingAccounts(true);
    try {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('id, name, bank_name')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setBankAccounts(data || []);
    } catch (error: any) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !card) return;

    const paymentAmount = paymentType === 'full' 
      ? card.current_balance 
      : parseFloat(amount);

    if (paymentType === 'partial' && (!paymentAmount || paymentAmount <= 0)) {
      toast({
        variant: 'destructive',
        title: 'Valor inválido',
        description: 'Informe um valor válido para o pagamento.',
      });
      return;
    }

    if (paymentAmount > card.current_balance) {
      toast({
        variant: 'destructive',
        title: 'Valor excede a fatura',
        description: `O valor máximo é ${formatCurrency(card.current_balance)}`,
      });
      return;
    }

    setLoading(true);
    try {
      const isFullPayment = paymentType === 'full' || paymentAmount >= card.current_balance;
      const today = new Date().toISOString().split('T')[0];

      // 1. Criar transação de despesa
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'expense',
          amount: paymentAmount,
          description: `Pagamento fatura ${card.name}${isFullPayment ? ' (Total)' : ' (Parcial)'}`,
          date: today,
          bank_account_id: bankAccountId || null,
          source: 'web',
          is_installment: false,
        })
        .select('id')
        .single();

      if (transactionError) throw transactionError;

      // 2. Registrar pagamento
      const { error: paymentError } = await supabase
        .from('card_payments')
        .insert({
          user_id: user.id,
          credit_card_id: card.id,
          bank_account_id: bankAccountId || null,
          amount: paymentAmount,
          payment_date: today,
          is_full_payment: isFullPayment,
          transaction_id: transaction.id,
        });

      if (paymentError) throw paymentError;

      // 3. Atualizar saldo do cartão
      const newBalance = Math.max(0, card.current_balance - paymentAmount);
      const { error: updateError } = await supabase
        .from('credit_cards')
        .update({ current_balance: newBalance })
        .eq('id', card.id);

      if (updateError) throw updateError;

      toast({
        title: isFullPayment ? 'Fatura quitada!' : 'Pagamento registrado!',
        description: isFullPayment
          ? `${formatCurrency(paymentAmount)} pagos. Limite restaurado!`
          : `${formatCurrency(paymentAmount)} pagos. Fatura restante: ${formatCurrency(newBalance)}`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Erro ao registrar pagamento',
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (!card) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Pagar Fatura
          </DialogTitle>
          <DialogDescription>
            {card.name} - Fatura atual: {formatCurrency(card.current_balance)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tipo de pagamento */}
          <div className="space-y-3">
            <Label>Tipo de pagamento</Label>
            <RadioGroup
              value={paymentType}
              onValueChange={(value) => setPaymentType(value as 'full' | 'partial')}
              className="grid grid-cols-2 gap-4"
            >
              <div>
                <RadioGroupItem
                  value="full"
                  id="full"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="full"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Total</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    {formatCurrency(card.current_balance)}
                  </span>
                </Label>
              </div>
              <div>
                <RadioGroupItem
                  value="partial"
                  id="partial"
                  className="peer sr-only"
                />
                <Label
                  htmlFor="partial"
                  className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                >
                  <span className="text-sm font-medium">Parcial</span>
                  <span className="text-xs text-muted-foreground mt-1">
                    Valor específico
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Valor parcial */}
          {paymentType === 'partial' && (
            <div className="space-y-2">
              <Label htmlFor="amount">Valor do pagamento</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                max={card.current_balance}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                required
              />
            </div>
          )}

          {/* Conta bancária */}
          <div className="space-y-2">
            <Label htmlFor="bank_account">Conta de origem (opcional)</Label>
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Carregando contas...</span>
              </div>
            ) : (
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma conta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      <div className="flex items-center gap-2">
                        <Wallet className="w-4 h-4" />
                        {account.name}
                        {account.bank_name && (
                          <span className="text-muted-foreground">
                            ({account.bank_name})
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirmar Pagamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}