import { Router } from 'express';
import { authController } from './auth.controller';
import { validateRequest } from '../../middlewares/validateRequest';
import { loginSchema } from './auth.validation';
import { isAuthenticated } from '../../middlewares/auth.middleware';

const authRouter = Router();

authRouter.post('/login', validateRequest(loginSchema), authController.login);
authRouter.post('/logout', authController.logout);

// ROTA QUE FALTAVA
authRouter.post('/refresh', authController.refresh);

// ROTA QUE ESTAVA DANDO 404
authRouter.get('/me', isAuthenticated, authController.getMe);

export { authRouter };