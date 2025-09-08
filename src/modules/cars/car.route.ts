// src/modules/cars/car.route.ts
import { Router } from 'express';
import { carController } from './car.controller';
import { hasRole, isAuthenticated } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createCarSchema,
  updateCarSchema,
  createSignedUrlSchema,
  confirmUploadSchema,
  updateImageSchema,
} from './car.validation';

const carRouter = Router();

// --- ROTAS PÚBLICAS ---
carRouter.get('/', carController.getAll);
carRouter.get('/:id', carController.getById);

// --- ROTAS PROTEGIDAS DE CARROS (STAFF/ADMIN) ---
carRouter.post(
  '/',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(createCarSchema),
  carController.create,
);

carRouter.patch(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(updateCarSchema),
  carController.update,
);

carRouter.delete(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  carController.softDelete,
);

carRouter.delete(
  '/:id/hard',
  isAuthenticated,
  hasRole(['ADMIN']), // Somente ADMIN pode fazer hard delete
  carController.hardDelete,
);

// --- ROTAS DE GERENCIAMENTO DE IMAGENS (STAFF/ADMIN) ---

// 1. Gerar URL para upload
carRouter.post(
  '/:id/images/signed-url',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(createSignedUrlSchema),
  carController.createSignedUrl,
);

// 2. Confirmar o upload e salvar no DB
carRouter.post(
  '/:id/images/confirm',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(confirmUploadSchema),
  carController.confirmUpload,
);

// 3. Atualizar (marcar como capa, reordenar)
carRouter.patch(
  '/:id/images/:imageId',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(updateImageSchema),
  carController.updateImage,
);

// 4. Deletar uma imagem
carRouter.delete(
  '/:id/images/:imageId',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  carController.deleteImage,
);

export { carRouter };