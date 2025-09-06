import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

export const validateRequest = (schema: z.ZodObject<any, any>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const detalhes = error.issues.reduce((acc, err) => {
          acc[String(err.path[0])] = err.message;
          return acc;
        }, {} as Record<string, string>);

        return res.status(400).json({
          erro: {
            codigo: 'VALIDACAO_FALHOU',
            mensagem: 'Dados inválidos fornecidos.',
            detalhes,
          },
        });
      }
      next(error);
    }
  };
};