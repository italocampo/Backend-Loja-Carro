// src/modules/users/user.controller.ts
import { Request, Response, NextFunction } from "express";
import { userService } from "./user.service";

export const userController = {
  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Apenas ADMIN pode criar um usuário ADMIN
      if (req.body.role === "ADMIN" && req.user?.role !== "ADMIN") {
        return res
          .status(403)
          .json({
            erro: {
              codigo: "ACESSO_NEGADO",
              mensagem:
                "Apenas administradores podem criar outros administradores.",
            },
          });
      }

      const newUser = await userService.create(req.body);
      return res.status(201).json(newUser);
    } catch (error) {
      // Personaliza erro de e-mail duplicado
      if (
        error instanceof Error &&
        error.message.includes("e-mail já existe")
      ) {
        return res.status(409).json({
          // 409 Conflict
          erro: {
            codigo: "RECURSO_DUPLICADO",
            mensagem: error.message,
          },
        });
      }
      return next(error);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const users = await userService.findAll();
      return res.status(200).json(users);
    } catch (error) {
      return next(error);
    }
  },

  get: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const user = await userService.findById(id);
      return res.status(200).json(user);
    } catch (error) {
      return next(error);
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      // Evitar que um STAFF atualize para ADMIN (a rota já é protegida por ADMIN, mas mantemos checagem)
      if (req.body.role === "ADMIN" && req.user?.role !== "ADMIN") {
        return res
          .status(403)
          .json({
            erro: {
              codigo: "ACESSO_NEGADO",
              mensagem: "Apenas administradores podem definir o papel ADMIN.",
            },
          });
      }

      const updated = await userService.update(id, req.body);
      return res.status(200).json(updated);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("e-mail já existe")
      ) {
        return res
          .status(409)
          .json({
            erro: { codigo: "RECURSO_DUPLICADO", mensagem: error.message },
          });
      }
      return next(error);
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await userService.delete(id);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
};
