// src/modules/auth/auth.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../lib/prisma';
import { authService } from './auth.service';

const IS_PROD = process.env.NODE_ENV === 'production';

export const authController = {
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user, accessToken, refreshToken } = await authService.login(
        req.body,
      );

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 dias
      });

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  },

  logout: (req: Request, res: Response) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.status(204).send();
  },

  refresh: (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.cookies;
      const { accessToken } = authService.refreshAccessToken(refreshToken);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: IS_PROD,
        sameSite: 'lax',
        path: '/',
        maxAge: 15 * 60 * 1000, // 15 minutos
      });

      return res.status(200).json({ status: 'Token renovado com sucesso.' });
    } catch (error) {
      res.clearCookie('accessToken', { path: '/' });
      res.clearCookie('refreshToken', { path: '/' });
      return next(error);
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new Error('Usuário não encontrado na requisição.');
      }

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          role: true,
          ativo: true,
        },
      });

      if (!user) {
        return res
          .status(404)
          .json({
            erro: {
              codigo: 'USUARIO_NAO_ENCONTRADO',
              mensagem: 'Usuário não encontrado.',
            },
          });
      }

      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  },
};