import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, Crown, Users, Zap, ArrowLeft } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AccountType = Database['public']['Enums']['account_type'];

interface Plan {
  id: AccountType;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  icon: React.ReactNode;
  features: string[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Para começar a organizar suas finanças',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    icon: <Zap className="w-6 h-6" />,
    features: [
      'Controle de gastos básico',
      '1 número WhatsApp',
      'Categorias padrão',
      'Relatórios simples',
    ],
  },
  {
    id: 'paid',
    name: 'Premium',
    description: 'Para quem quer o controle completo',
    monthlyPrice: 19.90,
    yearlyPrice: 19.90 * 12 * 0.9, // 10% desconto
    yearlyDiscount: 10,
    icon: <Crown className="w-6 h-6" />,
    popular: true,
    features: [
      'Tudo do plano Gratuito',
      'IA para classificação automática',
      'Análise comportamental',
      'Projeções financeiras',
      'Alertas inteligentes',
      'Suporte prioritário',
    ],
  },
  {
    id: 'couple',
    name: 'Casal',
    description: 'Finanças compartilhadas a dois',
    monthlyPrice: 29.90,
    yearlyPrice: 29.90 * 12 * 0.85, // 15% desconto
    yearlyDiscount: 15,
    icon: <Users className="w-6 h-6" />,
    features: [
      'Tudo do plano Premium',
      '2 números WhatsApp',
      'Dashboard compartilhado',
      'Metas em conjunto',
      'Relatórios comparativos',
    ],
  },
];

const formatPrice = (price: number, isYearly: boolean = false) => {
  if (price === 0) return 'R$ 0';
  
  const formatted = price.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return `R$ ${formatted}${isYearly ? '/ano' : '/mês'}`;
};

export default function Plans() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<AccountType>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<AccountType | null>(null);
  const [isYearly, setIsYearly] = useState(false);

  useEffect(() => {
    const fetchCurrentPlan = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          setCurrentPlan(data.account_type);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentPlan();
  }, [user]);

  const handleUpgrade = async (planId: AccountType) => {
    if (!user || planId === currentPlan) return;
    
    setUpgrading(planId);
    
    try {
      // Simula processamento de pagamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: planId })
        .eq('user_id', user.id);

      if (error) throw error;

      setCurrentPlan(planId);
      toast.success(`Plano atualizado para ${plans.find(p => p.id === planId)?.name}!`);
    } catch (error: any) {
      console.error('Error upgrading:', error);
      toast.error('Erro ao atualizar plano. Tente novamente.');
    } finally {
      setUpgrading(null);
    }
  };

  const getPlanButton = (plan: Plan) => {
    if (plan.id === currentPlan) {
      return (
        <Button disabled className="w-full">
          Plano Atual
        </Button>
      );
    }

    const isDowngrade = 
      (currentPlan === 'couple' && (plan.id === 'paid' || plan.id === 'free')) ||
      (currentPlan === 'paid' && plan.id === 'free');

    return (
      <Button
        onClick={() => handleUpgrade(plan.id)}
        disabled={upgrading !== null}
        variant={plan.popular ? 'default' : 'outline'}
        className="w-full"
      >
        {upgrading === plan.id ? 'Processando...' : isDowngrade ? 'Fazer Downgrade' : 'Fazer Upgrade'}
      </Button>
    );
  };

  const getDisplayPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) {
      return formatPrice(0);
    }
    
    if (isYearly) {
      return formatPrice(plan.yearlyPrice, true);
    }
    
    return formatPrice(plan.monthlyPrice);
  };

  const getMonthlyEquivalent = (plan: Plan) => {
    if (plan.monthlyPrice === 0 || !isYearly) return null;
    const monthlyFromYearly = plan.yearlyPrice / 12;
    return formatPrice(monthlyFromYearly).replace('/mês', '');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pt-12 lg:pt-0">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Planos</h1>
            <p className="text-muted-foreground">Escolha o melhor plano para você</p>
          </div>
        </div>

        {/* Toggle Mensal/Anual */}
        <div className="flex items-center justify-center gap-4 py-4">
          <Label 
            htmlFor="billing-toggle" 
            className={`text-sm font-medium transition-colors ${!isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
          >
            Mensal
          </Label>
          <Switch
            id="billing-toggle"
            checked={isYearly}
            onCheckedChange={setIsYearly}
          />
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="billing-toggle" 
              className={`text-sm font-medium transition-colors ${isYearly ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              Anual
            </Label>
            <Badge variant="secondary" className="bg-green-500/10 text-green-600 border-green-500/20">
              Até 15% OFF
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative bg-card border-border transition-all ${
                plan.popular ? 'ring-2 ring-primary shadow-lg scale-[1.02]' : ''
              } ${currentPlan === plan.id ? 'border-primary' : ''}`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground">
                  Mais Popular
                </Badge>
              )}
              {currentPlan === plan.id && (
                <Badge variant="outline" className="absolute -top-3 right-4 border-primary text-primary">
                  Atual
                </Badge>
              )}
              {isYearly && plan.yearlyDiscount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="absolute top-4 right-4 bg-green-500/10 text-green-600 border-green-500/20"
                >
                  -{plan.yearlyDiscount}%
                </Badge>
              )}
              
              <CardHeader className="text-center pb-2">
                <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10 text-primary w-fit">
                  {plan.icon}
                </div>
                <CardTitle className="text-card-foreground">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="text-center space-y-4">
                <div className="space-y-1">
                  <div className="text-3xl font-bold text-foreground">
                    {getDisplayPrice(plan)}
                  </div>
                  {isYearly && plan.monthlyPrice > 0 && (
                    <div className="text-sm text-muted-foreground">
                      equivale a <span className="font-medium text-foreground">{getMonthlyEquivalent(plan)}</span>/mês
                    </div>
                  )}
                  {isYearly && plan.monthlyPrice > 0 && (
                    <div className="text-xs text-muted-foreground line-through">
                      {formatPrice(plan.monthlyPrice * 12, true)}
                    </div>
                  )}
                </div>
                
                <ul className="space-y-2 text-left">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                {loading ? (
                  <Button disabled className="w-full">Carregando...</Button>
                ) : (
                  getPlanButton(plan)
                )}
              </CardFooter>
            </Card>
          ))}
        </div>

        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> O plano Casal permite que você e seu parceiro(a) registrem gastos pelo WhatsApp 
              usando números diferentes, mantendo tudo organizado em um único dashboard compartilhado.
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
