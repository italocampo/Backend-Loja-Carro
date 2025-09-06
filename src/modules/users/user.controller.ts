// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';

export const userController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Apenas ADMIN pode criar um usuário ADMIN
      if (req.body.role === 'ADMIN' && req.user?.role !== 'ADMIN') {
        return res.status(403).json({ erro: { codigo: 'ACESSO_NEGADO', mensagem: 'Apenas administradores podem criar outros administradores.' } });
      }

      const newUser = await userService.create(req.body);
      return res.status(201).json(newUser);
    } catch (error) {
      // Personaliza erro de e-mail duplicado
      if (error instanceof Error && error.message.includes('e-mail já existe')) {
          return res.status(409).json({ // 409 Conflict
              erro: {
                  codigo: 'RECURSO_DUPLICADO',
                  mensagem: error.message
              }
          })
      }
      return next(error);
    }
  },
};