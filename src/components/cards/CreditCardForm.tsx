import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2 } from 'lucide-react';

const creditCardSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Máximo 50 caracteres'),
  bankName: z.string().trim().min(1, 'Banco é obrigatório').max(50, 'Máximo 50 caracteres'),
  lastFourDigits: z.string().max(4, 'Máximo 4 dígitos').optional(),
  creditLimit: z.string().min(1, 'Limite é obrigatório'),
  closingDay: z.string().min(1, 'Dia de fechamento é obrigatório'),
  dueDay: z.string().min(1, 'Dia de vencimento é obrigatório'),
  color: z.string(),
});

type CreditCardFormData = z.infer<typeof creditCardSchema>;

interface CreditCard {
  id: string;
  name: string;
  bank_name: string;
  last_four_digits: string | null;
  credit_limit: number;
  closing_day: number | null;
  due_day: number | null;
  color: string | null;
}

interface CreditCardFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreditCardFormData) => Promise<void>;
  card?: CreditCard | null;
}

const colorOptions = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e',
  '#64748b', '#ef4444', '#06b6d4', '#f59e0b', '#10b981',
];

const bankOptions = [
  'Nubank', 'Inter', 'Itaú', 'Bradesco', 'Santander',
  'Banco do Brasil', 'Caixa', 'C6 Bank', 'XP', 'BTG Pactual',
];

export function CreditCardForm({ open, onClose, onSubmit, card }: CreditCardFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!card;

  const form = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      name: '',
      bankName: '',
      lastFourDigits: '',
      creditLimit: '',
      closingDay: '',
      dueDay: '',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (card) {
      form.reset({
        name: card.name,
        bankName: card.bank_name,
        lastFourDigits: card.last_four_digits || '',
        creditLimit: card.credit_limit.toString(),
        closingDay: card.closing_day?.toString() || '',
        dueDay: card.due_day?.toString() || '',
        color: card.color || '#3b82f6',
      });
    } else {
      form.reset({
        name: '',
        bankName: '',
        lastFourDigits: '',
        creditLimit: '',
        closingDay: '',
        dueDay: '',
        color: '#3b82f6',
      });
    }
  }, [card, form, open]);

  const handleFormSubmit = async (data: CreditCardFormData) => {
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
            {isEditing ? 'Editar Cartão' : 'Novo Cartão de Crédito'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome do Cartão</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Nubank Principal"
                      className="bg-background border-input text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bankName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Banco</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {bankOptions.slice(0, 5).map((bank) => (
                          <button
                            key={bank}
                            type="button"
                            onClick={() => field.onChange(bank)}
                            className={`px-3 py-1.5 rounded-lg text-xs transition-all ${
                              field.value === bank
                                ? 'bg-primary text-white'
                                : 'bg-muted text-muted-foreground hover:bg-muted/80'
                            }`}
                          >
                            {bank}
                          </button>
                        ))}
                      </div>
                      <Input
                        placeholder="Ou digite o nome do banco"
                        className="bg-background border-input text-foreground"
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastFourDigits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Últimos 4 dígitos (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="1234"
                      maxLength={4}
                      className="bg-background border-input text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="creditLimit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Limite de Crédito</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="5000.00"
                      className="bg-background border-input text-foreground"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="closingDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Dia Fechamento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="15"
                        className="bg-background border-input text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dueDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-foreground">Dia Vencimento</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={31}
                        placeholder="25"
                        className="bg-background border-input text-foreground"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Cor do Cartão</FormLabel>
                  <FormControl>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => field.onChange(color)}
                          className={`w-8 h-8 rounded-full transition-all ${
                            field.value === color
                              ? 'ring-2 ring-offset-2 ring-offset-background ring-foreground scale-110'
                              : 'hover:scale-105'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

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
