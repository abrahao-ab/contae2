-- =============================================
-- SCRIPT DE EXPORTAÇÃO COMPLETA DO BANCO DE DADOS
-- IA Financeira via WhatsApp
-- Data: 2026-01-06
-- =============================================

-- =============================================
-- 1. PLANS (Planos)
-- =============================================
INSERT INTO plans (id, name, description, price, price_display, icon, popular, is_active, sort_order, features, created_at) VALUES
('free', 'Gratuito', 'Ideal para quem quer começar a se organizar sem compromisso', 0, 'R$ 0', 'zap', false, true, 1, '[{"included":true,"text":"Registro de gastos e receitas via WhatsApp"},{"included":true,"text":"Dashboard web (saldo, receitas, despesas)"},{"included":true,"text":"Categorias pré-estabelecidas (somente leitura)"},{"included":true,"text":"Até 10 compromissos ativos"},{"included":true,"text":"Até 10 lembretes ativos"},{"included":true,"text":"Resumo diário simples"},{"included":true,"text":"1 conta bancária"},{"included":true,"text":"1 cartão de crédito"},{"included":true,"text":"1 número de WhatsApp"},{"included":false,"text":"Personalização de categorias"},{"included":false,"text":"Relatórios detalhados"},{"included":false,"text":"Exportação de dados"},{"included":false,"text":"Alertas de gastos"},{"included":false,"text":"Metas financeiras"}]', '2025-12-29 20:10:25.549646+00'),
('paid', 'Premium', 'Controle completo financeiro e de rotina', 29.90, 'R$ 29,90/mês', 'crown', true, true, 2, '[{"highlight":true,"included":true,"text":"Tudo do Gratuito +"},{"included":true,"text":"Registro ilimitado de gastos e receitas"},{"included":true,"text":"Categorias ilimitadas e personalizáveis"},{"included":true,"text":"Dashboard completo de acompanhamento"},{"included":true,"text":"Relatórios mensais detalhados"},{"included":true,"text":"Exportação de relatórios (PDF/Excel)"},{"included":true,"text":"Resumo diário completo"},{"included":true,"text":"Compromissos e lembretes ilimitados"},{"included":true,"text":"Alertas inteligentes de gastos"},{"included":true,"text":"Histórico financeiro completo"},{"included":true,"text":"Contas bancárias ilimitadas"},{"included":true,"text":"Cartões de crédito ilimitados"},{"included":true,"text":"Conectar até 2 pessoas à conta"},{"included":true,"text":"Suporte prioritário via WhatsApp"}]', '2025-12-29 20:10:25.549646+00'),
('couple', 'Conta Casal', 'Organização financeira e de rotina compartilhada para casais', 49.90, 'R$ 49,90/mês', 'users', false, true, 3, '[{"highlight":true,"included":true,"text":"Tudo do Premium +"},{"included":true,"text":"2 números de WhatsApp vinculados"},{"included":true,"text":"Perfis individuais + painel conjunto"},{"included":true,"text":"Gastos individuais e compartilhados"},{"included":true,"text":"Categorias ilimitadas para o casal"},{"included":true,"text":"Compromissos e afazeres compartilhados"},{"included":true,"text":"Lembretes sincronizados entre o casal"},{"included":true,"text":"Resumo diário individual e do casal"},{"included":true,"text":"Relatórios individuais e consolidados"},{"included":true,"text":"Metas financeiras conjuntas"},{"included":true,"text":"Alertas quando gastos fogem do combinado"},{"included":true,"text":"Suporte prioritário"}]', '2025-12-29 20:10:25.549646+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 2. PLAN_LIMITS (Limites por Plano)
-- =============================================
-- Plano FREE
INSERT INTO plan_limits (id, plan_id, feature_key, limit_value, is_unlimited, created_at) VALUES
('f7fca732-5fac-4551-a5f5-6d4676b84799', 'free', 'bank_accounts', 1, false, '2025-12-29 20:10:25.549646+00'),
('eb4f971c-49fd-4cfa-9aa5-4b36c63dcff4', 'free', 'can_create_alerts', 0, false, '2025-12-29 20:10:25.549646+00'),
('41efb725-7757-45f1-b800-b0d639bdbd6a', 'free', 'can_create_goals', 0, false, '2025-12-29 20:10:25.549646+00'),
('af25efd2-a195-42bb-9218-78424d7b766f', 'free', 'can_create_reports', 0, false, '2025-12-29 20:10:25.549646+00'),
('11645ee3-d965-42be-9ec9-9aafb1b19358', 'free', 'can_customize_categories', 0, false, '2025-12-29 20:10:25.549646+00'),
('bd75d9eb-9b12-47a8-9150-f18272687c3a', 'free', 'can_export', 0, false, '2025-12-29 20:10:25.549646+00'),
('0db2af57-aae7-41c9-b96b-4c1d144434e5', 'free', 'categories', 0, false, '2025-12-29 20:10:25.549646+00'),
('364e8131-4e9e-469d-a1d8-e52a4f291e57', 'free', 'commitments', 10, false, '2025-12-29 20:10:25.549646+00'),
('2b549900-9fde-4175-9696-4534519fde96', 'free', 'connected_users', 1, false, '2025-12-29 20:10:25.549646+00'),
('707e60db-7e40-4abb-86a4-33d430529926', 'free', 'credit_cards', 1, false, '2025-12-29 20:10:25.549646+00'),
('ce9a2411-5c0d-4a0f-bcdf-170e23ddf27b', 'free', 'reminders', 10, false, '2025-12-29 20:10:25.549646+00'),
('285040d2-1cc8-4a33-b5d5-3ae41f3b1566', 'free', 'whatsapp_numbers', 1, false, '2025-12-29 20:10:25.549646+00'),
-- Plano PAID
('f3c8c1e8-3017-434e-ade2-e77051cbefc4', 'paid', 'bank_accounts', NULL, true, '2025-12-29 20:10:25.549646+00'),
('25063823-4d98-4726-8450-3c0f3b872370', 'paid', 'can_create_alerts', 1, false, '2025-12-29 20:10:25.549646+00'),
('2a2469c3-74dd-4179-b64b-aee56123b885', 'paid', 'can_create_goals', 1, false, '2025-12-29 20:10:25.549646+00'),
('2faa45f6-b419-44af-beb3-8a36e793fce7', 'paid', 'can_create_reports', 1, false, '2025-12-29 20:10:25.549646+00'),
('0a1b2c3d-4e5f-6789-abcd-ef0123456789', 'paid', 'can_customize_categories', 1, false, '2025-12-29 20:10:25.549646+00'),
('1a2b3c4d-5e6f-7890-abcd-ef1234567890', 'paid', 'can_export', 1, false, '2025-12-29 20:10:25.549646+00'),
('2a3b4c5d-6e7f-8901-abcd-ef2345678901', 'paid', 'categories', NULL, true, '2025-12-29 20:10:25.549646+00'),
('3a4b5c6d-7e8f-9012-abcd-ef3456789012', 'paid', 'commitments', NULL, true, '2025-12-29 20:10:25.549646+00'),
('4a5b6c7d-8e9f-0123-abcd-ef4567890123', 'paid', 'connected_users', 2, false, '2025-12-29 20:10:25.549646+00'),
('5a6b7c8d-9e0f-1234-abcd-ef5678901234', 'paid', 'credit_cards', NULL, true, '2025-12-29 20:10:25.549646+00'),
('6a7b8c9d-0e1f-2345-abcd-ef6789012345', 'paid', 'reminders', NULL, true, '2025-12-29 20:10:25.549646+00'),
('7a8b9c0d-1e2f-3456-abcd-ef7890123456', 'paid', 'whatsapp_numbers', 1, false, '2025-12-29 20:10:25.549646+00'),
-- Plano COUPLE
('c5f80a37-6b50-4733-a4ab-cdaea5cad373', 'couple', 'bank_accounts', NULL, true, '2025-12-29 20:10:25.549646+00'),
('ae5f5e0f-6cc8-4165-b2c2-21d2807bb31d', 'couple', 'can_create_alerts', 1, false, '2025-12-29 20:10:25.549646+00'),
('6f7133d1-5201-4c4a-90ce-86879e7caabe', 'couple', 'can_create_goals', 1, false, '2025-12-29 20:10:25.549646+00'),
('38e5fbf1-075d-45c2-b488-53adea2898b3', 'couple', 'can_create_reports', 1, false, '2025-12-29 20:10:25.549646+00'),
('10b1f5e5-926b-4974-83f1-f53b2eca4bba', 'couple', 'can_customize_categories', 1, false, '2025-12-29 20:10:25.549646+00'),
('65827645-8fa7-4ea1-a6f0-fd764f7ae9a5', 'couple', 'can_export', 1, false, '2025-12-29 20:10:25.549646+00'),
('bb25dbb7-896c-4603-a5a8-109c702ca2e6', 'couple', 'categories', NULL, true, '2025-12-29 20:10:25.549646+00'),
('c8a7b95f-1e86-48ba-b98a-c706e8badcc3', 'couple', 'commitments', NULL, true, '2025-12-29 20:10:25.549646+00'),
('2eab422a-59ef-4f1b-8c75-af4225b9c38b', 'couple', 'connected_users', 2, false, '2025-12-29 20:10:25.549646+00'),
('16aa1761-715b-4baf-bebd-6890f6a750fa', 'couple', 'credit_cards', NULL, true, '2025-12-29 20:10:25.549646+00'),
('ad8ce431-3203-444b-a073-a730be7d3797', 'couple', 'has_shared_goals', 1, false, '2025-12-29 20:10:25.549646+00'),
('bad093b9-497f-4670-8336-6c4b5c29f75c', 'couple', 'has_shared_view', 1, false, '2025-12-29 20:10:25.549646+00'),
('676ee299-08cc-4d23-9b4c-636c7a2a9203', 'couple', 'reminders', NULL, true, '2025-12-29 20:10:25.549646+00'),
('04c18e5d-b2aa-49d4-9ada-123f32e0491f', 'couple', 'whatsapp_numbers', 2, false, '2025-12-29 20:10:25.549646+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 3. PROFILES (Perfis de Usuários)
-- Nota: user_id deve existir em auth.users
-- =============================================
INSERT INTO profiles (id, user_id, full_name, phone, account_type, created_at, updated_at) VALUES
('bdfc2491-7ac5-433d-9a0a-c49a77a92be1', 'fa658b4c-bda1-4960-8bc1-525ab7e29fc8', 'Abrahão Albuquerque', NULL, 'free', '2025-12-29 13:44:18.114668+00', '2025-12-29 13:44:18.114668+00'),
('873a8c75-7a08-4fd4-9e30-5a0b56129003', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Byanca Carneiro Medeiros', NULL, 'free', '2025-12-29 18:55:15.423253+00', '2025-12-29 18:55:15.423253+00'),
('cf555fdf-a297-44d1-a0b7-c0d09dc9d8bc', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Emanoel Barros', NULL, 'couple', '2025-12-29 14:22:38.005908+00', '2025-12-29 20:31:11.636868+00'),
('6c697aa3-209b-4651-b44a-9feb6a88ea9a', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'David Lucas Viana da Silva', NULL, 'couple', '2026-01-04 13:43:34.804188+00', '2026-01-04 14:15:15.1872+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 4. USER_ROLES (Roles dos Usuários)
-- =============================================
INSERT INTO user_roles (id, user_id, role, created_at) VALUES
('608e0e45-3039-4fe1-8e4f-fc37e6195357', 'fa658b4c-bda1-4960-8bc1-525ab7e29fc8', 'user', '2025-12-29 13:44:18.114668+00'),
('0c9673f0-1f34-4a13-9f10-368770f6f40b', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'user', '2025-12-29 14:22:38.005908+00'),
('422ea671-8b74-4311-9a67-7a69d024c13c', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'user', '2025-12-29 18:55:15.423253+00'),
('884be143-0303-46cb-a713-4ba576231acd', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'user', '2026-01-04 13:43:34.804188+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 5. WHATSAPP_NUMBERS (Números de WhatsApp)
-- =============================================
INSERT INTO whatsapp_numbers (id, user_id, phone, is_primary, created_at) VALUES
('504c492e-80b8-4f28-960b-719bc70396d7', '03ce8e52-10f2-426e-a062-407bc150e9e2', '+558596641848', true, '2025-12-31 16:41:44.796279+00'),
('814195a9-74d3-4be2-a067-dc65ccd13366', 'c3367a7c-6bb7-4c0e-8741-494636269af6', '+558589032454', true, '2026-01-04 13:43:31.230977+00'),
('9774b52b-bb39-48f3-8776-1ce4a237812f', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', '+558587308757', true, '2026-01-04 14:13:52.621226+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 6. BANK_ACCOUNTS (Contas Bancárias)
-- =============================================
INSERT INTO bank_accounts (id, user_id, name, bank_name, icon, color, created_at) VALUES
('68cc1ed8-5df1-4efe-8c79-2ba8f97c2e8e', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Conta Corrente Byanca', 'Inter', 'banknote', '#f97316', '2025-12-29 19:02:53.691518+00'),
('a8b10121-a12c-48d8-84dc-59ed6fc77dc5', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Conta Corrente Inter', 'Inter', 'wallet', '#f97316', '2025-12-29 19:26:29.357329+00'),
('f663e2ce-93eb-487b-8460-ee12fb8aa19b', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'Inter Empresas', 'Inter', 'building-2', '#f59e0b', '2026-01-04 13:57:24.646019+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 7. CREDIT_CARDS (Cartões de Crédito)
-- =============================================
INSERT INTO credit_cards (id, user_id, name, bank_name, credit_limit, current_balance, closing_day, due_day, last_four_digits, color, is_active, created_at, updated_at) VALUES
('36283dc8-adf2-4370-93c1-214a1911283c', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Inter Abrahão', 'Inter', 4000.00, 200.00, 6, 12, NULL, '#f97316', true, '2025-12-29 19:25:27.334968+00', '2025-12-29 19:59:44.272043+00'),
('b09e2fc6-6f21-44a0-b1c7-d5aaeccd108f', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Inter Byanca', 'Inter', 4000.00, 0.00, 6, 12, NULL, '#f97316', true, '2025-12-29 19:00:27.423481+00', '2025-12-29 22:07:36.763129+00'),
('ef24a5c4-53cd-411c-910a-433e41925642', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Cartão Nubank', 'Nubank', 2000.00, 0.00, NULL, NULL, NULL, '#8B5CF6', true, '2026-01-03 21:10:23.950011+00', '2026-01-03 21:10:23.950011+00'),
('a5d5c974-65c6-442b-8916-ca33c5a5b7cd', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'Nubank', 'Nubank', 5100.00, 0.00, 4, 9, '1259', '#8b5cf6', true, '2026-01-05 02:24:07.257829+00', '2026-01-05 02:24:07.257829+00'),
('1b4722ae-d755-4f07-8ba2-46923a48453a', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'Inter', 'Inter', 3920.00, 0.00, 19, 25, '6806', '#f59e0b', true, '2026-01-05 02:25:03.054749+00', '2026-01-05 02:25:03.054749+00'),
('abae017f-5219-4c77-ac56-b103bd4929e4', 'dccd54cf-27c9-4620-aa4b-16816a19ea75', 'Pan', 'Pan', 1100.00, 0.00, 22, 28, '7325', '#3b82f6', true, '2026-01-05 02:26:25.907691+00', '2026-01-05 02:26:25.907691+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 8. COUPLES (Casais)
-- =============================================
INSERT INTO couples (id, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', '2025-12-29 22:03:49.794851+00', '2025-12-29 22:03:49.794851+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 9. COUPLE_MEMBERS (Membros do Casal)
-- =============================================
INSERT INTO couple_members (id, couple_id, user_id, nickname, avatar_color, is_owner, joined_at) VALUES
('e0800154-6b91-48ef-a5e3-7e56ec93065c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Emanoel', '#3b82f6', true, '2025-12-29 22:04:18.568751+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 10. COUPLE_INVITES (Convites de Casal)
-- =============================================
INSERT INTO couple_invites (id, couple_id, inviter_id, invitee_phone, status, created_at, expires_at) VALUES
('e2a4f1eb-7aec-4884-b527-b37f5f5576cd', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '03ce8e52-10f2-426e-a062-407bc150e9e2', '85989032454', 'pending', '2025-12-29 22:06:11.204109+00', '2026-01-05 22:06:11.204109+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 11. COUPLE_GOALS (Metas do Casal)
-- Tabela vazia - estrutura para referência
-- =============================================
-- INSERT INTO couple_goals (id, couple_id, name, target_amount, current_amount, deadline, icon, color, is_completed, created_at, updated_at) VALUES
-- ('uuid', 'couple_uuid', 'Nome da Meta', 1000.00, 0.00, '2026-12-31', 'target', '#22c55e', false, now(), now());

-- =============================================
-- 12. COUPLE_BUDGETS (Orçamentos do Casal)
-- Tabela vazia - estrutura para referência
-- =============================================
-- INSERT INTO couple_budgets (id, couple_id, category_id, monthly_limit, alert_threshold, created_at, updated_at) VALUES
-- ('uuid', 'couple_uuid', 'category_uuid', 500.00, 80, now(), now());

-- =============================================
-- 13. CATEGORIES (Categorias)
-- =============================================
-- Categorias do usuário: 03ce8e52-10f2-426e-a062-407bc150e9e2 (Emanoel)
INSERT INTO categories (id, user_id, name, icon, color, is_default, is_shared, couple_id, created_at) VALUES
('c82c890f-c169-435c-9521-5e8c0e080dce', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Alimentação', 'utensils', '#22c55e', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('5060c44f-3b6a-4584-9c3c-48a7c9e0ebb0', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Compras', 'shopping-bag', '#ec4899', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('c99a6ac9-5997-40c4-add9-3b3876637c56', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Educação', 'graduation-cap', '#06b6d4', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('03be9447-ec35-4a91-bd3b-193feb6531d6', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Investimentos', 'trending-up', '#6366f1', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('9399dcac-c1d1-4ee8-a31a-48ec359ef26d', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Lazer', 'gamepad-2', '#f59e0b', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('2074852e-f136-4e05-8f5d-dd5662c912b0', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Moradia', 'home', '#8b5cf6', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('cb36f8d5-3f1e-4db8-9392-577e5ae1a4c0', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Outros', 'circle-dot', '#94a3b8', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('0c685bc2-ba01-4c1b-9aa4-ed5afb79c4d3', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Salário', 'wallet', '#10b981', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('de34c1d5-f646-42b1-86e6-53fe9138aca9', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Saúde', 'heart-pulse', '#ef4444', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('ac1e2a39-b17f-4aee-b09a-2db9fe03d63b', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Serviços', 'wrench', '#64748b', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('c1da7a25-b891-420b-ad3c-10eb54588752', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Transporte', 'car', '#3b82f6', true, false, NULL, '2025-12-29 14:22:38.005908+00'),
('b505743f-3a3a-456c-bafd-7d672829cc68', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'Passeios', 'luggage', '#90EE90', false, false, NULL, '2026-01-03 19:32:14.863326+00'),
-- Categorias do usuário: c3367a7c-6bb7-4c0e-8741-494636269af6 (Byanca)
('1c6d2db8-c13a-4a26-91da-b26e2cce7a9d', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Alimentação', 'utensils', '#22c55e', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('9f32720d-de57-4226-aeb3-5399f394e34a', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Compras', 'shopping-bag', '#ec4899', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('465aeb5d-11b7-408e-98db-35cb4de3b7e6', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Educação', 'graduation-cap', '#06b6d4', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('36afa932-ceac-4da9-9224-88ac6487e069', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Investimentos', 'trending-up', '#6366f1', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('54da7642-44db-41c8-b3ed-046cc449654d', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Lazer', 'gamepad-2', '#f59e0b', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('26a657ab-dc27-4d7b-bb7b-a5be74b84138', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Moradia', 'home', '#8b5cf6', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('620d0f63-a985-4e1c-a3f8-05e192c65bda', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Outros', 'circle-dot', '#94a3b8', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('b2a5d44c-35fb-4f2e-8fd4-9f0948fce342', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Salário', 'wallet', '#10b981', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('80c435ea-0f2e-4a88-acd7-239b31ee1ee1', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Saúde', 'heart-pulse', '#ef4444', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('2b4ec098-bffc-4f90-afe1-cdec880aedf9', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Serviços', 'wrench', '#64748b', true, false, NULL, '2025-12-29 18:55:15.423253+00'),
('b8b09e51-2a41-42aa-a6b3-f8ab2d9f21e5', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'Transporte', 'car', '#3b82f6', true, false, NULL, '2025-12-29 18:55:15.423253+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 14. TRANSACTIONS (Transações)
-- =============================================
INSERT INTO transactions (id, user_id, type, amount, description, date, category_id, bank_account_id, credit_card_id, is_installment, current_installment, total_installments, parent_transaction_id, purchase_date, is_recurring, source, owner_type, couple_id, created_at, updated_at) VALUES
-- Transações parceladas (Compras 4x)
('3ea9b933-e6ab-4102-bc63-f9aa95108042', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'expense', 50.00, 'Compras (1/4)', '2026-01-10', '5060c44f-3b6a-4584-9c3c-48a7c9e0ebb0', NULL, '36283dc8-adf2-4370-93c1-214a1911283c', true, 1, 4, '3ea9b933-e6ab-4102-bc63-f9aa95108042', '2025-12-29', false, 'web', 'individual', NULL, '2025-12-29 19:59:42.820195+00', '2025-12-29 19:59:43.323577+00'),
('3e0eeee1-11fe-455f-b5b9-39b27aa39f92', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'expense', 50.00, 'Compras (2/4)', '2026-02-10', '5060c44f-3b6a-4584-9c3c-48a7c9e0ebb0', NULL, '36283dc8-adf2-4370-93c1-214a1911283c', true, 2, 4, '3ea9b933-e6ab-4102-bc63-f9aa95108042', '2025-12-29', false, 'web', 'individual', NULL, '2025-12-29 19:59:43.754452+00', '2025-12-29 19:59:43.754452+00'),
('f37eca3d-cb04-48b9-b6ab-654e8b4ab334', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'expense', 50.00, 'Compras (3/4)', '2026-03-10', '5060c44f-3b6a-4584-9c3c-48a7c9e0ebb0', NULL, '36283dc8-adf2-4370-93c1-214a1911283c', true, 3, 4, '3ea9b933-e6ab-4102-bc63-f9aa95108042', '2025-12-29', false, 'web', 'individual', NULL, '2025-12-29 19:59:43.754452+00', '2025-12-29 19:59:43.754452+00'),
('777c5cb0-da36-41ca-8ed4-ade6861c0795', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'expense', 50.00, 'Compras (4/4)', '2026-04-10', '5060c44f-3b6a-4584-9c3c-48a7c9e0ebb0', NULL, '36283dc8-adf2-4370-93c1-214a1911283c', true, 4, 4, '3ea9b933-e6ab-4102-bc63-f9aa95108042', '2025-12-29', false, 'web', 'individual', NULL, '2025-12-29 19:59:43.754452+00', '2025-12-29 19:59:43.754452+00'),
-- Transações via WhatsApp
('df0b4fed-9949-41bc-992d-8469ee769d93', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'expense', 18.00, 'Almoço', '2026-01-05', 'c82c890f-c169-435c-9521-5e8c0e080dce', NULL, NULL, false, NULL, NULL, NULL, NULL, false, 'whatsapp_text', 'individual', NULL, '2026-01-05 15:02:48.059914+00', '2026-01-05 15:02:48.059914+00'),
('ce5d0a02-3cc5-424e-aa0c-7f8792f54498', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'income', 500.00, 'Serviço de site - Fine Wolf', '2026-01-05', 'ac1e2a39-b17f-4aee-b09a-2db9fe03d63b', NULL, NULL, false, NULL, NULL, NULL, NULL, false, 'whatsapp_text', 'individual', NULL, '2026-01-02 18:11:41.155546+00', '2026-01-02 18:11:41.155546+00'),
('85ce73b1-47d5-4e4c-a12e-c1f351892310', '03ce8e52-10f2-426e-a062-407bc150e9e2', 'income', 300.00, 'Serviço de aulas particulares', '2026-01-04', NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, false, 'whatsapp_text', 'individual', NULL, '2026-01-04 09:35:09.378269+00', '2026-01-04 09:35:09.378269+00'),
('7ca4e389-f973-4fa9-a619-5f94fba3d73c', 'c3367a7c-6bb7-4c0e-8741-494636269af6', 'expense', 19.50, 'Macaxeira na praia', '2026-01-04', '1c6d2db8-c13a-4a26-91da-b26e2cce7a9d', NULL, NULL, false, NULL, NULL, NULL, NULL, false, 'whatsapp_text', 'individual', NULL, '2026-01-04 13:44:09.634464+00', '2026-01-04 13:44:09.634464+00')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- 15. INSTALLMENTS (Parcelas)
-- Tabela vazia - estrutura para referência
-- =============================================
-- INSERT INTO installments (id, transaction_id, installment_number, amount, due_date, status, paid_at, created_at) VALUES
-- ('uuid', 'transaction_uuid', 1, 100.00, '2026-02-01', 'pending', NULL, now());

-- =============================================
-- 16. CARD_PAYMENTS (Pagamentos de Cartão)
-- Tabela vazia - estrutura para referência
-- =============================================
-- INSERT INTO card_payments (id, user_id, credit_card_id, bank_account_id, amount, payment_date, is_full_payment, transaction_id, created_at) VALUES
-- ('uuid', 'user_uuid', 'card_uuid', 'account_uuid', 500.00, '2026-01-15', true, NULL, now());

-- =============================================
-- FIM DO SCRIPT DE EXPORTAÇÃO
-- =============================================
