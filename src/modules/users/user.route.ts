import { Router } from "express";
import { userController } from "./user.controller";
import { validateRequest } from "../../middlewares/validateRequest";
import { createUserSchema, updateUserSchema } from "./user.validation";
import { hasRole, isAuthenticated } from "../../middlewares/auth.middleware";

const usersRouter = Router();

// Rota para criar um usuário STAFF ou ADMIN
// Protegida: precisa estar logado e ser ADMIN
usersRouter.post(
  "/",
  isAuthenticated,
  hasRole(["ADMIN"]),
  validateRequest(createUserSchema),
  userController.create,
);

// Listar usuários (ADMIN)
usersRouter.get("/", isAuthenticated, hasRole(["ADMIN"]), userController.list);

// Recuperar usuário por id (ADMIN)
usersRouter.get(
  "/:id",
  isAuthenticated,
  hasRole(["ADMIN"]),
  userController.get,
);

// Atualizar usuário (ADMIN)
usersRouter.put(
  "/:id",
  isAuthenticated,
  hasRole(["ADMIN"]),
  validateRequest(updateUserSchema),
  userController.update,
);

// Deletar usuário (ADMIN)
usersRouter.delete(
  "/:id",
  isAuthenticated,
  hasRole(["ADMIN"]),
  userController.delete,
);

export { usersRouter };
