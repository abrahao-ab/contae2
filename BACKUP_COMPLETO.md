# 📦 BACKUP COMPLETO - IA Financeira via WhatsApp
## Contaê - Sistema de Controle Financeiro Inteligente

**Data do Backup:** 2026-01-12  
**Versão:** 1.0.0  
**Projeto ID:** eiezckbfjwmrluloxusv

---

## 📋 ÍNDICE

1. [Informações do Projeto](#-informações-do-projeto)
2. [Configurações de Ambiente](#-configurações-de-ambiente)
3. [Estrutura do Banco de Dados](#-estrutura-do-banco-de-dados)
4. [Edge Functions](#-edge-functions)
5. [Configurações do Frontend](#-configurações-do-frontend)
6. [Secrets e Chaves](#-secrets-e-chaves)
7. [Instruções de Restauração](#-instruções-de-restauração)

---

## 📁 INFORMAÇÕES DO PROJETO

### Stack Tecnológica
- **Frontend:** React 18 + TypeScript + Vite
- **Estilização:** Tailwind CSS + shadcn/ui
- **Backend:** Supabase (Lovable Cloud)
- **Integrações:** Evolution API (WhatsApp)
- **State Management:** TanStack Query (React Query)
- **Roteamento:** React Router DOM v6

### Rotas da Aplicação
```
/                    → Landing Page (pública)
/login              → Página de Login
/cadastro           → Página de Cadastro
/dashboard          → Dashboard Principal (protegida)
/transactions       → Gerenciamento de Transações (protegida)
/cards              → Gerenciamento de Cartões (protegida)
/accounts           → Gerenciamento de Contas (protegida)
/categories         → Gerenciamento de Categorias (protegida)
/settings           → Configurações (protegida)
/settings/couple    → Configurações de Casal (protegida)
/plans              → Planos e Upgrades (protegida)
```

### Dependências Principais
```json
{
  "@supabase/supabase-js": "^2.89.0",
  "@tanstack/react-query": "^5.83.0",
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "tailwindcss": "^3.x",
  "framer-motion": "^12.23.26",
  "recharts": "^2.15.4",
  "date-fns": "^3.6.0"
}
```

---

## ⚙️ CONFIGURAÇÕES DE AMBIENTE

### Variáveis de Ambiente (.env)
```env
VITE_SUPABASE_URL=https://eiezckbfjwmrluloxusv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=eiezckbfjwmrluloxusv
```

### Configuração Supabase (supabase/config.toml)
```toml
project_id = "eiezckbfjwmrluloxusv"

[functions.pay-card-invoice]
verify_jwt = false

[functions.whatsapp-webhook]
verify_jwt = false

[functions.get-summary]
verify_jwt = false

[functions.list-transactions]
verify_jwt = false

[functions.create-transaction]
verify_jwt = false

[functions.delete-transaction]
verify_jwt = false

[functions.check-user]
verify_jwt = false

[functions.create-user]
verify_jwt = false

[functions.update-user]
verify_jwt = false

[functions.create-category]
verify_jwt = false

[functions.list-categories]
verify_jwt = false

[functions.create-credit-card]
verify_jwt = false

[functions.create-bank-account]
verify_jwt = false

[functions.list-bank-accounts]
verify_jwt = false

[functions.list-credit-cards]
verify_jwt = false
```

---

## 🗄️ ESTRUTURA DO BANCO DE DADOS

### Tabelas Principais

#### 1. profiles
```sql
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT,
  phone TEXT,
  account_type account_type DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enum: account_type = 'free' | 'paid' | 'couple'
```

#### 2. transactions
```sql
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  type transaction_type NOT NULL,
  description TEXT,
  category_id UUID REFERENCES categories(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  credit_card_id UUID REFERENCES credit_cards(id),
  couple_id UUID REFERENCES couples(id),
  date DATE DEFAULT CURRENT_DATE,
  is_installment BOOLEAN DEFAULT false,
  total_installments INTEGER,
  current_installment INTEGER,
  is_recurring BOOLEAN DEFAULT false,
  parent_transaction_id UUID REFERENCES transactions(id),
  purchase_date DATE,
  source transaction_source DEFAULT 'web',
  owner_type transaction_owner_type DEFAULT 'individual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enum: transaction_type = 'income' | 'expense'
-- Enum: transaction_source = 'web' | 'whatsapp_text' | 'whatsapp_voice' | 'whatsapp_image'
-- Enum: transaction_owner_type = 'individual' | 'shared'
```

#### 3. categories
```sql
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  couple_id UUID REFERENCES couples(id),
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 4. bank_accounts
```sql
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT,
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 5. credit_cards
```sql
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  last_four_digits TEXT,
  credit_limit NUMERIC DEFAULT 0,
  current_balance NUMERIC DEFAULT 0,
  closing_day INTEGER,
  due_day INTEGER,
  color TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 6. installments
```sql
CREATE TABLE public.installments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  installment_number INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  status installment_status DEFAULT 'pending',
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enum: installment_status = 'pending' | 'paid' | 'overdue'
```

#### 7. card_payments
```sql
CREATE TABLE public.card_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  credit_card_id UUID NOT NULL REFERENCES credit_cards(id),
  bank_account_id UUID REFERENCES bank_accounts(id),
  transaction_id UUID REFERENCES transactions(id),
  amount NUMERIC NOT NULL,
  payment_date DATE DEFAULT CURRENT_DATE,
  is_full_payment BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 8. whatsapp_numbers
```sql
CREATE TABLE public.whatsapp_numbers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  phone TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 9. couples
```sql
CREATE TABLE public.couples (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 10. couple_members
```sql
CREATE TABLE public.couple_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couples(id),
  user_id UUID NOT NULL,
  is_owner BOOLEAN DEFAULT false,
  nickname TEXT,
  avatar_color TEXT,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 11. couple_invites
```sql
CREATE TABLE public.couple_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couples(id),
  inviter_id UUID NOT NULL,
  invitee_phone TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '7 days'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 12. couple_goals
```sql
CREATE TABLE public.couple_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couples(id),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  deadline DATE,
  icon TEXT,
  color TEXT,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 13. couple_budgets
```sql
CREATE TABLE public.couple_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  couple_id UUID NOT NULL REFERENCES couples(id),
  category_id UUID REFERENCES categories(id),
  monthly_limit NUMERIC NOT NULL,
  alert_threshold NUMERIC DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 14. plans
```sql
CREATE TABLE public.plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  price_display TEXT NOT NULL,
  features JSONB DEFAULT '[]',
  icon TEXT,
  popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 15. plan_limits
```sql
CREATE TABLE public.plan_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id TEXT NOT NULL REFERENCES plans(id),
  feature_key TEXT NOT NULL,
  limit_value INTEGER,
  is_unlimited BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

#### 16. user_roles
```sql
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  role app_role DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enum: app_role = 'admin' | 'user'
```

### Database Functions

#### handle_new_user()
```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  user_phone text;
BEGIN
  user_phone := NEW.raw_user_meta_data ->> 'phone';
  
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, account_type)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    'free'
  );
  
  -- Add WhatsApp number if provided
  IF user_phone IS NOT NULL AND user_phone != '' THEN
    INSERT INTO public.whatsapp_numbers (user_id, phone, is_primary)
    VALUES (NEW.id, user_phone, true);
  END IF;
  
  -- Assign default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Create default categories
  INSERT INTO public.categories (user_id, name, icon, color, is_default) VALUES
    (NEW.id, 'Alimentação', 'utensils', '#22c55e', true),
    (NEW.id, 'Transporte', 'car', '#3b82f6', true),
    (NEW.id, 'Moradia', 'home', '#8b5cf6', true),
    (NEW.id, 'Lazer', 'gamepad-2', '#f59e0b', true),
    (NEW.id, 'Saúde', 'heart-pulse', '#ef4444', true),
    (NEW.id, 'Educação', 'graduation-cap', '#06b6d4', true),
    (NEW.id, 'Compras', 'shopping-bag', '#ec4899', true),
    (NEW.id, 'Serviços', 'wrench', '#64748b', true),
    (NEW.id, 'Salário', 'wallet', '#10b981', true),
    (NEW.id, 'Investimentos', 'trending-up', '#6366f1', true),
    (NEW.id, 'Outros', 'circle-dot', '#94a3b8', true);
  
  RETURN NEW;
END;
$$;
```

#### get_user_couple_id()
```sql
CREATE OR REPLACE FUNCTION public.get_user_couple_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT couple_id
  FROM public.couple_members
  WHERE user_id = _user_id
  LIMIT 1
$$;
```

#### is_couple_member()
```sql
CREATE OR REPLACE FUNCTION public.is_couple_member(_user_id uuid, _couple_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.couple_members
    WHERE user_id = _user_id
      AND couple_id = _couple_id
  )
$$;
```

#### has_role()
```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id 
      AND role = _role
      AND _user_id = auth.uid()
  )
$$;
```

#### validate_whatsapp_limit()
```sql
CREATE OR REPLACE FUNCTION public.validate_whatsapp_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
  user_account_type account_type;
BEGIN
  SELECT account_type INTO user_account_type
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  CASE user_account_type
    WHEN 'free' THEN max_allowed := 1;
    WHEN 'paid' THEN max_allowed := 1;
    WHEN 'couple' THEN max_allowed := 2;
    ELSE max_allowed := 1;
  END CASE;
  
  SELECT COUNT(*) INTO current_count
  FROM public.whatsapp_numbers
  WHERE user_id = NEW.user_id;
  
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de WhatsApps atingido (máximo: %)', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$;
```

---

## 🔧 EDGE FUNCTIONS

### Lista de Edge Functions
1. `check-user` - Verificar existência de usuário
2. `create-user` - Criar novo usuário
3. `update-user` - Atualizar dados do usuário
4. `create-transaction` - Criar transação
5. `list-transactions` - Listar transações
6. `delete-transaction` - Excluir transação
7. `get-summary` - Resumo financeiro
8. `create-category` - Criar categoria
9. `list-categories` - Listar categorias
10. `create-bank-account` - Criar conta bancária
11. `list-bank-accounts` - Listar contas
12. `create-credit-card` - Criar cartão
13. `list-credit-cards` - Listar cartões
14. `pay-card-invoice` - Pagar fatura
15. `whatsapp-webhook` - Webhook do WhatsApp
16. `send-whatsapp` - Enviar mensagem

### Documentação Completa
Consulte o arquivo `DOCS.md` para documentação detalhada de cada endpoint.

---

## 🎨 CONFIGURAÇÕES DO FRONTEND

### Design System (index.css)
```css
:root {
  /* Contaê Design System - Light Mode */
  --background: 150 10% 97%;
  --foreground: 159 40% 15%;
  --card: 0 0% 100%;
  --primary: 91 72% 50%;
  --primary-foreground: 0 0% 100%;
  --secondary: 150 15% 92%;
  --success: 142 70% 45%;
  --warning: 38 92% 50%;
  --destructive: 0 84% 60%;
  
  /* Sidebar - Dark Green #0F4F3A */
  --sidebar-background: 159 68% 18%;
  --sidebar-foreground: 0 0% 100%;
  
  /* Financial Colors */
  --income: 142 70% 40%;
  --expense: 0 75% 55%;
  --limit: 38 92% 50%;
}

.dark {
  /* Dark Mode */
  --background: 159 50% 8%;
  --foreground: 150 20% 95%;
  --card: 159 45% 12%;
  --primary: 91 72% 55%;
  /* ... */
}
```

### Cores da Marca
```javascript
brand: {
  green: "hsl(91 72% 62%)",      // #A6E35A
  dark: "hsl(159 68% 18%)",       // #0F4F3A
  secondary: "hsl(157 55% 27%)",  // #1F6A52
  soft: "hsl(150 30% 56%)",       // #6FAF8F
  gradient: "hsl(159 46% 34%)",   // #2E7F63
}
```

### Fonte
```css
font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
```

---

## 🔑 SECRETS E CHAVES

### Secrets Configurados (NÃO INCLUIR VALORES!)
| Nome do Secret | Descrição |
|---------------|-----------|
| `EVOLUTION_API_KEY` | Chave da API Evolution |
| `EVOLUTION_API_URL` | URL da API Evolution |
| `EVOLUTION_INSTANCE` | Nome da instância Evolution |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase |
| `SUPABASE_DB_URL` | URL do banco de dados |
| `SUPABASE_PUBLISHABLE_KEY` | Chave pública do Supabase |
| `WEBHOOK_SECRET` | Secret para validação de webhooks |

⚠️ **IMPORTANTE:** Os valores dos secrets devem ser configurados manualmente após a restauração.

---

## 📖 INSTRUÇÕES DE RESTAURAÇÃO

### Passo 1: Criar Novo Projeto
1. Acesse o Lovable e crie um novo projeto
2. Ative o Lovable Cloud (Supabase integrado)

### Passo 2: Restaurar Banco de Dados
1. Execute o arquivo `database-export.sql` para restaurar os dados
2. Crie as tabelas na ordem correta (plans → profiles → categories → transactions)
3. Configure as RLS policies apropriadas

### Passo 3: Configurar Secrets
Configure os seguintes secrets no projeto:
- `EVOLUTION_API_KEY`
- `EVOLUTION_API_URL`
- `EVOLUTION_INSTANCE`

### Passo 4: Deploy das Edge Functions
As edge functions serão deployadas automaticamente ao criar os arquivos em `supabase/functions/`.

### Passo 5: Configurar Evolution API
1. Configure a instância do Evolution API
2. Adicione o webhook URL: `https://<project-id>.supabase.co/functions/v1/whatsapp-webhook`
3. Configure o header `apikey` com o valor do `EVOLUTION_API_KEY`

---

## 📊 DADOS EXPORTADOS

O arquivo `database-export.sql` contém todos os dados das seguintes tabelas:
- ✅ plans (3 registros)
- ✅ plan_limits (12 registros)
- ✅ profiles (4 registros)
- ✅ user_roles (4 registros)
- ✅ whatsapp_numbers (3 registros)
- ✅ bank_accounts (3 registros)
- ✅ credit_cards (6 registros)
- ✅ categories (44 registros)
- ✅ transactions (45 registros)
- ✅ couples (1 registro)
- ✅ couple_members (1 registro)
- ✅ couple_invites (1 registro)
- ⬜ installments (vazio)
- ⬜ card_payments (vazio)
- ⬜ couple_goals (vazio)
- ⬜ couple_budgets (vazio)

---

## 📞 SUPORTE

Para dúvidas sobre este backup ou restauração, consulte a documentação do Lovable ou entre em contato com o suporte.

---

**Gerado automaticamente pelo sistema Contaê**  
**© 2026 - IA Financeira via WhatsApp**
