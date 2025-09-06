import jwt from 'jsonwebtoken';

interface UserPayload {
  sub: string;
  role: 'ADMIN' | 'STAFF';
}

const JWT_SECRET = process.env.JWT_SECRET!;
const REFRESH_SECRET = process.env.REFRESH_SECRET!;

export const generateAccessToken = (payload: UserPayload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
};

export const generateRefreshToken = (payload: UserPayload) => {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
};