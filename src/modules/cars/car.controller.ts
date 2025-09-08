// src/modules/cars/car.controller.ts
import { Request, Response, NextFunction } from 'express';
import { carService } from './car.service';
import { getCarsQuerySchema } from './car.validation';
import { z } from 'zod';

export const carController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = getCarsQuerySchema.parse(req.query);
      const { cars, total } = await carService.findMany(query);
      const totalPages = Math.ceil(total / query.limit);

      res.setHeader('X-Total-Count', total);
      res.setHeader('X-Total-Pages', totalPages);
      res.setHeader(
        'Cache-Control',
        'public, max-age=60, stale-while-revalidate=120',
      );

      return res.status(200).json(cars);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          erro: {
            codigo: 'VALIDACAO_FALHOU',
            mensagem: 'Parâmetros de busca inválidos.',
            detalhes: error.flatten(),
          },
        });
      }
      return next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const car = await carService.findById(id);

      if (!car) {
        return res.status(404).json({
          erro: {
            codigo: 'CARRO_NAO_ENCONTRADO',
            mensagem: 'Carro não encontrado.',
          },
        });
      }

      const numeroWpp = process.env.LOJA_WPP_E164;
      const mensagem = `Olá, tenho interesse no carro ${car.titulo} (ID: ${car.id}).`;
      const linkWhatsApp = `https://wa.me/${numeroWpp}?text=${encodeURIComponent(
        mensagem,
      )}`;

      const carWithWhatsApp = {
        ...car,
        linkWhatsApp,
      };

      return res.status(200).json(carWithWhatsApp);
    } catch (error) {
      return next(error);
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const newCar = await carService.create(req.body);
      return res.status(201).json(newCar);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updatedCar = await carService.update(id, req.body);
      return res.status(200).json(updatedCar);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Carro não encontrado')
      ) {
        return res.status(404).json({
          erro: {
            codigo: 'CARRO_NAO_ENCONTRADO',
            mensagem: error.message,
          },
        });
      }
      return next(error);
    }
  },

  softDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await carService.softDelete(id);
      return res.status(204).send();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Carro não encontrado')
      ) {
        return res.status(404).json({
          erro: {
            codigo: 'CARRO_NAO_ENCONTRADO',
            mensagem: error.message,
          },
        });
      }
      return next(error);
    }
  },

  hardDelete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await carService.hardDelete(id);
      return res.status(204).send();
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Carro não encontrado')
      ) {
        return res.status(404).json({
          erro: {
            codigo: 'CARRO_NAO_ENCONTRADO',
            mensagem: error.message,
          },
        });
      }
      return next(error);
    }
  },

  createSignedUrl: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: carId } = req.params;
      const signedUrlData = await carService.createSignedUrl(carId, req.body);
      return res.status(200).json(signedUrlData);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes('Limite de 20 imagens')
      ) {
        return res.status(413).json({
          erro: { codigo: 'LIMITE_ATINGIDO', mensagem: error.message },
        });
      }
      return next(error);
    }
  },

  confirmUpload: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: carId } = req.params;
      const newImage = await carService.confirmUpload(carId, req.body);
      return res.status(201).json(newImage);
    } catch (error) {
      return next(error);
    }
  },

  updateImage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id: carId, imageId } = req.params;
      const updatedImage = await carService.updateImage(carId, imageId, req.body);
      return res.status(200).json(updatedImage);
    } catch (error) {
      return next(error);
    }
  },

  deleteImage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { imageId } = req.params;
      await carService.deleteImage(imageId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
};