import { Router } from 'express';
import { userController } from './user.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { createUserSchema } from './user.validation';
import { hasRole, isAuthenticated } from '../../middlewares/auth.middleware';

const usersRouter = Router();

// Rota para criar um usuário STAFF ou ADMIN
// Protegida: precisa estar logado e ser ADMIN
usersRouter.post(
  '/',
  isAuthenticated,
  hasRole(['ADMIN']),
  validateRequest(createUserSchema),
  userController.create
);

export { usersRouter };