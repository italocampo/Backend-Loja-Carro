// Log 1: O app.ts está prestes a iniciar.
console.log('[DEBUG] app.ts: Iniciando o arquivo da aplicação...');

// Carrega as variáveis de ambiente do arquivo .env apenas em desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
  // Log 2: Dotenv foi carregado.
  console.log('[DEBUG] app.ts: Variáveis de ambiente .env carregadas (modo desenvolvimento).');
} else {
  // Log 2: Dotenv foi ignorado.
  console.log('[DEBUG] app.ts: Ignorando .env (modo produção).');
}


import express, { Request, Response, NextFunction } from 'express';
// Log 3: Express foi importado.
console.log('[DEBUG] app.ts: Módulo Express importado.');

import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import type { Options as PinoHttpOptions } from 'pino-http';
import { authRouter } from './modules/auth/auth.route';
import { usersRouter } from './modules/users/user.route';
import { carRouter } from './modules/cars/car.route';

// Log 4: Todos os módulos foram importados.
console.log('[DEBUG] app.ts: Todos os módulos foram importados com sucesso.');


const app = express();
// Log 5: Instância do Express criada.
console.log('[DEBUG] app.ts: Instância do Express criada.');


app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGINS?.split(','),
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Log 6: Middlewares básicos configurados.
console.log('[DEBUG] app.ts: Middlewares (helmet, cors, json, etc.) configurados.');


// --- CONFIGURAÇÃO DO PINO ---
const pinoOptions: PinoHttpOptions = {};
if (process.env.NODE_ENV !== 'production') {
  pinoOptions.transport = {
    target: 'pino-pretty',
  };
}
app.use(pinoHttp(pinoOptions));
// Log 7: Pino logger configurado.
console.log('[DEBUG] app.ts: Pino logger configurado.');


// Rota de Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// USAR AS ROTAS DA API
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/cars', carRouter);
// Log 8: Rotas da API configuradas.
console.log('[DEBUG] app.ts: Rotas da API configuradas.');


// MIDDLEWARE DE TRATAMENTO DE ERROS
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log 9: Um erro foi capturado pelo middleware.
  console.error('[DEBUG] app.ts: Middleware de erro capturou um erro:', err);
  req.log.error(err.stack);

  let statusCode = 500;
  const errorResponse = {
    erro: {
      codigo: 'ERRO_INTERNO',
      mensagem: 'Ocorreu um erro inesperado no servidor.',
    },
  };

  if (err.message.includes('Credenciais inválidas')) {
    statusCode = 401;
    errorResponse.erro.codigo = 'AUTH_FALHOU';
    errorResponse.erro.mensagem = err.message;
  }

  res.status(statusCode).json(errorResponse);
});

// Log 10: Fim do arquivo app.ts, exportando app.
console.log('[DEBUG] app.ts: Fim da configuração. Exportando a instância do app.');
export { app };

