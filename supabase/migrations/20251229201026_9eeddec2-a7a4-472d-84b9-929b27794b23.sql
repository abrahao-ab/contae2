-- Update existing plans data with new structure
DELETE FROM public.plans;

-- Insert new plans with correct pricing and features
INSERT INTO public.plans (id, name, description, price, price_display, icon, features, popular, sort_order, is_active) VALUES
(
  'free',
  'Gratuito',
  'Ideal para quem quer começar a se organizar sem compromisso',
  0,
  'R$ 0',
  'zap',
  '[
    {"text": "Registro de gastos e receitas via WhatsApp", "included": true},
    {"text": "Dashboard web (saldo, receitas, despesas)", "included": true},
    {"text": "Categorias pré-estabelecidas (somente leitura)", "included": true},
    {"text": "Até 10 compromissos ativos", "included": true},
    {"text": "Até 10 lembretes ativos", "included": true},
    {"text": "Resumo diário simples", "included": true},
    {"text": "1 conta bancária", "included": true},
    {"text": "1 cartão de crédito", "included": true},
    {"text": "1 número de WhatsApp", "included": true},
    {"text": "Personalização de categorias", "included": false},
    {"text": "Relatórios detalhados", "included": false},
    {"text": "Exportação de dados", "included": false},
    {"text": "Alertas de gastos", "included": false},
    {"text": "Metas financeiras", "included": false}
  ]'::jsonb,
  false,
  1,
  true
),
(
  'paid',
  'Premium',
  'Controle completo financeiro e de rotina',
  29.90,
  'R$ 29,90/mês',
  'crown',
  '[
    {"text": "Tudo do Gratuito +", "included": true, "highlight": true},
    {"text": "Registro ilimitado de gastos e receitas", "included": true},
    {"text": "Categorias ilimitadas e personalizáveis", "included": true},
    {"text": "Dashboard completo de acompanhamento", "included": true},
    {"text": "Relatórios mensais detalhados", "included": true},
    {"text": "Exportação de relatórios (PDF/Excel)", "included": true},
    {"text": "Resumo diário completo", "included": true},
    {"text": "Compromissos e lembretes ilimitados", "included": true},
    {"text": "Alertas inteligentes de gastos", "included": true},
    {"text": "Histórico financeiro completo", "included": true},
    {"text": "Contas bancárias ilimitadas", "included": true},
    {"text": "Cartões de crédito ilimitados", "included": true},
    {"text": "Conectar até 2 pessoas à conta", "included": true},
    {"text": "Suporte prioritário via WhatsApp", "included": true}
  ]'::jsonb,
  true,
  2,
  true
),
(
  'couple',
  'Conta Casal',
  'Organização financeira e de rotina compartilhada para casais',
  49.90,
  'R$ 49,90/mês',
  'users',
  '[
    {"text": "Tudo do Premium +", "included": true, "highlight": true},
    {"text": "2 números de WhatsApp vinculados", "included": true},
    {"text": "Perfis individuais + painel conjunto", "included": true},
    {"text": "Gastos individuais e compartilhados", "included": true},
    {"text": "Categorias ilimitadas para o casal", "included": true},
    {"text": "Compromissos e afazeres compartilhados", "included": true},
    {"text": "Lembretes sincronizados entre o casal", "included": true},
    {"text": "Resumo diário individual e do casal", "included": true},
    {"text": "Relatórios individuais e consolidados", "included": true},
    {"text": "Metas financeiras conjuntas", "included": true},
    {"text": "Alertas quando gastos fogem do combinado", "included": true},
    {"text": "Suporte prioritário", "included": true}
  ]'::jsonb,
  false,
  3,
  true
);

-- Create plan_limits table for feature gating
CREATE TABLE IF NOT EXISTS public.plan_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id text NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  feature_key text NOT NULL,
  limit_value integer,
  is_unlimited boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, feature_key)
);

-- Enable RLS
ALTER TABLE public.plan_limits ENABLE ROW LEVEL SECURITY;

-- Public read policy (limits are public info)
CREATE POLICY "Plan limits are publicly readable"
ON public.plan_limits
FOR SELECT
USING (true);

-- Insert limits for each plan
INSERT INTO public.plan_limits (plan_id, feature_key, limit_value, is_unlimited) VALUES
-- Free plan limits
('free', 'whatsapp_numbers', 1, false),
('free', 'bank_accounts', 1, false),
('free', 'credit_cards', 1, false),
('free', 'categories', 0, false), -- 0 = can't create custom, only defaults
('free', 'commitments', 10, false),
('free', 'reminders', 10, false),
('free', 'connected_users', 1, false),
('free', 'can_export', 0, false), -- 0 = false
('free', 'can_create_reports', 0, false),
('free', 'can_create_alerts', 0, false),
('free', 'can_create_goals', 0, false),
('free', 'can_customize_categories', 0, false),

-- Premium plan limits
('paid', 'whatsapp_numbers', 1, false),
('paid', 'bank_accounts', null, true),
('paid', 'credit_cards', null, true),
('paid', 'categories', null, true),
('paid', 'commitments', null, true),
('paid', 'reminders', null, true),
('paid', 'connected_users', 3, false), -- 1 owner + 2 connected
('paid', 'can_export', 1, false), -- 1 = true
('paid', 'can_create_reports', 1, false),
('paid', 'can_create_alerts', 1, false),
('paid', 'can_create_goals', 1, false),
('paid', 'can_customize_categories', 1, false),

-- Couple plan limits
('couple', 'whatsapp_numbers', 2, false),
('couple', 'bank_accounts', null, true),
('couple', 'credit_cards', null, true),
('couple', 'categories', null, true),
('couple', 'commitments', null, true),
('couple', 'reminders', null, true),
('couple', 'connected_users', 2, false), -- 2 owners (couple)
('couple', 'can_export', 1, false),
('couple', 'can_create_reports', 1, false),
('couple', 'can_create_alerts', 1, false),
('couple', 'can_create_goals', 1, false),
('couple', 'can_customize_categories', 1, false),
('couple', 'has_shared_view', 1, false),
('couple', 'has_shared_goals', 1, false);