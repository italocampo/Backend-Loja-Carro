// src/modules/cars/car.controller.ts
import { Request, Response, NextFunction } from 'express';
import { carService } from './car.service';
import { getCarsQuerySchema } from './car.validation';
import { z } from 'zod';

export const carController = {
  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validando os query params com o schema
      const query = getCarsQuerySchema.parse(req.query);

      const { cars, total } = await carService.findMany(query);

      const totalPages = Math.ceil(total / query.limit);

      // Setando cabeçalhos de paginação e cache
      res.setHeader('X-Total-Count', total);
      res.setHeader('X-Total-Pages', totalPages);
      res.setHeader('Cache-Control', 'public, max-age=60, stale-while-revalidate=120');

      return res.status(200).json(cars);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ erro: { codigo: 'VALIDACAO_FALHOU', mensagem: 'Parâmetros de busca inválidos.', detalhes: error.flatten() }});
      }
      return next(error);
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const car = await carService.findById(id);

      if (!car) {
        return res.status(404).json({ erro: { codigo: 'CARRO_NAO_ENCONTRADO', mensagem: 'Carro não encontrado.' } });
      }

      // Montando link do WhatsApp
      const numeroWpp = process.env.LOJA_WPP_E164;
      const mensagem = `Olá, tenho interesse no carro ${car.titulo} (ID: ${car.id}).`;
      const linkWhatsApp = `https://wa.me/${numeroWpp}?text=${encodeURIComponent(mensagem)}`;
      
      const carWithWhatsApp = {
        ...car,
        linkWhatsApp,
      };

      return res.status(200).json(carWithWhatsApp);
    } catch (error) {
      return next(error);
    }
  },
};