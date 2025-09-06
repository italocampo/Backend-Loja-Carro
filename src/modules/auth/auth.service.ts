import { compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { generateAccessToken, generateRefreshToken } from '../../utils/jwt';
import { loginSchema } from './auth.validation';

type LoginInput = z.infer<typeof loginSchema>;

export const authService = {
  login: async ({ email, senha }: LoginInput) => {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.ativo) {
      throw new Error('Credenciais inválidas ou usuário inativo.');
    }

    const senhaCorreta = await compare(senha, user.senhaHash);
    if (!senhaCorreta) {
      throw new Error('Credenciais inválidas.');
    }

    const payload = { sub: user.id, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    const { senhaHash, ...userWithoutPassword } = user;
    return {
      user: userWithoutPassword,
      accessToken,
      refreshToken,
    };
  },

  refreshAccessToken: (refreshToken: string) => {
    if (!refreshToken) {
      throw new Error('Refresh token não fornecido.');
    }

    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.REFRESH_SECRET!,
      ) as { sub: string; role: 'ADMIN' | 'STAFF' };

      const payload = { sub: decoded.sub, role: decoded.role };
      const newAccessToken = generateAccessToken(payload);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error('Refresh token inválido ou expirado.');
    }
  },
};