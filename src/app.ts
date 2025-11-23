// Carrega as variáveis de ambiente do arquivo .env apenas em desenvolvimento
if (process.env.NODE_ENV !== "production") {
  require("dotenv/config");
}

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";
import type { Options as PinoHttpOptions } from "pino-http";
import { authRouter } from "./modules/auth/auth.route";
import { usersRouter } from "./modules/users/user.route";
import { carRouter } from "./modules/cars/car.route";

const app = express();
app.disable("etag");

app.use(helmet());
app.use(
  cors({
    origin: (() => {
      const raw = process.env.CORS_ORIGINS;
      if (!raw) return ["http://localhost:5173"];
      return raw
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => s.replace(/\/$/, "")); // remove trailing slash if present
    })(),
    credentials: true,
    // --- ALTERAÇÃO APLICADA AQUI ---
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser(process.env.COOKIE_SECRET));

// --- CONFIGURAÇÃO DO PINO ---
const pinoOptions: PinoHttpOptions = {};
if (process.env.NODE_ENV !== "production") {
  pinoOptions.transport = {
    target: "pino-pretty",
  };
}
app.use(pinoHttp(pinoOptions));

// Rota de Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// USAR AS ROTAS DA API
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/users", usersRouter);
app.use("/api/v1/cars", carRouter);

// MIDDLEWARE DE TRATAMENTO DE ERROS
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  req.log.error(err.stack);

  let statusCode = 500;
  const errorResponse = {
    erro: {
      codigo: "ERRO_INTERNO",
      mensagem: "Ocorreu um erro inesperado no servidor.",
    },
  };

  if (err.message.includes("Credenciais inválidas")) {
    statusCode = 401;
    errorResponse.erro.codigo = "AUTH_FALHOU";
    errorResponse.erro.mensagem = err.message;
  }

  res.status(statusCode).json(errorResponse);
});

export { app };
