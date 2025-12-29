-- Criar enum para tipos de conta
CREATE TYPE public.account_type AS ENUM ('free', 'paid', 'couple');

-- Adicionar tipo de conta ao perfil
ALTER TABLE public.profiles 
ADD COLUMN account_type account_type NOT NULL DEFAULT 'free';

-- Criar tabela para números de WhatsApp
CREATE TABLE public.whatsapp_numbers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  phone text NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índice único para evitar duplicatas
CREATE UNIQUE INDEX idx_whatsapp_phone ON public.whatsapp_numbers(phone);
CREATE UNIQUE INDEX idx_whatsapp_user_primary ON public.whatsapp_numbers(user_id) WHERE is_primary = true;

-- Habilitar RLS
ALTER TABLE public.whatsapp_numbers ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own whatsapp numbers" 
ON public.whatsapp_numbers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own whatsapp numbers" 
ON public.whatsapp_numbers 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own whatsapp numbers" 
ON public.whatsapp_numbers 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own whatsapp numbers" 
ON public.whatsapp_numbers 
FOR DELETE 
USING (auth.uid() = user_id);

-- Função para validar limite de WhatsApps por tipo de conta
CREATE OR REPLACE FUNCTION public.validate_whatsapp_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_count integer;
  max_allowed integer;
  user_account_type account_type;
BEGIN
  -- Buscar tipo de conta do usuário
  SELECT account_type INTO user_account_type
  FROM public.profiles
  WHERE user_id = NEW.user_id;
  
  -- Definir limite baseado no tipo de conta
  CASE user_account_type
    WHEN 'free' THEN max_allowed := 1;
    WHEN 'paid' THEN max_allowed := 1;
    WHEN 'couple' THEN max_allowed := 2;
    ELSE max_allowed := 1;
  END CASE;
  
  -- Contar WhatsApps atuais
  SELECT COUNT(*) INTO current_count
  FROM public.whatsapp_numbers
  WHERE user_id = NEW.user_id;
  
  -- Validar limite
  IF current_count >= max_allowed THEN
    RAISE EXCEPTION 'Limite de WhatsApps atingido para seu tipo de conta (máximo: %)', max_allowed;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para validar antes de inserir
CREATE TRIGGER check_whatsapp_limit
BEFORE INSERT ON public.whatsapp_numbers
FOR EACH ROW
EXECUTE FUNCTION public.validate_whatsapp_limit();

-- Migrar telefones existentes do profiles para whatsapp_numbers
INSERT INTO public.whatsapp_numbers (user_id, phone, is_primary)
SELECT user_id, phone, true
FROM public.profiles
WHERE phone IS NOT NULL AND phone != '';

-- Atualizar handle_new_user para inserir na nova tabela
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