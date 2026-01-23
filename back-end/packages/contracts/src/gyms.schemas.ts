import { z } from "zod";

/**
 * Schemas de validação para rotas de gyms
 */

export const createGymSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(255, "Nome muito longo"),
  address: z.string().min(1, "Endereço é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  cnpj: z.string().optional().nullable(),
});

export const setActiveGymSchema = z.object({
  gymId: z.string().min(1, "gymId é obrigatório"),
});

export const gymLocationsQuerySchema = z.object({
  lat: z.string().regex(/^-?\d+\.?\d*$/).optional(),
  lng: z.string().regex(/^-?\d+\.?\d*$/).optional(),
  isPartner: z.string().transform((val) => val === "true").optional(),
});
