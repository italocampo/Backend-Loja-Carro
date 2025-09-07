import { Router } from 'express';
import { carController } from './car.controller';
import { hasRole, isAuthenticated } from '../../middlewares/auth.middleware';
import { validateRequest } from '../../middlewares/validateRequest';
import { createCarSchema, updateCarSchema } from './car.validation';

const carRouter = Router();

// --- ROTAS PÚBLICAS ---
carRouter.get('/', carController.getAll);
carRouter.get('/:id', carController.getById);

// --- ROTAS PROTEGIDAS (STAFF/ADMIN) ---

// Criar um novo carro
carRouter.post(
  '/',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(createCarSchema),
  carController.create,
);

// Atualizar um carro existente
carRouter.patch(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  validateRequest(updateCarSchema),
  carController.update,
);

// Desativar um carro (soft delete)
carRouter.delete(
  '/:id',
  isAuthenticated,
  hasRole(['ADMIN', 'STAFF']),
  carController.softDelete,
);

// Excluir um carro permanentemente (apenas ADMIN)
carRouter.delete(
  '/:id/hard',
  isAuthenticated,
  hasRole(['ADMIN']), // Somente ADMIN pode fazer hard delete
  carController.hardDelete,
);

export { carRouter };