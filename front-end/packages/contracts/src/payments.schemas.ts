import { z } from "zod";

/**
 * Schemas de validação para rotas de payments
 */

export const paymentsQuerySchema = z.object({
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  offset: z.string().regex(/^\d+$/).transform(Number).optional(),
});

export const addPaymentMethodSchema = z
  .object({
    type: z.enum(["credit-card", "debit-card", "pix"], {
      errorMap: () => ({
        message: "Tipo deve ser credit-card, debit-card ou pix",
      }),
    }),
    isDefault: z.boolean().optional(),
    cardBrand: z.string().optional().nullable(),
    last4: z.string().optional().nullable(),
    expiryMonth: z.number().int().min(1).max(12).optional().nullable(),
    expiryYear: z.number().int().positive().optional().nullable(),
    holderName: z.string().optional().nullable(),
    pixKey: z.string().optional().nullable(),
    pixKeyType: z
      .enum(["cpf", "cnpj", "email", "phone", "random"])
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (data.type === "credit-card" || data.type === "debit-card") {
        return !!data.last4 && !!data.cardBrand;
      }
      return true;
    },
    {
      message: "Campos obrigatórios faltando para cartão",
      path: ["last4"],
    }
  )
  .refine(
    (data) => {
      if (data.type === "pix") {
        return !!data.pixKey && !!data.pixKeyType;
      }
      return true;
    },
    {
      message: "Campos obrigatórios faltando para PIX",
      path: ["pixKey"],
    }
  );
