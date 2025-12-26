import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string().min(1, 'Valor é obrigatório'),
  description: z.string().min(1, 'Descrição é obrigatória').max(200),
  date: z.string().min(1, 'Data é obrigatória'),
  categoryId: z.string().optional(),
  creditCardId: z.string().optional(),
  bankAccountId: z.string().optional(),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.number().min(2).max(48).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  categories: { id: string; name: string }[];
  creditCards: { id: string; name: string }[];
  bankAccounts: { id: string; name: string }[];
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  categories,
  creditCards,
  bankAccounts,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [isInstallment, setIsInstallment] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      isInstallment: false,
    },
  });

  const handleFormSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, type, isInstallment });
      reset();
      setType('expense');
      setIsInstallment(false);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setType('expense');
    setIsInstallment(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Nova Transação</DialogTitle>
          <DialogDescription>
            Registre uma nova receita ou despesa
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Type Toggle */}
          <Tabs value={type} onValueChange={(v) => setType(v as 'income' | 'expense')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="expense" className="gap-2">
                <ArrowDownRight className="w-4 h-4" />
                Despesa
              </TabsTrigger>
              <TabsTrigger value="income" className="gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Receita
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0,00"
              {...register('amount')}
            />
            {errors.amount && (
              <p className="text-sm text-destructive">{errors.amount.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Ex: Almoço no restaurante"
              {...register('description')}
              rows={2}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Data</Label>
            <Input id="date" type="date" {...register('date')} />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Categoria</Label>
            <Select onValueChange={(v) => setValue('categoryId', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Credit Card or Bank Account */}
          {type === 'expense' && (
            <div className="space-y-2">
              <Label>Cartão de Crédito</Label>
              <Select onValueChange={(v) => setValue('creditCardId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um cartão (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id}>
                      {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Installment Toggle */}
          {type === 'expense' && (
            <div className="flex items-center justify-between">
              <Label htmlFor="installment">Parcelado?</Label>
              <Switch
                id="installment"
                checked={isInstallment}
                onCheckedChange={(checked) => {
                  setIsInstallment(checked);
                  setValue('isInstallment', checked);
                }}
              />
            </div>
          )}

          {/* Number of Installments */}
          {isInstallment && (
            <div className="space-y-2">
              <Label htmlFor="totalInstallments">Número de Parcelas</Label>
              <Input
                id="totalInstallments"
                type="number"
                min={2}
                max={48}
                placeholder="Ex: 12"
                onChange={(e) => setValue('totalInstallments', parseInt(e.target.value))}
              />
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
