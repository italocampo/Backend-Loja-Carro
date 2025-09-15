import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  createCarSchema,
  createSignedUrlSchema,
  confirmUploadSchema,
  getCarsQuerySchema,
  updateCarSchema,
  updateImageSchema,
} from './car.validation';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { randomUUID } from 'crypto';

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'carros';

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

  _checkExists: async (id: string) => {
    const carExists = await prisma.car.findUnique({ where: { id } });
    if (!carExists) {
      throw new Error('Carro não encontrado.');
    }
    return carExists;
  },

  create: async (data: z.infer<typeof createCarSchema>) => {
    const newCar = await prisma.car.create({
      data,
    });
    return newCar;
  },

  update: async (id: string, data: z.infer<typeof updateCarSchema>) => {
    await carService._checkExists(id);
    const updatedCar = await prisma.car.update({
      where: { id },
      data,
    });
    return updatedCar;
  },

  softDelete: async (id: string) => {
    await carService._checkExists(id);
    await prisma.car.update({
      where: { id },
      data: { ativo: false },
    });
    return;
  },

  hardDelete: async (id: string) => {
    await carService._checkExists(id);
    const images = await prisma.carImage.findMany({ where: { carId: id } });

    if (images.length > 0) {
      const paths = images.map((img) => img.storagePath);
      await supabase.storage.from(BUCKET_NAME).remove(paths);
    }

    await prisma.car.delete({ where: { id } });
  },

  // -- MÉTODOS DE IMAGEM --

  createSignedUrl: async (
    carId: string,
    data: z.infer<typeof createSignedUrlSchema>,
  ) => {
    await carService._checkExists(carId);

    const imageCount = await prisma.carImage.count({ where: { carId } });
    if (imageCount >= 20) {
      throw new Error('Limite de 20 imagens por carro atingido.');
    }

    const fileExtension = data.contentType.split('/')[1];
    const path = `${carId}/${randomUUID()}.${fileExtension}`;

    const { data: signedUrlData, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUploadUrl(path);

    if (error) {
      throw new Error(`Falha ao criar Signed URL: ${error.message}`);
    }

    return { signedUrl: signedUrlData.signedUrl, storagePath: path };
  },

  confirmUpload: async (
    carId: string,
    data: z.infer<typeof confirmUploadSchema>,
  ) => {
    await carService._checkExists(carId);

    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.storagePath);

    if (!publicUrl) {
      throw new Error('Não foi possível obter a URL pública do arquivo.');
    }

    const lastImage = await prisma.carImage.findFirst({
      where: { carId },
      orderBy: { ordem: 'desc' },
    });
    const newOrder = (lastImage?.ordem ?? -1) + 1;

    const newImage = await prisma.carImage.create({
      data: {
        carId,
        url: publicUrl,
        storagePath: data.storagePath,
        ordem: newOrder,
        capa: newOrder === 0,
      },
    });

    return newImage;
  },

  updateImage: async (
    carId: string,
    imageId: string,
    data: z.infer<typeof updateImageSchema>,
  ) => {
    if (data.capa === true) {
      await prisma.$transaction([
        prisma.carImage.updateMany({ where: { carId }, data: { capa: false } }),
        prisma.carImage.update({ where: { id: imageId }, data: { capa: true } }),
      ]);
    }

    const updatedImage = await prisma.carImage.update({
      where: { id: imageId },
      data: {
        ordem: data.ordem,
      },
    });
    return updatedImage;
  },

  deleteImage: async (imageId: string) => {
    const image = await prisma.carImage.findUnique({ where: { id: imageId } });
    if (!image) throw new Error('Imagem não encontrada.');

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([image.storagePath]);
    if (error)
      throw new Error(`Falha ao deletar imagem do storage: ${error.message}`);

    await prisma.carImage.delete({ where: { id: imageId } });

    if (image.capa) {
      const nextImage = await prisma.carImage.findFirst({
        where: { carId: image.carId },
        orderBy: { ordem: 'asc' },
      });

      if (nextImage) {
        await prisma.carImage.update({
          where: { id: nextImage.id },
          data: { capa: true },
        });
      }
    }
  },
};