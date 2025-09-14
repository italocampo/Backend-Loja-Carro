console.log(`[PROVA DEFINITIVA] DATABASE_URL recebida: "${process.env.DATABASE_URL}"`);
import { app } from './app';
import { prisma } from './lib/prisma'; // Importe a instância do Prisma aqui
import pino from 'pino';

const logger = pino({ level: 'info' });
const PORT = parseInt(process.env.PORT || '4000', 10);

// Criamos uma função assíncrona para controlar a ordem da inicialização
async function startServer() {
  try {
    // Passo 1: "Pré-aquecer" - Tenta conectar ao banco de dados ANTES de tudo.
    console.log('[INFO] Conectando ao banco de dados...');
    await prisma.$connect();
    console.log('[SUCCESS] Conexão com o banco de dados estabelecida com sucesso!');

    // Passo 2: Apenas SE a conexão com o banco for um sucesso, inicia o servidor.
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`API v1 rodando em http://localhost:${PORT}/api/v1`);
      console.log(`[SUCCESS] Servidor escutando na porta ${PORT}. Aplicação pronta!`);
    });

  } catch (error) {
    // Se a conexão com o banco falhar, a aplicação nem tenta iniciar.
    console.error('[FATAL] Não foi possível conectar ao banco de dados. Encerrando aplicação.', error);
    await prisma.$disconnect();
    process.exit(1); // Encerra o processo com um código de erro.
  }
}

// Inicia todo o processo
startServer();