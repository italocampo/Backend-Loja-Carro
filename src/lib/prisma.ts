// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client';

// Declara um objeto global para armazenar a instância do Prisma
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Cria a instância do Prisma, reutilizando a existente se estiver no objeto global
// ou criando uma nova se não estiver.
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

// Em ambiente de desenvolvimento, armazena a instância no objeto global
// para que ela persista entre os hot-reloads.
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}