import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

const app = express();

// Middlewares essenciais
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(","),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const pinoConfig = pinoHttp({
  transport: process.env.NODE_ENV !== "production" // <-- Mude para !==
    ? { // Se NÃO FOR produção (ou seja, desenvolvimento)...
        target: 'pino-pretty', // ... use o formatador bonito
        options: {
          colorize: true,
          levelFirst: true,
          translateTime: 'SYS:dd-mm-yyyy HH:MM:ss',
        },
      }
    : undefined, // Se FOR produção, use undefined (logs em JSON puro)
});

app.use(pinoConfig);

// Rota de Health Check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// TODO: Importar e usar as rotas da API com prefixo /api/v1
// Ex: app.use('/api/v1', apiRoutes);

export { app };
