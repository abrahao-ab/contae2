# 📚 Documentação das Edge Functions - WhatsApp API

> Documentação completa das edge functions para integração via WhatsApp.

---

## 📋 Índice

1. [Autenticação e Usuários](#-autenticação-e-usuários)
   - [check-user](#check-user)
   - [create-user](#create-user)
   - [update-user](#update-user)
2. [Transações](#-transações)
   - [create-transaction](#create-transaction)
   - [list-transactions](#list-transactions)
   - [delete-transaction](#delete-transaction)
   - [get-summary](#get-summary)
3. [Categorias](#-categorias)
   - [create-category](#create-category)
   - [list-categories](#list-categories)
4. [Contas Bancárias](#-contas-bancárias)
   - [create-bank-account](#create-bank-account)
   - [list-bank-accounts](#list-bank-accounts)
5. [Cartões de Crédito](#-cartões-de-crédito)
   - [create-credit-card](#create-credit-card)
   - [list-credit-cards](#list-credit-cards)
   - [pay-card-invoice](#pay-card-invoice)
6. [WhatsApp](#-whatsapp)
   - [whatsapp-webhook](#whatsapp-webhook)
   - [send-whatsapp](#send-whatsapp)

---

## 🔐 Autenticação e Usuários

### check-user

Verifica se um usuário existe no sistema pelo número de telefone.

**Endpoint:** `GET /functions/v1/check-user`

**Parâmetros (Query):**

| Parâmetro | Tipo   | Obrigatório | Descrição                    |
|-----------|--------|-------------|------------------------------|
| phone     | string | ✅          | Número de telefone do usuário |

**Resposta de Sucesso (200):**
```json
{
  "exists": true,
  "user_id": "uuid",
  "full_name": "Nome do Usuário",
  "account_type": "free|paid|couple"
}
```

**Resposta - Usuário não encontrado (200):**
```json
{
  "exists": false
}
```

---

### create-user

Cria um novo usuário no sistema.

**Endpoint:** `POST /functions/v1/create-user`

**Body (JSON):**

| Campo     | Tipo   | Obrigatório | Descrição                    |
|-----------|--------|-------------|------------------------------|
| phone     | string | ✅          | Número de telefone           |
| full_name | string | ❌          | Nome completo do usuário     |
| email     | string | ❌          | Email do usuário             |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "message": "Usuário criado com sucesso"
}
```

**Erros:**
- `400` - Telefone é obrigatório
- `409` - Usuário já existe

---

### update-user

Atualiza os dados de um usuário existente.

**Endpoint:** `PUT /functions/v1/update-user`

**Body (JSON):**

| Campo     | Tipo   | Obrigatório | Descrição                    |
|-----------|--------|-------------|------------------------------|
| phone     | string | ✅          | Número de telefone           |
| full_name | string | ❌          | Novo nome completo           |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Usuário atualizado com sucesso"
}
```

---

## 💰 Transações

### create-transaction

Cria uma nova transação (receita ou despesa).

**Endpoint:** `POST /functions/v1/create-transaction`

**Body (JSON):**

| Campo            | Tipo    | Obrigatório | Descrição                                      |
|------------------|---------|-------------|------------------------------------------------|
| phone            | string  | ✅          | Número de telefone do usuário                  |
| amount           | number  | ✅          | Valor da transação                             |
| type             | string  | ✅          | Tipo: `income` ou `expense`                    |
| description      | string  | ❌          | Descrição da transação                         |
| category_id      | string  | ❌          | ID da categoria                                |
| category_name    | string  | ❌          | Nome da categoria (alternativa ao ID)          |
| bank_account_id  | string  | ❌          | ID da conta bancária                           |
| credit_card_id   | string  | ❌          | ID do cartão de crédito                        |
| date             | string  | ❌          | Data (YYYY-MM-DD), default: hoje               |
| is_installment   | boolean | ❌          | Se é parcelado                                 |
| total_installments | number | ❌        | Número total de parcelas                       |
| source           | string  | ❌          | Origem: `whatsapp_text`, `whatsapp_voice`, etc |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "message": "Transação criada com sucesso",
  "transaction": {
    "id": "uuid",
    "amount": 150.00,
    "type": "expense",
    "description": "Almoço",
    "category": "Alimentação",
    "date": "2024-01-15"
  }
}
```

**Erros:**
- `400` - Campos obrigatórios faltando
- `404` - Usuário não encontrado

---

### list-transactions

Lista as transações do usuário com filtros opcionais.

**Endpoint:** `GET /functions/v1/list-transactions`

**Parâmetros (Query):**

| Parâmetro   | Tipo   | Obrigatório | Descrição                          |
|-------------|--------|-------------|------------------------------------|
| phone       | string | ✅          | Número de telefone                 |
| start_date  | string | ❌          | Data inicial (YYYY-MM-DD)          |
| end_date    | string | ❌          | Data final (YYYY-MM-DD)            |
| type        | string | ❌          | Filtrar por `income` ou `expense`  |
| category_id | string | ❌          | Filtrar por categoria              |
| limit       | number | ❌          | Limite de resultados (default: 50) |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "transactions": [
    {
      "id": "uuid",
      "amount": 150.00,
      "type": "expense",
      "description": "Almoço",
      "date": "2024-01-15",
      "category": {
        "id": "uuid",
        "name": "Alimentação",
        "icon": "utensils",
        "color": "#22c55e"
      },
      "bank_account": null,
      "credit_card": null
    }
  ],
  "total": 25,
  "summary": {
    "total_income": 5000.00,
    "total_expense": 2500.00,
    "balance": 2500.00
  }
}
```

---

### delete-transaction

Exclui uma transação existente.

**Endpoint:** `DELETE /functions/v1/delete-transaction`

**Parâmetros (Query):**

| Parâmetro      | Tipo   | Obrigatório | Descrição                |
|----------------|--------|-------------|--------------------------|
| phone          | string | ✅          | Número de telefone       |
| transaction_id | string | ✅          | ID da transação a excluir |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message": "Transação excluída com sucesso"
}
```

**Erros:**
- `404` - Transação não encontrada
- `403` - Transação não pertence ao usuário

---

### get-summary

Obtém um resumo financeiro do usuário.

**Endpoint:** `GET /functions/v1/get-summary`

**Parâmetros (Query):**

| Parâmetro | Tipo   | Obrigatório | Descrição                     |
|-----------|--------|-------------|-------------------------------|
| phone     | string | ✅          | Número de telefone            |
| period    | string | ❌          | Período: `day`, `week`, `month`, `year` (default: `month`) |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "period": "month",
  "summary": {
    "total_income": 5000.00,
    "total_expense": 2500.00,
    "balance": 2500.00,
    "transaction_count": 45
  },
  "by_category": [
    {
      "category_id": "uuid",
      "category_name": "Alimentação",
      "total": 800.00,
      "percentage": 32
    }
  ],
  "comparison": {
    "previous_period_expense": 2200.00,
    "variation_percentage": 13.6
  }
}
```

---

## 📁 Categorias

### create-category

Cria uma nova categoria personalizada.

**Endpoint:** `POST /functions/v1/create-category`

**Body (JSON):**

| Campo | Tipo   | Obrigatório | Descrição                                   |
|-------|--------|-------------|---------------------------------------------|
| phone | string | ✅          | Número de telefone do usuário               |
| name  | string | ✅          | Nome da categoria                           |
| icon  | string | ❌          | Ícone (lucide icon name)                    |
| color | string | ❌          | Cor em hexadecimal (ex: #22c55e)            |

**Cores Padrão por Inicial:**
| Inicial | Cor       |
|---------|-----------|
| A-C     | #22c55e   |
| D-F     | #3b82f6   |
| G-I     | #8b5cf6   |
| J-L     | #f59e0b   |
| M-O     | #ef4444   |
| P-R     | #06b6d4   |
| S-U     | #ec4899   |
| V-Z     | #64748b   |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "category_id": "uuid",
  "message": "Categoria criada com sucesso",
  "category": {
    "id": "uuid",
    "name": "Viagens",
    "icon": "plane",
    "color": "#8b5cf6"
  }
}
```

**Erros:**
- `400` - Nome é obrigatório
- `403` - "Apenas contas Premium ou Casal podem criar categorias personalizadas" (usuários `free`)
- `409` - Categoria já existe (retorna a existente)

**⚠️ Regras de Negócio:**
- Apenas usuários com `account_type` = `paid` ou `couple` podem criar categorias
- Usuários `free` recebem erro 403
- Se a categoria já existir, retorna a existente com `already_exists: true`

---

### list-categories

Lista todas as categorias do usuário.

**Endpoint:** `GET /functions/v1/list-categories`

**Parâmetros (Query):**

| Parâmetro | Tipo   | Obrigatório | Descrição            |
|-----------|--------|-------------|----------------------|
| phone     | string | ✅          | Número de telefone   |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "categories": [
    {
      "id": "uuid",
      "name": "Alimentação",
      "icon": "utensils",
      "color": "#22c55e",
      "is_default": true
    },
    {
      "id": "uuid",
      "name": "Viagens",
      "icon": "plane",
      "color": "#8b5cf6",
      "is_default": false
    }
  ],
  "total": 12
}
```

---

## 🏦 Contas Bancárias

### create-bank-account

Cria uma nova conta bancária.

**Endpoint:** `POST /functions/v1/create-bank-account`

**Body (JSON):**

| Campo     | Tipo   | Obrigatório | Descrição                        |
|-----------|--------|-------------|----------------------------------|
| phone     | string | ✅          | Número de telefone do usuário    |
| name      | string | ✅          | Nome da conta (ex: "Conta Nubank") |
| bank_name | string | ❌          | Nome do banco                    |
| icon      | string | ❌          | Ícone (lucide icon name)         |
| color     | string | ❌          | Cor em hexadecimal               |

**Limites por Plano:**

| Plano  | Limite de Contas |
|--------|------------------|
| free   | 1                |
| paid   | Ilimitado        |
| couple | Ilimitado        |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "account_id": "uuid",
  "message": "Conta bancária criada com sucesso",
  "account": {
    "id": "uuid",
    "name": "Conta Nubank",
    "bank_name": "Nubank",
    "icon": "landmark",
    "color": "#8b5cf6"
  }
}
```

**Erros:**
- `400` - Nome é obrigatório
- `403` - "Limite de contas bancárias atingido. Faça upgrade para criar mais contas."
- `409` - Conta já existe (retorna a existente)

---

### list-bank-accounts

Lista todas as contas bancárias do usuário.

**Endpoint:** `GET /functions/v1/list-bank-accounts`

**Parâmetros (Query):**

| Parâmetro | Tipo   | Obrigatório | Descrição            |
|-----------|--------|-------------|----------------------|
| phone     | string | ✅          | Número de telefone   |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "accounts": [
    {
      "id": "uuid",
      "name": "Conta Nubank",
      "bank_name": "Nubank",
      "icon": "landmark",
      "color": "#8b5cf6",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 2,
  "limit_info": {
    "current": 2,
    "limit": null,
    "is_unlimited": true,
    "can_create_more": true
  }
}
```

---

## 💳 Cartões de Crédito

### create-credit-card

Cria um novo cartão de crédito.

**Endpoint:** `POST /functions/v1/create-credit-card`

**Body (JSON):**

| Campo            | Tipo   | Obrigatório | Descrição                          |
|------------------|--------|-------------|------------------------------------|
| phone            | string | ✅          | Número de telefone do usuário      |
| bank             | string | ✅          | Nome do banco/bandeira             |
| name             | string | ❌          | Nome personalizado do cartão       |
| limit            | number | ❌          | Limite de crédito                  |
| closing_day      | number | ❌          | Dia de fechamento (1-31)           |
| due_day          | number | ❌          | Dia de vencimento (1-31)           |
| last_four_digits | string | ❌          | Últimos 4 dígitos do cartão        |

**Cores por Banco:**

| Banco       | Cor       |
|-------------|-----------|
| Nubank      | #8B5CF6   |
| Inter       | #F97316   |
| Itaú        | #F97316   |
| Bradesco    | #EF4444   |
| Santander   | #EF4444   |
| Caixa       | #3B82F6   |
| BB          | #FBBF24   |
| C6 Bank     | #1F2937   |
| PicPay      | #22C55E   |
| PagBank     | #22C55E   |
| Next        | #22C55E   |
| Neon        | #06B6D4   |
| Original    | #22C55E   |
| Sicoob      | #22C55E   |
| Sicredi     | #22C55E   |
| XP          | #1F2937   |
| BTG         | #1F2937   |
| Outro       | #6B7280   |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "card_id": "uuid",
  "message": "Cartão de crédito criado com sucesso",
  "card": {
    "id": "uuid",
    "name": "Nubank Platinum",
    "bank_name": "Nubank",
    "credit_limit": 5000.00,
    "color": "#8B5CF6",
    "closing_day": 15,
    "due_day": 22
  }
}
```

---

### list-credit-cards

Lista todos os cartões de crédito ativos do usuário.

**Endpoint:** `GET /functions/v1/list-credit-cards`

**Parâmetros (Query):**

| Parâmetro | Tipo   | Obrigatório | Descrição            |
|-----------|--------|-------------|----------------------|
| phone     | string | ✅          | Número de telefone   |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "user_id": "uuid",
  "cards": [
    {
      "id": "uuid",
      "name": "Nubank Platinum",
      "bank_name": "Nubank",
      "last_four_digits": "1234",
      "credit_limit": 5000.00,
      "current_balance": 1500.00,
      "available_credit": 3500.00,
      "usage_percentage": 30,
      "closing_day": 15,
      "due_day": 22,
      "color": "#8B5CF6",
      "is_active": true,
      "created_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 2,
  "totals": {
    "total_limit": 10000.00,
    "total_balance": 3000.00,
    "total_available": 7000.00
  },
  "limit_info": {
    "current": 2,
    "limit": null,
    "is_unlimited": true,
    "can_create_more": true
  }
}
```

---

### pay-card-invoice

Registra o pagamento da fatura de um cartão de crédito.

**Endpoint:** `POST /functions/v1/pay-card-invoice`

**Body (JSON):**

| Campo           | Tipo    | Obrigatório | Descrição                              |
|-----------------|---------|-------------|----------------------------------------|
| phone           | string  | ✅          | Número de telefone do usuário          |
| credit_card_id  | string  | ✅          | ID do cartão de crédito                |
| amount          | number  | ✅          | Valor do pagamento                     |
| bank_account_id | string  | ❌          | ID da conta bancária usada             |
| is_full_payment | boolean | ❌          | Se é pagamento integral (default: true) |
| payment_date    | string  | ❌          | Data do pagamento (YYYY-MM-DD)         |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "payment_id": "uuid",
  "message": "Pagamento registrado com sucesso",
  "payment": {
    "id": "uuid",
    "amount": 1500.00,
    "is_full_payment": true,
    "payment_date": "2024-01-22"
  },
  "card_updated": {
    "previous_balance": 1500.00,
    "new_balance": 0.00,
    "available_credit": 5000.00
  }
}
```

---

## 📱 WhatsApp

### whatsapp-webhook

Webhook que recebe mensagens do WhatsApp (Evolution API).

**Endpoint:** `POST /functions/v1/whatsapp-webhook`

**Descrição:**
Este endpoint recebe todas as mensagens do WhatsApp e as processa de acordo com o tipo:
- Mensagens de texto
- Mensagens de áudio (transcrição via IA)
- Imagens (análise via IA)

**Headers:**

| Header        | Tipo   | Obrigatório | Descrição                    |
|---------------|--------|-------------|------------------------------|
| Authorization | string | ❌          | Token de webhook (opcional)  |

**Body (JSON - Evolution API format):**
```json
{
  "event": "messages.upsert",
  "instance": "instance_name",
  "data": {
    "key": {
      "remoteJid": "5511999999999@s.whatsapp.net",
      "fromMe": false
    },
    "message": {
      "conversation": "Gastei 50 reais no almoço"
    }
  }
}
```

**Processamento:**
1. Identifica o usuário pelo telefone
2. Processa a mensagem com IA para extrair intenção
3. Executa a ação correspondente (criar transação, listar, etc)
4. Envia resposta via WhatsApp

---

### send-whatsapp

Envia uma mensagem via WhatsApp.

**Endpoint:** `POST /functions/v1/send-whatsapp`

**Body (JSON):**

| Campo   | Tipo   | Obrigatório | Descrição                    |
|---------|--------|-------------|------------------------------|
| phone   | string | ✅          | Número de telefone destino   |
| message | string | ✅          | Mensagem a ser enviada       |

**Resposta de Sucesso (200):**
```json
{
  "success": true,
  "message_id": "uuid"
}
```

---

## 🔧 Normalização de Telefone

Todas as edge functions utilizam a mesma lógica de normalização:

```typescript
function normalizePhone(phone: string): string {
  let normalized = phone.replace(/[^\d+]/g, '')
  if (!normalized.startsWith('+')) {
    if (normalized.startsWith('55')) {
      normalized = '+' + normalized
    } else {
      normalized = '+55' + normalized
    }
  }
  return normalized
}
```

**Exemplos:**
| Entrada           | Saída            |
|-------------------|------------------|
| (11) 99999-9999   | +5511999999999   |
| 11999999999       | +5511999999999   |
| 5511999999999     | +5511999999999   |
| +5511999999999    | +5511999999999   |

---

## 📊 Tipos de Conta

| Tipo    | Descrição                           |
|---------|-------------------------------------|
| free    | Conta gratuita com limitações       |
| paid    | Conta premium com recursos extras   |
| couple  | Conta compartilhada para casais     |

---

## ⚠️ Códigos de Erro Comuns

| Código | Descrição                                    |
|--------|----------------------------------------------|
| 400    | Parâmetros obrigatórios faltando             |
| 403    | Sem permissão (limite de plano atingido)     |
| 404    | Recurso não encontrado (usuário, transação)  |
| 409    | Conflito (recurso já existe)                 |
| 500    | Erro interno do servidor                     |

---

## 🔗 Base URL

```
https://eiezckbfjwmrluloxusv.supabase.co/functions/v1/
```

---

## 📝 Notas

1. Todas as requisições devem incluir o header `Content-Type: application/json`
2. Os endpoints não requerem autenticação JWT (`verify_jwt = false`)
3. A autenticação é feita através do número de telefone do usuário
4. Datas devem estar no formato `YYYY-MM-DD`
5. Valores monetários são números decimais (não centavos)
