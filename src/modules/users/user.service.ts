import { hash } from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { z } from 'zod';
import { createUserSchema } from './user.validation';

type CreateUserInput = z.infer<typeof createUserSchema>;

export const userService = {
  create: async (data: CreateUserInput) => {
    // 1. Verificar se o e-mail já existe
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error('Um usuário com este e-mail já existe.');
    }

    // 2. Criar o hash da senha
    const senhaHash = await hash(data.senha, 12);

    // 3. Salvar no banco de dados
    const user = await prisma.user.create({
      data: {
        nome: data.nome,
        email: data.email,
        senhaHash,
        role: data.role,
      },
    });

    // 4. Retornar usuário sem a senha
    const { senhaHash: _, ...userResult } = user;
    return userResult;
  },
};