import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useCouple } from '@/hooks/useCouple';
import { usePlanLimits } from '@/hooks/usePlanLimits';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Heart, 
  Users, 
  Palette, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2,
  AlertTriangle,
  Wallet,
  Target
} from 'lucide-react';

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

const avatarColors = [
  { value: '#22c55e', label: 'Verde' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#ef4444', label: 'Vermelho' },
  { value: '#f59e0b', label: 'Laranja' },
  { value: '#8b5cf6', label: 'Roxo' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#06b6d4', label: 'Ciano' },
  { value: '#64748b', label: 'Cinza' },
];

export default function CoupleSettings() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isCouple } = usePlanLimits();
  const { 
    couple, 
    currentMember, 
    partner, 
    budgets, 
    hasCouple,
    updateMemberProfile, 
    createBudget, 
    updateBudget,
    deleteBudget,
    leaveCouple,
    loading 
  } = useCouple();

  const [nickname, setNickname] = useState('');
  const [avatarColor, setAvatarColor] = useState('#22c55e');
  const [savingProfile, setSavingProfile] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<string | null>(null);
  const [budgetCategory, setBudgetCategory] = useState<string>('');
  const [budgetLimit, setBudgetLimit] = useState('');
  const [budgetThreshold, setBudgetThreshold] = useState('80');
  const [savingBudget, setSavingBudget] = useState(false);

  useEffect(() => {
    if (currentMember) {
      setNickname(currentMember.nickname || '');
      setAvatarColor(currentMember.avatar_color || '#22c55e');
    }
  }, [currentMember]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase
        .from('categories')
        .select('id, name, icon, color')
        .order('name');
      
      if (data) {
        setCategories(data);
      }
    };

    fetchCategories();
  }, []);

  // Redirect if not on couple plan
  useEffect(() => {
    if (!loading && !isCouple()) {
      navigate('/settings');
      toast({
        title: 'Acesso restrito',
        description: 'Esta página é exclusiva do plano Conta Casal.',
        variant: 'destructive',
      });
    }
  }, [loading, isCouple, navigate, toast]);

  const handleSaveProfile = async () => {
    if (!nickname.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'Por favor, insira um apelido.',
        variant: 'destructive',
      });
      return;
    }

    setSavingProfile(true);
    const result = await updateMemberProfile(nickname.trim(), avatarColor);
    setSavingProfile(false);

    if (result.success) {
      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram salvas com sucesso.',
      });
    } else {
      toast({
        title: 'Erro ao salvar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleSaveBudget = async () => {
    const limit = parseFloat(budgetLimit);
    const threshold = parseInt(budgetThreshold);

    if (isNaN(limit) || limit <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Por favor, insira um limite válido.',
        variant: 'destructive',
      });
      return;
    }

    setSavingBudget(true);

    let result;
    if (editingBudget) {
      result = await updateBudget(editingBudget, {
        category_id: budgetCategory || null,
        monthly_limit: limit,
        alert_threshold: threshold,
      });
    } else {
      result = await createBudget(budgetCategory || null, limit, threshold);
    }

    setSavingBudget(false);

    if (result.success) {
      toast({
        title: editingBudget ? 'Orçamento atualizado' : 'Orçamento criado',
        description: 'As configurações foram salvas.',
      });
      resetBudgetForm();
    } else {
      toast({
        title: 'Erro ao salvar',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const result = await deleteBudget(id);
    if (result.success) {
      toast({
        title: 'Orçamento excluído',
        description: 'O orçamento foi removido.',
      });
    }
  };

  const handleLeaveCouple = async () => {
    const result = await leaveCouple();
    if (result.success) {
      toast({
        title: 'Você saiu do casal',
        description: 'Sua conta foi desvinculada.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Erro ao sair',
        description: result.error,
        variant: 'destructive',
      });
    }
  };

  const resetBudgetForm = () => {
    setBudgetDialogOpen(false);
    setEditingBudget(null);
    setBudgetCategory('');
    setBudgetLimit('');
    setBudgetThreshold('80');
  };

  const openEditBudget = (budget: typeof budgets[0]) => {
    setEditingBudget(budget.id);
    setBudgetCategory(budget.category_id || '');
    setBudgetLimit(budget.monthly_limit.toString());
    setBudgetThreshold(budget.alert_threshold.toString());
    setBudgetDialogOpen(true);
  };

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Orçamento Geral';
    const category = categories.find(c => c.id === categoryId);
    return category?.name || 'Categoria';
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!hasCouple) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Heart className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle>Nenhum casal configurado</CardTitle>
              <CardDescription>
                Você ainda não está vinculado a um casal. Configure seu casal nas configurações gerais.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Button onClick={() => navigate('/settings')}>
                Ir para Configurações
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-pink-500/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-pink-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações do Casal</h1>
            <p className="text-muted-foreground">Gerencie seu perfil e orçamentos compartilhados</p>
          </div>
        </div>

        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Meu Perfil no Casal
            </CardTitle>
            <CardDescription>
              Personalize como você aparece para seu parceiro(a)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold"
                style={{ backgroundColor: avatarColor }}
              >
                {nickname ? nickname.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido</Label>
                  <Input
                    id="nickname"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Como você quer ser chamado(a)?"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cor do Avatar</Label>
                  <div className="flex flex-wrap gap-2">
                    {avatarColors.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setAvatarColor(color.value)}
                        className={`w-8 h-8 rounded-full transition-transform ${
                          avatarColor === color.value ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: color.value }}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={handleSaveProfile} disabled={savingProfile}>
              {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </CardContent>
        </Card>

        {/* Partner Info */}
        {partner && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Parceiro(a)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div 
                  className="w-14 h-14 rounded-full flex items-center justify-center text-white text-xl font-bold"
                  style={{ backgroundColor: partner.avatar_color || '#3b82f6' }}
                >
                  {partner.nickname ? partner.nickname.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {partner.nickname || 'Parceiro(a)'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Membro desde {new Date(partner.joined_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                {partner.is_owner && (
                  <Badge variant="secondary" className="ml-auto">Proprietário</Badge>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Budgets Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Orçamentos do Casal
                </CardTitle>
                <CardDescription>
                  Defina limites de gastos por categoria
                </CardDescription>
              </div>
              <Dialog open={budgetDialogOpen} onOpenChange={(open) => {
                if (!open) resetBudgetForm();
                setBudgetDialogOpen(open);
              }}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Novo Orçamento
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
                    </DialogTitle>
                    <DialogDescription>
                      Configure um limite de gastos para o casal
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Categoria</Label>
                      <Select value={budgetCategory} onValueChange={setBudgetCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma categoria (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Orçamento Geral</SelectItem>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.id}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Limite Mensal (R$)</Label>
                      <Input
                        type="number"
                        value={budgetLimit}
                        onChange={(e) => setBudgetLimit(e.target.value)}
                        placeholder="Ex: 1500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Alerta quando atingir (%)</Label>
                      <Select value={budgetThreshold} onValueChange={setBudgetThreshold}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="50">50%</SelectItem>
                          <SelectItem value="70">70%</SelectItem>
                          <SelectItem value="80">80%</SelectItem>
                          <SelectItem value="90">90%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={resetBudgetForm}>
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveBudget} disabled={savingBudget}>
                      {savingBudget ? 'Salvando...' : 'Salvar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {budgets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum orçamento configurado</p>
                <p className="text-sm">Crie orçamentos para controlar os gastos do casal</p>
              </div>
            ) : (
              <div className="space-y-3">
                {budgets.map((budget) => (
                  <div 
                    key={budget.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-muted/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {getCategoryName(budget.category_id)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Limite: R$ {budget.monthly_limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        {' • '}Alerta: {budget.alert_threshold}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditBudget(budget)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteBudget(budget.id)}>
                              Excluir
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Zona de Perigo
            </CardTitle>
            <CardDescription>
              Ações irreversíveis relacionadas ao casal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <LogOut className="w-4 h-4 mr-2" />
                  Sair do Casal
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ao sair do casal, você perderá acesso aos dados compartilhados.
                    {currentMember?.is_owner && (
                      <span className="block mt-2 font-medium text-destructive">
                        Como proprietário, sair irá excluir o casal completamente.
                      </span>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleLeaveCouple} className="bg-destructive hover:bg-destructive/90">
                    Sair do Casal
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
