import { Request, Response, NextFunction } from 'express';
import { carService } from './car.service';
import { 
  getCarsQuerySchema, 
  createCarSchema, 
  updateCarSchema,
} from './car.validation';
import { z } from 'zod';
import multer from 'multer';

// Configuração do Multer
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5MB por arquivo
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo inválido. Apenas .jpeg, .png e .webp são permitidos.'));
    }
  }
});

export const carController = {
  uploadImages: upload.array('images', 20),

  getAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = getCarsQuerySchema.parse(req.query);
      const { cars, total } = await carService.findMany(query);
      const totalPages = Math.ceil(total / query.limit);

      res.setHeader('X-Total-Count', total);
      res.setHeader('X-Total-Pages', totalPages);
      
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

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const carData = createCarSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined; 
      
      const newCar = await carService.create(carData, files);
      return res.status(201).json(newCar);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const carData = updateCarSchema.parse(req.body);
      const files = req.files as Express.Multer.File[] | undefined;
      const removedImageUrls = req.body.removedImageUrls ? JSON.parse(req.body.removedImageUrls) : [];

      const updatedCar = await carService.update(id, carData, files, removedImageUrls);
      return res.status(200).json(updatedCar);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Carro não encontrado')) {
        return res.status(404).json({ erro: { codigo: 'CARRO_NAO_ENCONTRADO', mensagem: error.message } });
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
      if (error instanceof Error && error.message.includes('Carro não encontrado')) {
        return res.status(404).json({ erro: { codigo: 'CARRO_NAO_ENCONTRADO', mensagem: error.message } });
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
      if (error instanceof Error && error.message.includes('Carro não encontrado')) {
        return res.status(404).json({ erro: { codigo: 'CARRO_NAO_ENCONTRADO', mensagem: error.message } });
      }
      return next(error);
    }
  },
};