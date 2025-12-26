import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

const creditCardSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(50),
  bankName: z.string().min(1, 'Banco é obrigatório').max(50),
  lastFourDigits: z.string().max(4).optional(),
  creditLimit: z.string().min(1, 'Limite é obrigatório'),
  closingDay: z.string().min(1, 'Dia de fechamento é obrigatório'),
  dueDay: z.string().min(1, 'Dia de vencimento é obrigatório'),
  color: z.string().optional(),
});

type CreditCardFormData = z.infer<typeof creditCardSchema>;

interface CreditCardFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreditCardFormData) => Promise<void>;
}

const colorOptions = [
  { value: '#3b82f6', label: 'Azul' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Laranja' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#64748b', label: 'Cinza' },
];

export function CreditCardForm({ open, onClose, onSubmit }: CreditCardFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0].value);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreditCardFormData>({
    resolver: zodResolver(creditCardSchema),
    defaultValues: {
      color: colorOptions[0].value,
    },
  });

  const handleFormSubmit = async (data: CreditCardFormData) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, color: selectedColor });
      reset();
      setSelectedColor(colorOptions[0].value);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedColor(colorOptions[0].value);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cartão de Crédito</DialogTitle>
          <DialogDescription>
            Adicione um novo cartão para controlar seus gastos
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Cartão</Label>
            <Input
              id="name"
              placeholder="Ex: Nubank Principal"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Banco</Label>
            <Input
              id="bankName"
              placeholder="Ex: Nubank"
              {...register('bankName')}
            />
            {errors.bankName && (
              <p className="text-sm text-destructive">{errors.bankName.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastFourDigits">Últimos 4 dígitos (opcional)</Label>
            <Input
              id="lastFourDigits"
              placeholder="1234"
              maxLength={4}
              {...register('lastFourDigits')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="creditLimit">Limite de Crédito</Label>
            <Input
              id="creditLimit"
              type="number"
              step="0.01"
              placeholder="5000,00"
              {...register('creditLimit')}
            />
            {errors.creditLimit && (
              <p className="text-sm text-destructive">{errors.creditLimit.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closingDay">Dia do Fechamento</Label>
              <Input
                id="closingDay"
                type="number"
                min={1}
                max={31}
                placeholder="15"
                {...register('closingDay')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueDay">Dia do Vencimento</Label>
              <Input
                id="dueDay"
                type="number"
                min={1}
                max={31}
                placeholder="25"
                {...register('dueDay')}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor do Cartão</Label>
            <div className="flex gap-2">
              {colorOptions.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => setSelectedColor(color.value)}
                  className={`w-8 h-8 rounded-full transition-transform ${
                    selectedColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : ''
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
          </div>

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
