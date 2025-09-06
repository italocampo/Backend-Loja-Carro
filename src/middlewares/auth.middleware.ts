// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Estendendo a interface Request do Express para incluir nossa propriedade 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: 'ADMIN' | 'STAFF';
      };
    }
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

export const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  const { accessToken } = req.cookies;

  if (!accessToken) {
    return res.status(401).json({
      erro: {
        codigo: 'NAO_AUTENTICADO',
        mensagem: 'Token de acesso não fornecido ou inválido.',
      },
    });
  }

  try {
    const decoded = jwt.verify(accessToken, JWT_SECRET) as { sub: string; role: 'ADMIN' | 'STAFF' };
    req.user = { id: decoded.sub, role: decoded.role }; // Anexa o usuário à requisição
    next();
  } catch (error) {
    // Se o token expirou ou é inválido
    return res.status(401).json({
      erro: {
        codigo: 'TOKEN_INVALIDO',
        mensagem: 'Token de acesso expirado ou inválido.',
      },
    });
  }
};

// Middleware para verificar se o usuário tem uma role específica (ou superior)
export const hasRole = (roles: Array<'ADMIN' | 'STAFF'>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        erro: {
          codigo: 'ACESSO_NEGADO',
          mensagem: 'Você não tem permissão para executar esta ação.',
        },
      });
    }
    next();
  };
};