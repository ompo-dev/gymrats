import { z } from "zod";

/**
 * Schemas de validação para rotas de autenticação
 */

export const signUpSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});

export const signInSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
});

export const updateRoleSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório"),
  role: z.enum(["STUDENT", "GYM", "PERSONAL", "ADMIN"], {
    errorMap: () => ({
      message: "role deve ser STUDENT, GYM, PERSONAL ou ADMIN",
    }),
  }),
  userType: z.enum(["student", "gym", "personal"], {
    errorMap: () => ({ message: "userType deve ser student, gym ou personal" }),
  }),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().min(1, "userId é obrigatório"),
  role: z.enum(["STUDENT", "GYM", "PERSONAL"], {
    errorMap: () => ({ message: "role deve ser STUDENT, GYM ou PERSONAL" }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
});

export const verifyResetCodeSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  code: z
    .string()
    .length(6, "O código deve ter 6 dígitos")
    .regex(/^\d+$/, "O código deve conter apenas números"),
});

export const resetPasswordSchema = z.object({
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  code: z
    .string()
    .length(6, "O código deve ter 6 dígitos")
    .regex(/^\d+$/, "O código deve conter apenas números"),
  newPassword: z.string().min(8, "A senha deve ter no mínimo 8 caracteres"),
});
