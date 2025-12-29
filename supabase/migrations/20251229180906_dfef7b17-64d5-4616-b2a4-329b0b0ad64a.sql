-- Create plans table
CREATE TABLE public.plans (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  price_display TEXT NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  popular BOOLEAN DEFAULT false,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert the three plans
INSERT INTO public.plans (id, name, description, price, price_display, features, popular, icon, sort_order) VALUES
  ('free', 'Gratuito', 'Para começar a organizar suas finanças', 0, 'R$ 0', '["Controle de gastos básico", "1 número WhatsApp", "Categorias padrão", "Relatórios simples"]'::jsonb, false, 'zap', 1),
  ('paid', 'Premium', 'Para quem quer o controle completo', 19.90, 'R$ 19,90/mês', '["Tudo do plano Gratuito", "IA para classificação automática", "Análise comportamental", "Projeções financeiras", "Alertas inteligentes", "Suporte prioritário"]'::jsonb, true, 'crown', 2),
  ('couple', 'Casal', 'Finanças compartilhadas a dois', 29.90, 'R$ 29,90/mês', '["Tudo do plano Premium", "2 números WhatsApp", "Dashboard compartilhado", "Metas em conjunto", "Relatórios comparativos"]'::jsonb, false, 'users', 3);

-- Enable RLS
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (plans should be visible to everyone)
CREATE POLICY "Plans are publicly readable" 
ON public.plans 
FOR SELECT 
USING (true);