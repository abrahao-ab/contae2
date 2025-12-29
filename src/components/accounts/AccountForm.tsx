import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const accountSchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  bank_name: z.string().trim().max(50, 'Nome do banco deve ter no máximo 50 caracteres').optional(),
  icon: z.string().trim().min(1, 'Ícone é obrigatório').max(30, 'Ícone inválido'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface Account {
  id: string;
  name: string;
  bank_name: string | null;
  icon: string | null;
  color: string | null;
}

interface AccountFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AccountFormData) => Promise<void>;
  account?: Account | null;
}

const iconOptions = [
  { value: 'building-2', label: '🏦 Banco' },
  { value: 'wallet', label: '💰 Carteira' },
  { value: 'piggy-bank', label: '🐷 Poupança' },
  { value: 'landmark', label: '🏛️ Instituição' },
  { value: 'credit-card', label: '💳 Conta Digital' },
  { value: 'banknote', label: '💵 Dinheiro' },
  { value: 'coins', label: '🪙 Moedas' },
  { value: 'briefcase', label: '💼 Empresarial' },
  { value: 'home', label: '🏠 Casa' },
  { value: 'trending-up', label: '📈 Investimento' },
  { value: 'shield', label: '🛡️ Reserva' },
  { value: 'star', label: '⭐ Favorita' },
];

const colorOptions = [
  '#3b82f6', '#22c55e', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#64748b', '#10b981', '#6366f1',
  '#f97316', '#84cc16', '#14b8a6', '#a855f7', '#f43f5e',
];

const bankOptions = [
  'Nubank',
  'Inter',
  'Itaú',
  'Bradesco',
  'Santander',
  'Banco do Brasil',
  'Caixa',
  'C6 Bank',
  'PicPay',
  'Mercado Pago',
  'PagBank',
  'Next',
  'Neon',
  'Original',
  'BTG Pactual',
  'Outro',
];

export function AccountForm({ open, onClose, onSubmit, account }: AccountFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!account;

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      bank_name: '',
      icon: 'building-2',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        bank_name: account.bank_name || '',
        icon: account.icon || 'building-2',
        color: account.color || '#3b82f6',
      });
    } else {
      form.reset({
        name: '',
        bank_name: '',
        icon: 'building-2',
        color: '#3b82f6',
      });
    }
  }, [account, form, open]);

  const handleSubmit = async (data: AccountFormData) => {
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

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card border-border sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {isEditing ? 'Editar Conta' : 'Nova Conta Bancária'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome da Conta</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Conta Corrente Nubank"
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
              name="bank_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Banco (opcional)</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-4 gap-2">
                      {bankOptions.slice(0, 8).map((bank) => (
                        <button
                          key={bank}
                          type="button"
                          onClick={() => field.onChange(bank)}
                          className={`p-2 rounded-lg text-xs transition-all ${
                            field.value === bank
                              ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {bank}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <Input
                    placeholder="Ou digite o nome do banco"
                    className="bg-background border-input text-foreground mt-2"
                    {...field}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Ícone</FormLabel>
                  <FormControl>
                    <div className="grid grid-cols-4 gap-2">
                      {iconOptions.map((icon) => (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() => field.onChange(icon.value)}
                          className={`p-2 rounded-lg text-sm transition-all ${
                            field.value === icon.value
                              ? 'bg-primary text-white ring-2 ring-primary ring-offset-2 ring-offset-background'
                              : 'bg-muted text-muted-foreground hover:bg-muted/80'
                          }`}
                        >
                          {icon.label.split(' ')[0]}
                        </button>
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Cor</FormLabel>
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
                onClick={onClose}
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
