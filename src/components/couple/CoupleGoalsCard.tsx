import { useState } from 'react';
import { useCouple } from '@/hooks/useCouple';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Target, Plus, Trash2, Loader2, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export function CoupleGoalsCard() {
  const { goals, createGoal, updateGoal, deleteGoal, hasCouple, isCouplePlan } = useCouple();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    current_amount: '',
    deadline: '',
  });

  if (!isCouplePlan || !hasCouple) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.target_amount) {
      toast({
        title: 'Erro',
        description: 'Preencha os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const result = await createGoal({
      name: formData.name,
      target_amount: parseFloat(formData.target_amount),
      current_amount: parseFloat(formData.current_amount) || 0,
      deadline: formData.deadline || null,
      icon: 'target',
      color: '#22c55e',
    });
    setLoading(false);

    if (result.success) {
      toast({ title: 'Meta criada!' });
      setShowForm(false);
      setFormData({ name: '', target_amount: '', current_amount: '', deadline: '' });
    } else {
      toast({ title: 'Erro', description: result.error, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteGoal(id);
    if (result.success) {
      toast({ title: 'Meta removida' });
    }
  };

  const handleAddProgress = async (goal: typeof goals[0], amount: number) => {
    const newAmount = goal.current_amount + amount;
    const result = await updateGoal(goal.id, { 
      current_amount: newAmount,
      is_completed: newAmount >= goal.target_amount,
    });
    if (result.success) {
      toast({ 
        title: newAmount >= goal.target_amount ? 'Meta alcançada! 🎉' : 'Progresso atualizado' 
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Heart className="w-4 h-4 text-primary" />
            Metas do Casal
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {goals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma meta definida ainda
            </p>
          ) : (
            goals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              return (
                <div key={goal.id} className="space-y-2 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-primary" />
                      <span className="font-medium text-sm">{goal.name}</span>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleDelete(goal.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {formatCurrency(goal.current_amount)} de {formatCurrency(goal.target_amount)}
                    </span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  {goal.deadline && (
                    <p className="text-xs text-muted-foreground">
                      Prazo: {format(new Date(goal.deadline), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                  )}
                  {!goal.is_completed && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleAddProgress(goal, 50)}
                      >
                        +R$50
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => handleAddProgress(goal, 100)}
                      >
                        +R$100
                      </Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Meta do Casal</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Meta</Label>
              <Input
                placeholder="Ex: Viagem de férias"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Alvo</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.target_amount}
                onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Valor Inicial (opcional)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={formData.current_amount}
                onChange={(e) => setFormData({ ...formData, current_amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Prazo (opcional)</Label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="flex gap-3">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
                Cancelar
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Criar Meta'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
