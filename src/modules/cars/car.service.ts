import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import { getCarsQuerySchema } from './car.validation';
import { z } from 'zod';

type GetCarsQuery = z.infer<typeof getCarsQuerySchema>;

export const carService = {
  findMany: async (query: GetCarsQuery) => {
    const { page, limit, ordenarPor, ordem, ...filters } = query;
    const where: Prisma.CarWhereInput = {
      ativo: true,
    };

    if (filters.q) {
      where.OR = [
        { titulo: { contains: filters.q, mode: 'insensitive' } },
        { descricao: { contains: filters.q, mode: 'insensitive' } },
        { marca: { contains: filters.q, mode: 'insensitive' } },
        { modelo: { contains: filters.q, mode: 'insensitive' } },
      ];
    }
    if (filters.marca)
      where.marca = { contains: filters.marca, mode: 'insensitive' };
    if (filters.modelo)
      where.modelo = { contains: filters.modelo, mode: 'insensitive' };
    if (filters.cambio) where.cambio = filters.cambio;
    if (filters.combustivel) where.combustivel = filters.combustivel;

    if (filters.anoMin || filters.anoMax) {
      where.ano = {};
      if (filters.anoMin) {
        where.ano.gte = filters.anoMin;
      }
      if (filters.anoMax) {
        where.ano.lte = filters.anoMax;
      }
    }

    if (filters.precoMin || filters.precoMax) {
      where.precoCentavos = {};
      if (filters.precoMin) {
        where.precoCentavos.gte = filters.precoMin;
      }
      if (filters.precoMax) {
        where.precoCentavos.lte = filters.precoMax;
      }
    }

    if (filters.kmMax) where.km = { lte: filters.kmMax };

    const [cars, total] = await prisma.$transaction([
      prisma.car.findMany({
        where,
        orderBy: { [ordenarPor]: ordem },
        take: limit,
        skip: (page - 1) * limit,
        include: { images: { where: { capa: true } } },
      }),
      prisma.car.count({ where }),
    ]);

    return { cars, total };
  },

  findById: async (id: string) => {
    const car = await prisma.car.findFirst({
      where: {
        id,
        ativo: true,
      },
      include: {
        images: {
          orderBy: {
            ordem: 'asc',
          },
        },
      },
    });

    return car;
  },
};