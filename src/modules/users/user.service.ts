import { hash } from "bcryptjs";
import { prisma } from "../../lib/prisma";
import { z } from "zod";
import { createUserSchema } from "./user.validation";

type CreateUserInput = z.infer<typeof createUserSchema>;

export const userService = {
  create: async (data: CreateUserInput) => {
    // 1. Verificar se o e-mail já existe
    const emailExists = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (emailExists) {
      throw new Error("Um usuário com este e-mail já existe.");
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

  // Listar todos os usuários (sem senha)
  findAll: async (opts?: { page?: number; limit?: number; q?: string }) => {
    const page = Math.max(1, Number(opts?.page || 1));
    const limit = Math.max(1, Math.min(100, Number(opts?.limit || 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (opts?.q) {
      where.OR = [
        { nome: { contains: opts.q, mode: "insensitive" } },
        { email: { contains: opts.q, mode: "insensitive" } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nome: "asc" },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
        },
      }),
    ]);

    return { users, total, page, limit };
  },

  // Buscar usuário por id
  findById: async (id: string) => {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });

    if (!user) throw new Error("Usuário não encontrado.");
    return user;
  },

  // Atualizar usuário
  update: async (id: string, data: Partial<CreateUserInput>) => {
    // Se o e-mail foi alterado, verificar duplicidade
    if (data.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (emailExists && emailExists.id !== id) {
        throw new Error("Um usuário com este e-mail já existe.");
      }
    }

    const updateData: any = {};
    if (data.nome) updateData.nome = data.nome;
    if (data.email) updateData.email = data.email;
    if (typeof data.role !== "undefined") updateData.role = data.role;
    if (typeof data.senha !== "undefined") {
      const senhaHash = await hash(data.senha as string, 12);
      updateData.senhaHash = senhaHash;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nome: true,
        email: true,
        role: true,
        ativo: true,
      },
    });

    return updated;
  },

  // Deletar usuário
  delete: async (id: string) => {
    await prisma.user.delete({ where: { id } });
    return true;
  },

  // Contagem de admins ativos
  countAdmins: async () => {
    return prisma.user.count({ where: { role: "ADMIN", ativo: true } });
  },
};
