import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { usePlanLimits, planNames } from '@/hooks/usePlanLimits';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Check, X, Crown, Users, Zap, ArrowLeft, Sparkles } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type AccountType = Database['public']['Enums']['account_type'];

interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: AccountType;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  yearlyDiscount: number;
  icon: React.ReactNode;
  features: PlanFeature[];
  popular?: boolean;
}

const plans: Plan[] = [
  {
    id: 'free',
    name: 'Gratuito',
    description: 'Ideal para começar a organizar suas finanças',
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    icon: <Zap className="w-6 h-6" />,
    features: [
      { text: 'Registro de gastos e receitas via WhatsApp', included: true },
      { text: 'Dashboard web básico', included: true },
      { text: 'Categorias pré-estabelecidas (leitura)', included: true },
      { text: 'Até 10 compromissos ativos', included: true },
      { text: 'Até 10 lembretes ativos', included: true },
      { text: 'Resumo diário simples', included: true },
      { text: '1 conta bancária', included: true },
      { text: '1 cartão de crédito', included: true },
      { text: '1 número de WhatsApp', included: true },
      { text: 'Personalização de categorias', included: false },
      { text: 'Relatórios detalhados', included: false },
      { text: 'Exportação de dados', included: false },
      { text: 'Alertas de gastos', included: false },
      { text: 'Metas financeiras', included: false },
    ],
  },
  {
    id: 'paid',
    name: 'Premium',
    description: 'Controle completo financeiro e de rotina',
    monthlyPrice: 29.90,
    yearlyPrice: 299,
    yearlyDiscount: 17,
    icon: <Crown className="w-6 h-6" />,
    popular: true,
    features: [
      { text: 'Tudo do Gratuito +', included: true, highlight: true },
      { text: 'Registro ilimitado de gastos e receitas', included: true },
      { text: 'Categorias ilimitadas e personalizáveis', included: true },
      { text: 'Dashboard completo', included: true },
      { text: 'Relatórios mensais detalhados', included: true },
      { text: 'Exportação de relatórios (PDF/Excel)', included: true },
      { text: 'Resumo diário completo', included: true },
      { text: 'Compromissos e lembretes ilimitados', included: true },
      { text: 'Alertas inteligentes de gastos', included: true },
      { text: 'Histórico financeiro completo', included: true },
      { text: 'Contas bancárias ilimitadas', included: true },
      { text: 'Cartões de crédito ilimitados', included: true },
      { text: 'Conectar até 2 pessoas à conta', included: true },
      { text: 'Suporte prioritário via WhatsApp', included: true },
    ],
  },
  {
    id: 'couple',
    name: 'Conta Casal',
    description: 'Organização compartilhada para casais',
    monthlyPrice: 49.90,
    yearlyPrice: 499,
    yearlyDiscount: 17,
    icon: <Users className="w-6 h-6" />,
    features: [
      { text: 'Tudo do Premium +', included: true, highlight: true },
      { text: '2 números de WhatsApp vinculados', included: true },
      { text: 'Perfis individuais + painel conjunto', included: true },
      { text: 'Gastos individuais e compartilhados', included: true },
      { text: 'Categorias ilimitadas para o casal', included: true },
      { text: 'Compromissos compartilhados', included: true },
      { text: 'Lembretes sincronizados', included: true },
      { text: 'Resumo diário individual e do casal', included: true },
      { text: 'Relatórios individuais e consolidados', included: true },
      { text: 'Metas financeiras conjuntas', included: true },
      { text: 'Alertas quando gastos fogem do combinado', included: true },
      { text: 'Suporte prioritário', included: true },
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

// Comparison table features
const comparisonFeatures = [
  { category: 'Registro', features: [
    { name: 'Registro via WhatsApp', free: true, paid: true, couple: true },
    { name: 'Transações ilimitadas', free: false, paid: true, couple: true },
    { name: 'Números de WhatsApp', free: '1', paid: '1', couple: '2' },
  ]},
  { category: 'Dashboard', features: [
    { name: 'Dashboard básico', free: true, paid: true, couple: true },
    { name: 'Dashboard completo', free: false, paid: true, couple: true },
    { name: 'Visão conjunta (casal)', free: false, paid: false, couple: true },
  ]},
  { category: 'Categorias', features: [
    { name: 'Categorias padrão', free: true, paid: true, couple: true },
    { name: 'Criar/editar categorias', free: false, paid: true, couple: true },
    { name: 'Categorias ilimitadas', free: false, paid: true, couple: true },
  ]},
  { category: 'Contas e Cartões', features: [
    { name: 'Contas bancárias', free: '1', paid: 'Ilimitado', couple: 'Ilimitado' },
    { name: 'Cartões de crédito', free: '1', paid: 'Ilimitado', couple: 'Ilimitado' },
  ]},
  { category: 'Relatórios', features: [
    { name: 'Resumo diário simples', free: true, paid: true, couple: true },
    { name: 'Resumo diário completo', free: false, paid: true, couple: true },
    { name: 'Relatórios detalhados', free: false, paid: true, couple: true },
    { name: 'Exportação PDF/Excel', free: false, paid: true, couple: true },
    { name: 'Relatórios do casal', free: false, paid: false, couple: true },
  ]},
  { category: 'Recursos Extras', features: [
    { name: 'Alertas de gastos', free: false, paid: true, couple: true },
    { name: 'Metas financeiras', free: false, paid: false, couple: true },
    { name: 'Suporte prioritário', free: false, paid: true, couple: true },
  ]},
];

export default function Plans() {
  const { user } = useAuth();
  const { accountType } = usePlanLimits();
  const navigate = useNavigate();
  const [currentPlan, setCurrentPlan] = useState<AccountType>('free');
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<AccountType | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

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
        <Button disabled className="w-full" variant="outline">
          Plano Atual
        </Button>
      );
    }

    const isDowngrade = 
      (currentPlan === 'couple' && (plan.id === 'paid' || plan.id === 'free')) ||
      (currentPlan === 'paid' && plan.id === 'free');

    if (plan.id === 'free') {
      return (
        <Button
          onClick={() => handleUpgrade(plan.id)}
          disabled={upgrading !== null}
          variant="outline"
          className="w-full"
        >
          {upgrading === plan.id ? 'Processando...' : 'Começar grátis'}
        </Button>
      );
    }

    return (
      <Button
        onClick={() => handleUpgrade(plan.id)}
        disabled={upgrading !== null}
        variant={plan.popular ? 'default' : 'outline'}
        className={`w-full ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
      >
        {upgrading === plan.id ? 'Processando...' : isDowngrade ? 'Fazer Downgrade' : `Assinar ${plan.name}`}
      </Button>
    );
  };

  const getDisplayPrice = (plan: Plan) => {
    if (plan.monthlyPrice === 0) return formatPrice(0);
    return isYearly ? formatPrice(plan.yearlyPrice, true) : formatPrice(plan.monthlyPrice);
  };

  const getMonthlyEquivalent = (plan: Plan) => {
    if (plan.monthlyPrice === 0 || !isYearly) return null;
    const monthlyFromYearly = plan.yearlyPrice / 12;
    return formatPrice(monthlyFromYearly).replace('/mês', '');
  };

  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-primary" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground/50" />
      );
    }
    return <span className="text-sm font-medium text-foreground">{value}</span>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 pt-12 lg:pt-0">
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
            <p className="text-muted-foreground">
              Escolha o melhor plano para você
              {currentPlan !== 'free' && (
                <Badge variant="outline" className="ml-2 border-primary text-primary">
                  {planNames[currentPlan]}
                </Badge>
              )}
            </p>
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
            <Badge variant="secondary" className="bg-success/10 text-success border-success/20">
              Economize 17%
            </Badge>
          </div>
        </div>

        {/* Plan Cards */}
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
                  className="absolute top-4 right-4 bg-success/10 text-success border-success/20"
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
                    <>
                      <div className="text-sm text-muted-foreground">
                        equivale a <span className="font-medium text-foreground">{getMonthlyEquivalent(plan)}</span>/mês
                      </div>
                      <div className="text-xs text-muted-foreground line-through">
                        {formatPrice(plan.monthlyPrice * 12, true)}
                      </div>
                    </>
                  )}
                </div>
                
                <ul className="space-y-2 text-left max-h-64 overflow-y-auto">
                  {plan.features.slice(0, 8).map((feature, index) => (
                    <li key={index} className={`flex items-center gap-2 text-sm ${feature.highlight ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                      {feature.included ? (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      ) : (
                        <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0" />
                      )}
                      {feature.text}
                    </li>
                  ))}
                  {plan.features.length > 8 && (
                    <li className="text-xs text-muted-foreground text-center pt-2">
                      + {plan.features.length - 8} recursos
                    </li>
                  )}
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

        {/* Toggle Comparison Table */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            onClick={() => setShowComparison(!showComparison)}
            className="gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {showComparison ? 'Ocultar comparativo' : 'Ver comparativo completo'}
          </Button>
        </div>

        {/* Comparison Table */}
        {showComparison && (
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle className="text-center">Comparativo de Planos</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-foreground">Recurso</th>
                      <th className="text-center p-4 font-medium text-foreground min-w-[100px]">Gratuito</th>
                      <th className="text-center p-4 font-medium text-primary min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <Crown className="w-4 h-4" />
                          Premium
                        </div>
                      </th>
                      <th className="text-center p-4 font-medium text-foreground min-w-[100px]">
                        <div className="flex flex-col items-center gap-1">
                          <Users className="w-4 h-4" />
                          Casal
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((section, sectionIndex) => (
                      <>
                        <tr key={`section-${sectionIndex}`} className="bg-muted/30">
                          <td colSpan={4} className="p-3 font-semibold text-foreground text-sm uppercase tracking-wide">
                            {section.category}
                          </td>
                        </tr>
                        {section.features.map((feature, featureIndex) => (
                          <tr key={`feature-${sectionIndex}-${featureIndex}`} className="border-b border-border/50 hover:bg-muted/20">
                            <td className="p-4 text-sm text-muted-foreground">{feature.name}</td>
                            <td className="p-4 text-center">{renderFeatureValue(feature.free)}</td>
                            <td className="p-4 text-center bg-primary/5">{renderFeatureValue(feature.paid)}</td>
                            <td className="p-4 text-center">{renderFeatureValue(feature.couple)}</td>
                          </tr>
                        ))}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tips */}
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Crown className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Premium</p>
                  <p className="text-sm text-muted-foreground">
                    Ideal para quem quer controle total das finanças com relatórios e alertas inteligentes.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-pink-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Conta Casal</p>
                  <p className="text-sm text-muted-foreground">
                    Perfeito para casais organizarem juntos as finanças com visão individual e compartilhada.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
