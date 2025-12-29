-- Update the handle_new_user function to include phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile with phone
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
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