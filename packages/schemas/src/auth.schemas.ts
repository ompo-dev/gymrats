import { z } from "zod";

/**
 * Schemas de validacao para rotas de autenticacao
 */

export const signUpSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(255, "Nome muito longo"),
  email: z
    .string()
    .email("Email invalido")
    .min(1, "Email e obrigatorio")
    .max(320, "Email muito longo"),
  password: z
    .string()
    .min(8, "A senha deve ter no minimo 8 caracteres")
    .max(128, "A senha deve ter no maximo 128 caracteres"),
});

export const signInSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .min(1, "Email e obrigatorio")
    .max(320, "Email muito longo"),
  password: z
    .string()
    .min(1, "Senha e obrigatoria")
    .max(128, "A senha deve ter no maximo 128 caracteres"),
});

export const updateRoleSchema = z.object({
  userId: z.string().cuid("userId deve ser um CUID valido"),
  role: z.enum(["STUDENT", "GYM", "PERSONAL"], {
    errorMap: () => ({
      message: "role deve ser STUDENT, GYM ou PERSONAL",
    }),
  }),
  userType: z.enum(["student", "gym", "personal"], {
    errorMap: () => ({ message: "userType deve ser student, gym ou personal" }),
  }),
});

export const updateUserRoleSchema = z.object({
  userId: z.string().cuid("userId deve ser um CUID valido"),
  role: z.enum(["STUDENT", "GYM", "PERSONAL"], {
    errorMap: () => ({ message: "role deve ser STUDENT, GYM ou PERSONAL" }),
  }),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .min(1, "Email e obrigatorio")
    .max(320, "Email muito longo"),
});

export const verifyResetCodeSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .min(1, "Email e obrigatorio")
    .max(320, "Email muito longo"),
  code: z
    .string()
    .length(6, "O codigo deve ter 6 digitos")
    .regex(/^\d+$/, "O codigo deve conter apenas numeros"),
});

export const resetPasswordSchema = z.object({
  email: z
    .string()
    .email("Email invalido")
    .min(1, "Email e obrigatorio")
    .max(320, "Email muito longo"),
  code: z
    .string()
    .length(6, "O codigo deve ter 6 digitos")
    .regex(/^\d+$/, "O codigo deve conter apenas numeros"),
  newPassword: z
    .string()
    .min(8, "A senha deve ter no minimo 8 caracteres")
    .max(128, "A senha deve ter no maximo 128 caracteres"),
});
