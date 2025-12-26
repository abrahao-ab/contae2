import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  CreditCard, 
  PieChart, 
  Sparkles, 
  Shield, 
  Smartphone,
  ArrowRight,
  Check,
  TrendingUp,
  Wallet,
  Bot,
  Zap
} from 'lucide-react';

const Landing = () => {
  const features = [
    {
      icon: MessageSquare,
      title: 'Entrada via WhatsApp',
      description: 'Registre gastos por texto, voz ou foto. A IA entende e categoriza automaticamente.'
    },
    {
      icon: Sparkles,
      title: 'IA Inteligente',
      description: 'Categorização automática, análise de padrões e sugestões personalizadas de economia.'
    },
    {
      icon: CreditCard,
      title: 'Controle de Cartões',
      description: 'Gerencie múltiplos cartões de crédito com limites, faturas e parcelas em tempo real.'
    },
    {
      icon: PieChart,
      title: 'Dashboard Completo',
      description: 'Visualize receitas, despesas e projeções com filtros por período e categoria.'
    },
    {
      icon: Shield,
      title: 'Segurança Total',
      description: 'Seus dados financeiros protegidos com criptografia de ponta a ponta.'
    },
    {
      icon: TrendingUp,
      title: 'Projeções Inteligentes',
      description: 'Veja o impacto futuro das suas compras parceladas e compromissos financeiros.'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Conecte seu WhatsApp',
      description: 'Vincule seu número em segundos e comece a registrar gastos pela conversa.'
    },
    {
      number: '02',
      title: 'Registre suas transações',
      description: 'Envie por texto, áudio ou foto. "Almocei R$35" ou tire foto do recibo.'
    },
    {
      number: '03',
      title: 'A IA faz o resto',
      description: 'Categorização automática, parcelas calculadas e dashboard atualizado em tempo real.'
    }
  ];

  const benefits = [
    'Registro de gastos em 5 segundos pelo WhatsApp',
    'Categorização automática por IA',
    'Controle de cartões de crédito ilimitados',
    'Gestão de compras parceladas',
    'Dashboard com projeções financeiras',
    'Alertas inteligentes de gastos',
    'Suporte a múltiplas contas bancárias',
    'Relatórios detalhados por período'
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">FinanceIA</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">Como funciona</a>
            <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="bg-primary hover:bg-primary/90">
                Começar grátis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powered by AI + WhatsApp</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
            Controle suas finanças
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
              pelo WhatsApp
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Registre gastos por texto, voz ou foto. A IA categoriza automaticamente, 
            controla seus cartões e mostra exatamente para onde vai seu dinheiro.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 gap-2">
                Começar gratuitamente
                <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <a href="#how-it-works">
              <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                Ver como funciona
              </Button>
            </a>
          </div>
          
          <p className="text-sm text-muted-foreground mt-6">
            Sem cartão de crédito • Configuração em 2 minutos
          </p>
        </div>

        {/* Hero Image/Mockup */}
        <div className="container mx-auto mt-16 relative z-10">
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 shadow-2xl">
              <div className="rounded-xl bg-card overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-destructive/60" />
                    <div className="w-3 h-3 rounded-full bg-warning/60" />
                    <div className="w-3 h-3 rounded-full bg-success/60" />
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-xs text-muted-foreground">dashboard.financeia.com</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 p-6">
                  <Card className="bg-gradient-to-br from-income/20 to-income/5 border-income/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Receitas</p>
                      <p className="text-2xl font-bold text-income">R$ 8.500</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-expense/20 to-expense/5 border-expense/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Despesas</p>
                      <p className="text-2xl font-bold text-expense">R$ 3.240</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Saldo</p>
                      <p className="text-2xl font-bold text-primary">R$ 5.260</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-warning/20 to-warning/5 border-warning/30">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground">Cartões</p>
                      <p className="text-2xl font-bold text-warning">R$ 1.890</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para
              <br />
              <span className="text-primary">organizar suas finanças</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos poderosos que simplificam o controle financeiro do dia a dia.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simples assim
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece a controlar suas finanças em minutos, não em horas.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                )}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25">
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
          
          {/* WhatsApp Demo */}
          <div className="mt-16 max-w-md mx-auto">
            <div className="rounded-3xl bg-card border border-border p-4 shadow-xl">
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <div className="w-10 h-10 rounded-full bg-success flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">FinanceIA Bot</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              
              <div className="py-4 space-y-3">
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    Almocei 45 reais no restaurante
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                    <p className="text-foreground">✅ Registrado!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Despesa de R$ 45,00 em <strong>Alimentação</strong>
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    🎤 [Áudio: "Paguei uber 23 reais"]
                  </div>
                </div>
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                    <p className="text-foreground">✅ Entendi!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Despesa de R$ 23,00 em <strong>Transporte</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">Gratuito</h3>
                <p className="text-muted-foreground mb-6">Para começar a organizar</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ 0</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    50 transações/mês
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    1 cartão de crédito
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Dashboard básico
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    WhatsApp texto
                  </li>
                </ul>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">Começar grátis</Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Pro Plan */}
            <Card className="bg-card border-primary relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                  Popular
                </span>
              </div>
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">Pro</h3>
                <p className="text-muted-foreground mb-6">Para controle completo</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ 19</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Transações ilimitadas
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Cartões ilimitados
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Dashboard completo
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    WhatsApp voz + foto
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Projeções de gastos
                  </li>
                </ul>
                <Link to="/login" className="block">
                  <Button className="w-full bg-primary hover:bg-primary/90">Assinar Pro</Button>
                </Link>
              </CardContent>
            </Card>
            
            {/* Business Plan */}
            <Card className="bg-card border-border">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-foreground mb-2">Business</h3>
                <p className="text-muted-foreground mb-6">Para profissionais</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">R$ 49</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Tudo do Pro
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Múltiplos perfis
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Relatórios avançados
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    API de integração
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <Check className="w-5 h-5 text-success" />
                    Suporte prioritário
                  </li>
                </ul>
                <Link to="/login" className="block">
                  <Button variant="outline" className="w-full">Falar com vendas</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <div className="container mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 mb-6">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-primary font-medium">Comece agora mesmo</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Pronto para ter controle
            <br />
            total das suas finanças?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Junte-se a milhares de pessoas que já transformaram sua relação com dinheiro.
          </p>
          <Link to="/login">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 gap-2">
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12 px-4">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">FinanceIA</span>
            </div>
            <nav className="flex items-center gap-6 text-sm">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Termos</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Privacidade</a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">Suporte</a>
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 FinanceIA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
