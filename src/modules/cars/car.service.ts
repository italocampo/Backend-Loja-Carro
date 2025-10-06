import { Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma';
import {
  createCarSchema,
  getCarsQuerySchema,
  updateCarSchema,
} from './car.validation';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { randomUUID } from 'crypto';

const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'carros';

type GetCarsQuery = z.infer<typeof getCarsQuerySchema>;

export const carService = {
  findMany: async (query: GetCarsQuery) => {
    // ... (esta função continua igual, sem alterações)
    const { page, limit, ordenarPor, ordem, ...filters } = query;
    const where: Prisma.CarWhereInput = { ativo: true };
    if (filters.q) { where.OR = [ { titulo: { contains: filters.q, mode: 'insensitive' } }, { descricao: { contains: filters.q, mode: 'insensitive' } }, { marca: { contains: filters.q, mode: 'insensitive' } }, { modelo: { contains: filters.q, mode: 'insensitive' } }, ]; }
    if (filters.marca) where.marca = { contains: filters.marca, mode: 'insensitive' };
    if (filters.modelo) where.modelo = { contains: filters.modelo, mode: 'insensitive' };
    if (filters.cambio) where.cambio = filters.cambio;
    if (filters.combustivel) where.combustivel = filters.combustivel;
    if (filters.anoMin || filters.anoMax) { where.ano = {}; if (filters.anoMin) { where.ano.gte = filters.anoMin; } if (filters.anoMax) { where.ano.lte = filters.anoMax; } }
    if (filters.precoMin || filters.precoMax) { where.precoCentavos = {}; if (filters.precoMin) { where.precoCentavos.gte = filters.precoMin; } if (filters.precoMax) { where.precoCentavos.lte = filters.precoMax; } }
    if (filters.kmMax) where.km = { lte: filters.kmMax };
    const [cars, total] = await prisma.$transaction([ prisma.car.findMany({ where, orderBy: { [ordenarPor]: ordem }, take: limit, skip: (page - 1) * limit, include: { images: { where: { capa: true } } }, }), prisma.car.count({ where }), ]);
    return { cars, total };
  },

  findById: async (id: string) => {
    // ... (esta função continua igual, sem alterações)
    const car = await prisma.car.findFirst({ where: { id, ativo: true, }, include: { images: { orderBy: { ordem: 'asc', }, }, }, });
    return car;
  },

  _checkExists: async (id: string) => {
    // ... (esta função continua igual, sem alterações)
    const carExists = await prisma.car.findUnique({ where: { id } });
    if (!carExists) { throw new Error('Carro não encontrado.'); }
    return carExists;
  },

  // --- FUNÇÃO CREATE MODIFICADA ---
  create: async (
    data: z.infer<typeof createCarSchema>,
    files?: Express.Multer.File[]
  ) => {
    return prisma.$transaction(async (tx) => {
      // 1. Cria o carro no banco de dados
      const newCar = await tx.car.create({ data });

      // 2. Se houver arquivos, faz o upload e os associa ao carro criado
      if (files && files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExtension = file.originalname.split('.').pop();
          const path = `${newCar.id}/${randomUUID()}.${fileExtension}`;

          // Upload para o Supabase
          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file.buffer, { contentType: file.mimetype });
          
          if (uploadError) {
            throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
          }
          
          // Pega a URL pública
          const { data: { publicUrl } } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(path);

          // Salva os dados da imagem no banco
          await tx.carImage.create({
            data: {
              carId: newCar.id,
              url: publicUrl,
              storagePath: path,
              ordem: i,
              capa: i === 0, // A primeira imagem é a capa
            },
          });
        }
      }

      return newCar;
    });
  },

  // --- FUNÇÃO UPDATE MODIFICADA ---
   update: async (
    id: string,
    data: z.infer<typeof updateCarSchema>,
    files?: Express.Multer.File[],
    removedImageUrls?: string[]
  ) => {
    await carService._checkExists(id);
    
    return prisma.$transaction(async (tx) => {
      // 1. Atualiza os dados básicos do carro
      const updatedCar = await tx.car.update({ where: { id }, data });

      // 2. Remove as imagens que o usuário marcou para deletar
      if (removedImageUrls && removedImageUrls.length > 0) {
        const imagesToDelete = await tx.carImage.findMany({
          where: { carId: id, url: { in: removedImageUrls } },
        });

        if (imagesToDelete.length > 0) {
          const paths = imagesToDelete.map((img) => img.storagePath);
          await supabase.storage.from(BUCKET_NAME).remove(paths);
          await tx.carImage.deleteMany({
            where: { id: { in: imagesToDelete.map(img => img.id) } },
          });
        }
      }

      // 3. Adiciona as novas imagens que o usuário enviou
      if (files && files.length > 0) {
        // --- LÓGICA CORRIGIDA E ADICIONADA AQUI ---
        // Primeiro, verifica se já existe uma imagem de capa para este carro
        let coverExists = await tx.carImage.count({ where: { carId: id, capa: true } }) > 0;

        // Encontra a ordem da última imagem para continuar a sequência
        const lastImage = await tx.carImage.findFirst({
          where: { carId: id },
          orderBy: { ordem: 'desc' },
        });
        let newOrder = (lastImage?.ordem ?? -1) + 1;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const fileExtension = file.originalname.split('.').pop();
          const path = `${id}/${randomUUID()}.${fileExtension}`;

          const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(path, file.buffer, { contentType: file.mimetype });
          if (uploadError) throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
          
          const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);

          // Define se a imagem atual deve ser a capa
          const shouldBeCover = !coverExists && i === 0;

          await tx.carImage.create({
            data: {
              carId: id,
              url: publicUrl,
              storagePath: path,
              ordem: newOrder++,
              capa: shouldBeCover, // A primeira imagem se torna a capa SE não houver outra
            },
          });
          
          // Se acabamos de criar uma capa, atualiza a flag para as próximas imagens no loop
          if (shouldBeCover) {
            coverExists = true;
          }
        }
      }
      return updatedCar;
    });
  },

  softDelete: async (id: string) => {
    // ... (esta função continua igual, sem alterações)
    await carService._checkExists(id); await prisma.car.update({ where: { id }, data: { ativo: false }, }); return;
  },

  hardDelete: async (id: string) => {
    // ... (esta função continua igual, sem alterações)
    await carService._checkExists(id); const images = await prisma.carImage.findMany({ where: { carId: id } }); if (images.length > 0) { const paths = images.map((img) => img.storagePath); await supabase.storage.from(BUCKET_NAME).remove(paths); } await prisma.car.delete({ where: { id } });
  },

  // As funções de gerenciamento de imagens (`createSignedUrl`, etc.) não são mais necessárias
  // pois o upload agora é direto, mas pode mantê-las se usar em outro lugar.
  // Se não for usar, pode removê-las. Por segurança, vou mantê-las aqui comentadas.
  /*
  createSignedUrl: ...
  confirmUpload: ...
  updateImage: ...
  deleteImage: ...
  */
};