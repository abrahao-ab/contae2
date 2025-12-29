import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
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

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1 }
};

const slideInLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0 }
};

const slideInRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0 }
};

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
      <motion.header 
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <motion.div 
            className="flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground">FinanceIA</span>
          </motion.div>
          <nav className="hidden md:flex items-center gap-8">
            {['features', 'how-it-works', 'pricing'].map((item, i) => (
              <motion.a 
                key={item}
                href={`#${item}`} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                whileHover={{ scale: 1.05 }}
              >
                {item === 'features' ? 'Recursos' : item === 'how-it-works' ? 'Como funciona' : 'Preços'}
              </motion.a>
            ))}
          </nav>
          <motion.div 
            className="flex items-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  Começar grátis
                </Button>
              </motion.div>
            </Link>
          </motion.div>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        <div className="container mx-auto text-center relative z-10">
          <motion.div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Bot className="w-4 h-4 text-primary" />
            <span className="text-sm text-primary font-medium">Powered by AI + WhatsApp</span>
          </motion.div>
          
          <motion.h1 
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Controle suas finanças
            <br />
            <motion.span 
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              pelo WhatsApp
            </motion.span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            Registre gastos por texto, voz ou foto. A IA categoriza automaticamente, 
            controla seus cartões e mostra exatamente para onde vai seu dinheiro.
          </motion.p>
          
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Link to="/login">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 gap-2">
                  Começar gratuitamente
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
                </Button>
              </motion.div>
            </Link>
            <a href="#how-it-works">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button size="lg" variant="outline" className="text-lg px-8 h-14">
                  Ver como funciona
                </Button>
              </motion.div>
            </a>
          </motion.div>
          
          <motion.p 
            className="text-sm text-muted-foreground mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            Sem cartão de crédito • Configuração em 2 minutos
          </motion.p>
        </div>

        {/* Hero Image/Mockup */}
        <motion.div 
          className="container mx-auto mt-16 relative z-10"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="relative mx-auto max-w-5xl">
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <motion.div 
              className="rounded-2xl border border-border bg-card/50 backdrop-blur-sm p-4 shadow-2xl"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
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
                <motion.div 
                  className="grid grid-cols-4 gap-4 p-6"
                  variants={staggerContainer}
                  initial="hidden"
                  animate="visible"
                >
                  {[
                    { label: 'Receitas', value: 'R$ 8.500', color: 'income' },
                    { label: 'Despesas', value: 'R$ 3.240', color: 'expense' },
                    { label: 'Saldo', value: 'R$ 5.260', color: 'primary' },
                    { label: 'Cartões', value: 'R$ 1.890', color: 'warning' }
                  ].map((stat, i) => (
                    <motion.div key={i} variants={fadeInUp}>
                      <Card className={`bg-gradient-to-br from-${stat.color}/20 to-${stat.color}/5 border-${stat.color}/30`}>
                        <CardContent className="p-4">
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                          <p className={`text-2xl font-bold text-${stat.color}`}>{stat.value}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que você precisa para
              <br />
              <span className="text-primary">organizar suas finanças</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Recursos poderosos que simplificam o controle financeiro do dia a dia.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                <Card className="bg-card border-border hover:border-primary/50 transition-colors group h-full">
                  <CardContent className="p-6">
                    <motion.div 
                      className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                      whileHover={{ scale: 1.1, rotate: 5 }}
                    >
                      <feature.icon className="w-6 h-6 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simples assim
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece a controlar suas finanças em minutos, não em horas.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {steps.map((step, index) => (
              <motion.div 
                key={index} 
                className="text-center relative"
                variants={fadeInUp}
                transition={{ duration: 0.5 }}
              >
                {index < steps.length - 1 && (
                  <motion.div 
                    className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary/50 to-transparent"
                    initial={{ scaleX: 0 }}
                    whileInView={{ scaleX: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                )}
                <motion.div 
                  className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/25"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <span className="text-2xl font-bold text-primary-foreground">{step.number}</span>
                </motion.div>
                <h3 className="text-xl font-semibold text-foreground mb-2">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </motion.div>
          
          {/* WhatsApp Demo */}
          <motion.div 
            className="mt-16 max-w-md mx-auto"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={scaleIn}
            transition={{ duration: 0.6 }}
          >
            <motion.div 
              className="rounded-3xl bg-card border border-border p-4 shadow-xl"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex items-center gap-3 pb-4 border-b border-border">
                <motion.div 
                  className="w-10 h-10 rounded-full bg-success flex items-center justify-center"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <MessageSquare className="w-5 h-5 text-white" />
                </motion.div>
                <div>
                  <p className="font-semibold text-foreground">FinanceIA Bot</p>
                  <p className="text-xs text-muted-foreground">Online</p>
                </div>
              </div>
              
              <div className="py-4 space-y-3">
                <motion.div 
                  className="flex justify-end"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    Almocei 45 reais no restaurante
                  </div>
                </motion.div>
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                    <p className="text-foreground">✅ Registrado!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Despesa de R$ 45,00 em <strong>Alimentação</strong>
                    </p>
                  </div>
                </motion.div>
                <motion.div 
                  className="flex justify-end"
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6 }}
                >
                  <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-2 max-w-[80%]">
                    🎤 [Áudio: "Paguei uber 23 reais"]
                  </div>
                </motion.div>
                <motion.div 
                  className="flex justify-start"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.8 }}
                >
                  <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-2 max-w-[80%]">
                    <p className="text-foreground">✅ Entendi!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Despesa de R$ 23,00 em <strong>Transporte</strong>
                    </p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInUp}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Planos simples e transparentes
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Comece grátis e evolua conforme sua necessidade.
            </p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Free Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-card border-border h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Gratuito</h3>
                  <p className="text-muted-foreground mb-6">Para começar a organizar</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">R$ 0</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['50 transações/mês', '1 cartão de crédito', 'Dashboard básico', 'WhatsApp texto'].map((item, i) => (
                      <motion.li 
                        key={i}
                        className="flex items-center gap-2 text-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Check className="w-5 h-5 text-success" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                  <Link to="/login" className="block">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="w-full">Começar grátis</Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Pro Plan */}
            <motion.div variants={scaleIn}>
              <Card className="bg-card border-primary relative h-full">
                <motion.div 
                  className="absolute -top-4 left-1/2 -translate-x-1/2"
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <span className="bg-primary text-primary-foreground text-sm font-medium px-4 py-1 rounded-full">
                    Popular
                  </span>
                </motion.div>
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Pro</h3>
                  <p className="text-muted-foreground mb-6">Para controle completo</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">R$ 19</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['Transações ilimitadas', 'Cartões ilimitados', 'Dashboard completo', 'WhatsApp voz + foto', 'Projeções de gastos'].map((item, i) => (
                      <motion.li 
                        key={i}
                        className="flex items-center gap-2 text-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Check className="w-5 h-5 text-success" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                  <Link to="/login" className="block">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full bg-primary hover:bg-primary/90">Assinar Pro</Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Business Plan */}
            <motion.div variants={fadeInUp}>
              <Card className="bg-card border-border h-full">
                <CardContent className="p-8">
                  <h3 className="text-xl font-semibold text-foreground mb-2">Business</h3>
                  <p className="text-muted-foreground mb-6">Para profissionais</p>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-foreground">R$ 49</span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {['Tudo do Pro', 'Múltiplos perfis', 'Relatórios avançados', 'API de integração', 'Suporte prioritário'].map((item, i) => (
                      <motion.li 
                        key={i}
                        className="flex items-center gap-2 text-foreground"
                        initial={{ opacity: 0, x: -10 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.1 }}
                      >
                        <Check className="w-5 h-5 text-success" />
                        {item}
                      </motion.li>
                    ))}
                  </ul>
                  <Link to="/login" className="block">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button variant="outline" className="w-full">Falar com vendas</Button>
                    </motion.div>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
        <motion.div 
          className="container mx-auto text-center relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
          transition={{ duration: 0.6 }}
        >
          <motion.div 
            className="inline-flex items-center gap-2 mb-6"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-primary font-medium">Comece agora mesmo</span>
          </motion.div>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-6">
            Pronto para ter controle
            <br />
            total das suas finanças?
          </h2>
          <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
            Junte-se a milhares de pessoas que já transformaram sua relação com dinheiro.
          </p>
          <Link to="/login">
            <motion.div 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 h-14 gap-2">
                Criar conta gratuita
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.div>
              </Button>
            </motion.div>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <motion.footer 
        className="border-t border-border py-12 px-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <motion.div 
              className="flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl text-foreground">FinanceIA</span>
            </motion.div>
            <nav className="flex items-center gap-6 text-sm">
              {['Termos', 'Privacidade', 'Suporte'].map((item) => (
                <motion.a 
                  key={item}
                  href="#" 
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  {item}
                </motion.a>
              ))}
            </nav>
            <p className="text-sm text-muted-foreground">
              © 2024 FinanceIA. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Landing;
