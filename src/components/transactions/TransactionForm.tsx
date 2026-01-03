import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Loader2, ArrowUpRight, ArrowDownRight, CalendarIcon, User, Users, Heart } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useCouple } from '@/hooks/useCouple';

const transactionSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.string()
    .min(1, 'Valor é obrigatório')
    .refine(
      (val) => {
        const num = parseFloat(val);
        return !isNaN(num) && num >= 0.01 && num <= 999999999.99;
      },
      'Valor deve estar entre R$ 0,01 e R$ 999.999.999,99'
    ),
  description: z.string().trim().min(1, 'Descrição é obrigatória').max(200, 'Máximo 200 caracteres'),
  date: z.date({ required_error: 'Data é obrigatória' }),
  categoryId: z.string().optional(),
  creditCardId: z.string().optional(),
  bankAccountId: z.string().optional(),
  isInstallment: z.boolean().default(false),
  totalInstallments: z.number().min(2).max(48).optional(),
  ownerType: z.enum(['individual', 'partner', 'shared']).optional(),
});

type TransactionFormData = z.infer<typeof transactionSchema>;

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string | null;
  date: string;
  category_id: string | null;
  credit_card_id: string | null;
  bank_account_id: string | null;
  is_installment: boolean | null;
  total_installments: number | null;
  owner_type?: string;
}

interface TransactionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TransactionFormData) => Promise<void>;
  categories: { id: string; name: string }[];
  creditCards: { id: string; name: string }[];
  bankAccounts: { id: string; name: string }[];
  transaction?: Transaction | null;
}

export function TransactionForm({
  open,
  onClose,
  onSubmit,
  categories,
  creditCards,
  bankAccounts,
  transaction,
}: TransactionFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!transaction;
  const { isCouplePlan, hasCouple, currentMember, partner } = useCouple();

  // Show owner field only for couple plan users with an active couple
  const showOwnerField = isCouplePlan && hasCouple && partner;

  const form = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      type: 'expense',
      amount: '',
      description: '',
      date: new Date(),
      isInstallment: false,
      ownerType: 'individual',
    },
  });

  const type = form.watch('type');
  const isInstallment = form.watch('isInstallment');

  useEffect(() => {
    if (transaction) {
      form.reset({
        type: transaction.type,
        amount: transaction.amount.toString(),
        description: transaction.description || '',
        date: new Date(transaction.date),
        categoryId: transaction.category_id || undefined,
        creditCardId: transaction.credit_card_id || undefined,
        bankAccountId: transaction.bank_account_id || undefined,
        isInstallment: transaction.is_installment || false,
        totalInstallments: transaction.total_installments || undefined,
        ownerType: (transaction.owner_type as 'individual' | 'partner' | 'shared') || 'individual',
      });
    } else {
      form.reset({
        type: 'expense',
        amount: '',
        description: '',
        date: new Date(),
        isInstallment: false,
        ownerType: 'individual',
      });
    }
  }, [transaction, form, open]);

  const handleFormSubmit = async (data: TransactionFormData) => {
    setLoading(true);
    try {
      await onSubmit(data);
      form.reset();
      onClose();
    } catch (error) {
      // Error handled by parent
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {isEditing ? 'Editar Transação' : 'Nova Transação'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            {/* Type Toggle */}
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Tabs value={field.value} onValueChange={field.onChange}>
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
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Amount */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Valor</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="0,00"
                      className="bg-background border-input text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Ex: Almoço no restaurante"
                      className="bg-background border-input text-foreground resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Date */}
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="text-foreground">Data</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'dd/MM/yyyy', { locale: ptBR })
                          ) : (
                            <span>Selecione uma data</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        locale={ptBR}
                        initialFocus
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Category */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Categoria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione uma categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Owner Type (only for couple plan users) */}
            {showOwnerField && (
              <FormField
                control={form.control}
                name="ownerType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground flex items-center gap-2">
                      <Heart className="w-4 h-4 text-primary" />
                      Responsável
                    </FormLabel>
                    <Select value={field.value || 'individual'} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Quem é responsável?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="individual">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{currentMember?.nickname || 'Eu'}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="partner">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4" />
                            <span>{partner?.nickname || 'Parceiro(a)'}</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="shared">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>Ambos (Compartilhado)</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Bank Account */}
            <FormField
              control={form.control}
              name="bankAccountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Conta Bancária</FormLabel>
                  <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || undefined)}>
                    <FormControl>
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder="Selecione uma conta (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {bankAccounts.map((acc) => (
                        <SelectItem key={acc.id} value={acc.id}>
                          {acc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Credit Card (only for expenses) */}
            {type === 'expense' && (
              <FormField
                control={form.control}
                name="creditCardId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Cartão de Crédito</FormLabel>
                    <Select value={field.value || ''} onValueChange={(v) => field.onChange(v || undefined)}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Selecione um cartão (opcional)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>
                            {card.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Installment Toggle (only for expenses) */}
            {type === 'expense' && !isEditing && (
              <FormField
                control={form.control}
                name="isInstallment"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border border-border p-3">
                    <FormLabel className="text-foreground cursor-pointer">Parcelado?</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            )}

            {/* Number of Installments */}
            {isInstallment && type === 'expense' && !isEditing && (
              <FormField
                control={form.control}
                name="totalInstallments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Número de Parcelas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2}
                        max={48}
                        placeholder="Ex: 12"
                        className="bg-background border-input text-foreground"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="flex-1"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-primary text-white" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : isEditing ? (
                  'Salvar'
                ) : (
                  'Criar'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
