import { NextResponse } from "@/runtime/next-server";
import { z } from "zod";
import { createSafeHandler } from "@/lib/api/utils/api-wrapper";
import { ReferralService } from "@/lib/services/referral.service";

const pixKeySchema = z.object({
  pixKey: z.string().min(1, "Chave PIX é obrigatória"),
  pixKeyType: z.enum(["CPF", "CNPJ", "EMAIL", "PHONE", "RANDOM", "BR_CODE"], {
    errorMap: () => ({ message: "Tipo de chave PIX inválido" }),
  }),
});

export const POST = createSafeHandler(
  async ({ body, studentContext }) => {
    const { studentId } = studentContext!;
    const { pixKey, pixKeyType } = body as z.infer<typeof pixKeySchema>;

    await ReferralService.updatePixKey(studentId, pixKey, pixKeyType);

    return NextResponse.json({ success: true, pixKey, pixKeyType });
  },
  {
    auth: "student",
    schema: { body: pixKeySchema },
  },
);
