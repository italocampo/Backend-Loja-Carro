// src/modules/cars/car.route.ts
import { Router } from 'express';
import { carController } from './car.controller';
import { hasRole, isAuthenticated } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest';
import {
  createCarSchema,
  updateCarSchema,
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
  carController.uploadImages,
  validateRequest(createCarSchema),
  carController.create
);

carRouter.patch(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  carController.uploadImages,
  validateRequest(updateCarSchema),
  carController.update
);

carRouter.delete(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  carController.softDelete
);

carRouter.delete(
  '/:id/hard',
  isAuthenticated,
  hasRole(['ADMIN']), // Somente ADMIN pode fazer hard delete
  carController.hardDelete
);

export { carRouter };