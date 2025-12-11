# 💳 Integração AbacatePay - GymRats

## 📋 Visão Geral

O GymRats utiliza a **AbacatePay** como gateway de pagamento para processar assinaturas de alunos e academias.

A AbacatePay oferece:

- ✅ Pagamentos via **PIX** e **Cartão**
- ✅ API simples e intuitiva
- ✅ Modo de desenvolvimento para testes
- ✅ Webhooks para notificações
- ✅ Suporte a cobranças recorrentes

**Documentação oficial:** [https://docs.abacatepay.com](https://docs.abacatepay.com)

---

## 🔧 Configuração

### Variáveis de Ambiente

Adicione no seu `.env`:

```env
# AbacatePay
ABACATEPAY_API_TOKEN=seu_token_aqui
NEXT_PUBLIC_APP_URL=https://gym-rats-testes.vercel.app
```

### Modo Desenvolvimento

No **dev mode**, todas as operações são simuladas:

- ✅ Pagamentos podem ser simulados
- ✅ Não há cobranças reais
- ✅ Ideal para testes e desenvolvimento

Para ativar o modo produção, desative o dev mode no dashboard da AbacatePay.

---

## 📚 Estrutura da Integração

### Cliente da API

O cliente está localizado em: `lib/api/abacatepay.ts`

```typescript
import { abacatePay } from "@/lib/api/abacatepay";

// Criar cliente
const customer = await abacatePay.createCustomer({
  name: "João Silva",
  email: "[email protected]",
  cellphone: "(11) 99999-9999",
  taxId: "123.456.789-00",
});

// Criar cobrança
const billing = await abacatePay.createBilling({
  frequency: "MULTIPLE_PAYMENTS",
  methods: ["PIX", "CARD"],
  products: [
    {
      externalId: "prod-123",
      name: "Assinatura Premium",
      description: "Acesso completo por 1 mês",
      quantity: 1,
      price: 2990, // R$ 29,90 em centavos
    },
  ],
  returnUrl: "https://gym-rats-testes.vercel.app/payments?canceled=true",
  completionUrl: "https://gym-rats-testes.vercel.app/payments?success=true",
  customerId: customer.data?.id,
});
```

---

## 💰 Fluxos de Pagamento

### 1. Assinatura de Aluno (Premium)

#### Fluxo Completo:

```typescript
// 1. Criar ou buscar cliente na AbacatePay
const customer = await abacatePay.createCustomer({
  name: student.user.name,
  email: student.user.email,
  cellphone: student.phone,
  taxId: student.cpf, // Coletar durante onboarding
});

// 2. Criar cobrança recorrente
const billing = await abacatePay.createBilling({
  frequency: "MULTIPLE_PAYMENTS", // Mensal
  methods: ["PIX", "CARD"],
  products: [
    {
      externalId: `subscription-monthly-${studentId}`,
      name: "GymRats Premium - Mensal",
      description: "Assinatura Premium por 1 mês",
      quantity: 1,
      price: 2990, // R$ 29,90
    },
  ],
  returnUrl: `${APP_URL}/student/payments?canceled=true`,
  completionUrl: `${APP_URL}/student/payments?success=true`,
  customerId: customer.data?.id,
});

// 3. Salvar no banco
await db.subscription.create({
  data: {
    studentId,
    plan: "premium",
    status: "pending",
    abacatePayBillingId: billing.data?.id,
    abacatePayCustomerId: customer.data?.id,
    currentPeriodStart: new Date(),
    currentPeriodEnd: addMonths(new Date(), 1),
  },
});

// 4. Redirecionar para URL de pagamento
redirect(billing.data?.url);
```

#### Para Plano Anual:

```typescript
const billing = await abacatePay.createBilling({
  frequency: "ONE_TIME", // Pagamento único
  methods: ["PIX", "CARD"],
  products: [
    {
      externalId: `subscription-annual-${studentId}`,
      name: "GymRats Premium - Anual",
      description: "Assinatura Premium por 12 meses",
      quantity: 1,
      price: 29900, // R$ 299,00
    },
  ],
  // ... resto igual
});
```

---

### 2. Assinatura de Academia

#### Fluxo Completo:

```typescript
// 1. Calcular valor (fixo + variável)
const planPrices = {
  basic: { base: 19900, perStudent: 200 },
  premium: { base: 39900, perStudent: 150 },
  enterprise: { base: 79900, perStudent: 100 },
};

const prices = planPrices[plan];
const totalAmount = prices.base + prices.perStudent * studentCount;

// 2. Criar cobrança
const billing = await abacatePay.createBilling({
  frequency: "MULTIPLE_PAYMENTS",
  methods: ["PIX", "CARD"],
  products: [
    {
      externalId: `gym-subscription-${plan}-${gymId}`,
      name: `GymRats Academia - ${plan}`,
      description: `Assinatura ${plan} para ${studentCount} alunos`,
      quantity: 1,
      price: totalAmount,
    },
  ],
  returnUrl: `${APP_URL}/gym/settings?canceled=true`,
  completionUrl: `${APP_URL}/gym/settings?success=true`,
  customerId: gymCustomerId,
});

// 3. Salvar no banco
await db.gymSubscription.create({
  data: {
    gymId,
    plan,
    status: "pending",
    basePrice: prices.base / 100,
    pricePerStudent: prices.perStudent / 100,
    abacatePayBillingId: billing.data?.id,
    abacatePayCustomerId: gymCustomerId,
    currentPeriodStart: new Date(),
    currentPeriodEnd: addMonths(new Date(), 1),
  },
});
```

---

### 3. Pagamento via PIX

Para pagamentos únicos ou quando o usuário preferir PIX:

```typescript
// Criar QR Code PIX
const pixQrCode = await abacatePay.createPixQrCode({
  amount: 2990, // R$ 29,90
  expiresIn: 3600, // 1 hora
  description: "Assinatura Premium GymRats",
  customer: {
    name: student.user.name,
    email: student.user.email,
    cellphone: student.phone,
    taxId: student.cpf,
  },
  metadata: {
    subscriptionId: subscription.id,
    studentId: student.id,
  },
});

// Exibir QR Code para o usuário
// pixQrCode.data?.brCodeBase64 - Imagem do QR Code
// pixQrCode.data?.brCode - Código PIX copiável

// Verificar status periodicamente
const status = await abacatePay.checkPixQrCodeStatus(pixQrCode.data?.id);
// status.data?.status pode ser: "PENDING", "PAID", "EXPIRED"
```

---

## 🔔 Webhooks

### Configuração

Configure os webhooks no dashboard da AbacatePay para receber notificações:

- `billing.paid` - Cobrança paga
- `billing.expired` - Cobrança expirada
- `pix.paid` - PIX pago
- `pix.expired` - PIX expirado

### Endpoint de Webhook

Crie em: `app/api/webhooks/abacatepay/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    // Validar assinatura do webhook (importante!)
    // const signature = request.headers.get("x-abacatepay-signature");
    // if (!validateSignature(signature, body)) {
    //   return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    // }

    switch (event) {
      case "billing.paid":
        await handleBillingPaid(data);
        break;

      case "billing.expired":
        await handleBillingExpired(data);
        break;

      case "pix.paid":
        await handlePixPaid(data);
        break;

      default:
        console.log("Evento não tratado:", event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function handleBillingPaid(data: any) {
  const billingId = data.id;

  // Atualizar assinatura do aluno
  const subscription = await db.subscription.findFirst({
    where: { abacatePayBillingId: billingId },
  });

  if (subscription) {
    await db.subscription.update({
      where: { id: subscription.id },
      data: {
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
      },
    });
  }

  // Atualizar assinatura da academia
  const gymSubscription = await db.gymSubscription.findFirst({
    where: { abacatePayBillingId: billingId },
  });

  if (gymSubscription) {
    await db.gymSubscription.update({
      where: { id: gymSubscription.id },
      data: {
        status: "active",
        currentPeriodStart: new Date(),
        currentPeriodEnd: addMonths(new Date(), 1),
      },
    });
  }
}

async function handleBillingExpired(data: any) {
  const billingId = data.id;

  // Atualizar status para expired
  await db.subscription.updateMany({
    where: { abacatePayBillingId: billingId },
    data: { status: "expired" },
  });

  await db.gymSubscription.updateMany({
    where: { abacatePayBillingId: billingId },
    data: { status: "expired" },
  });
}

async function handlePixPaid(data: any) {
  // Similar ao handleBillingPaid
  // Atualizar assinatura baseada no metadata
}
```

---

## 🧪 Testes em Dev Mode

### Simular Pagamento PIX

```typescript
// Criar QR Code PIX
const pixQrCode = await abacatePay.createPixQrCode({
  amount: 2990,
  description: "Teste de pagamento",
});

// Simular pagamento (apenas em dev mode)
const paid = await abacatePay.simulatePixPayment(pixQrCode.data?.id);
```

### Testar Cobrança

1. Criar cobrança via API
2. Acessar a URL retornada (`billing.url`)
3. Em dev mode, o pagamento pode ser simulado
4. Verificar webhook recebido

---

## 📊 Utilitários

### Funções Helper

Localizadas em: `lib/utils/subscription.ts`

```typescript
// Verificar se aluno tem acesso premium
const hasPremium = await hasPremiumAccess(studentId);

// Verificar se pode usar feature específica
const canUseAI = await canUseFeature(studentId, "ai_workout");

// Criar cobrança de assinatura de aluno
const billing = await createStudentSubscriptionBilling(
  studentId,
  "monthly", // ou "annual"
  {
    name: "João Silva",
    email: "[email protected]",
    cellphone: "(11) 99999-9999",
    taxId: "123.456.789-00",
  }
);

// Criar cobrança de assinatura de academia
const gymBilling = await createGymSubscriptionBilling(
  gymId,
  "premium",
  100, // número de alunos
  {
    name: "Academia FitZone",
    email: "[email protected]",
    cellphone: "(11) 3333-3333",
    taxId: "12.345.678/0001-90",
  }
);
```

---

## 🎯 Cupons de Desconto

### Criar Cupom

```typescript
const coupon = await abacatePay.createCoupon({
  code: "GYMRATS20",
  notes: "Desconto de 20% para novos usuários",
  maxRedeems: 100,
  discountKind: "PERCENTAGE",
  discount: 20,
});

// Usar cupom na cobrança
const billing = await abacatePay.createBilling({
  // ... outros campos
  couponCode: "GYMRATS20",
});
```

---

## ⚠️ Boas Práticas

1. **Sempre validar webhooks** - Verificar assinatura antes de processar
2. **Implementar retries** - Webhooks podem falhar, implementar retry logic
3. **Idempotência** - Garantir que operações não sejam duplicadas
4. **Logs detalhados** - Registrar todas as interações com a API
5. **Tratamento de erros** - Sempre verificar `error` na resposta
6. **Valores em centavos** - Todos os valores devem ser em centavos (ex: R$ 29,90 = 2990)

---

## 📞 Suporte

- **Documentação:** [https://docs.abacatepay.com](https://docs.abacatepay.com)
- **Email:** [email protected]
- **Dashboard:** Acesse o dashboard da AbacatePay para gerenciar cobranças e ver relatórios

---

## 🔄 Próximos Passos

1. ✅ Cliente da API criado
2. ✅ Funções utilitárias implementadas
3. ⏳ Criar endpoints de API para assinaturas
4. ⏳ Implementar webhook handler
5. ⏳ Criar telas de pagamento
6. ⏳ Adicionar validação de assinatura de webhook

### Criar assinatura premium para aluno

```typescript
import { createStudentSubscriptionBilling } from "@/lib/utils/subscription";

const billing = await createStudentSubscriptionBilling(
  studentId,
  "monthly", // ou "annual"
  {
    name: "João Silva",
    email: "[email protected]",
    cellphone: "(11) 99999-9999",
    taxId: "123.456.789-00",
  }
);

// Redirecionar para URL de pagamento
redirect(billing.url);
```
