// src/modules/cars/car.route.ts
import { Router } from 'express';
import { carController } from './car.controller';
// Os middlewares de autenticação serão usados nas rotas de Staff
// import { hasRole, isAuthenticated } from '../../middlewares/auth.middleware';

const carRouter = Router();

// --- ROTAS PÚBLICAS ---
carRouter.get('/', carController.getAll);
carRouter.get('/:id', carController.getById);

// --- ROTAS PROTEGIDAS (STAFF/ADMIN) ---
// TODO: POST /
// TODO: PATCH /:id
// TODO: DELETE /:id
// TODO: DELETE /:id/hard

export { carRouter };