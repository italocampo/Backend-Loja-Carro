// src/modules/users/user.validation.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres.'),
  email: z.string().email('Formato de e-mail inválido.'),
  senha: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres.'),
  role: z.enum(['ADMIN', 'STAFF']).optional().default('STAFF'),
});