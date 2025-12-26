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

const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nome é obrigatório').max(50, 'Nome deve ter no máximo 50 caracteres'),
  icon: z.string().trim().min(1, 'Ícone é obrigatório').max(30, 'Ícone inválido'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida'),
});

type CategoryFormData = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_default: boolean | null;
}

interface CategoryFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  category?: Category | null;
}

const iconOptions = [
  { value: 'utensils', label: '🍴 Alimentação' },
  { value: 'car', label: '🚗 Transporte' },
  { value: 'home', label: '🏠 Moradia' },
  { value: 'gamepad-2', label: '🎮 Lazer' },
  { value: 'heart-pulse', label: '❤️ Saúde' },
  { value: 'graduation-cap', label: '🎓 Educação' },
  { value: 'shopping-bag', label: '🛍️ Compras' },
  { value: 'wrench', label: '🔧 Serviços' },
  { value: 'wallet', label: '💰 Salário' },
  { value: 'trending-up', label: '📈 Investimentos' },
  { value: 'gift', label: '🎁 Presentes' },
  { value: 'plane', label: '✈️ Viagens' },
  { value: 'smartphone', label: '📱 Tecnologia' },
  { value: 'shirt', label: '👕 Vestuário' },
  { value: 'paw-print', label: '🐾 Pets' },
  { value: 'circle-dot', label: '⚪ Outros' },
];

const colorOptions = [
  '#22c55e', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#64748b', '#10b981', '#6366f1',
  '#f97316', '#84cc16', '#14b8a6', '#a855f7', '#f43f5e',
];

export function CategoryForm({ open, onClose, onSubmit, category }: CategoryFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!category;

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      icon: 'circle-dot',
      color: '#3b82f6',
    },
  });

  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        icon: category.icon || 'circle-dot',
        color: category.color || '#3b82f6',
      });
    } else {
      form.reset({
        name: '',
        icon: 'circle-dot',
        color: '#3b82f6',
      });
    }
  }, [category, form, open]);

  const handleSubmit = async (data: CategoryFormData) => {
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
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-card-foreground">
            {isEditing ? 'Editar Categoria' : 'Nova Categoria'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground">Nome</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Alimentação"
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
