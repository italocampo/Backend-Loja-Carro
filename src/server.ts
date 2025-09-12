import { app } from './app';
import pino from 'pino';

// Log 1: O servidor está prestes a iniciar.
console.log('[DEBUG] server.ts: Iniciando o arquivo do servidor...');

const logger = pino({ level: 'info' });

// --- CORREÇÃO DO TIPO DA PORTA ---
// Garante que a porta seja sempre um NÚMERO, convertendo a variável de ambiente.
const PORT = parseInt(process.env.PORT || '4000', 10);

try {
  // Log 2: Tentando escutar na porta.
  console.log(`[DEBUG] server.ts: Tentando iniciar o servidor na porta ${PORT} e no host 0.0.0.0`);

  app.listen(PORT, '0.0.0.0', () => {
    // Log 3: Servidor INICIADO com sucesso.
    console.log(`[DEBUG] server.ts: Servidor iniciado com SUCESSO. Escutando...`);
    logger.info(`API v1 rodando em http://localhost:${PORT}/api/v1`);
  });
} catch (error) {
  // Log 4: Se houver um erro AO TENTAR INICIAR o servidor.
  console.error('[DEBUG] server.ts: Ocorreu um erro FATAL ao tentar iniciar o servidor:', error);
  process.exit(1); // Encerra o processo se não conseguir nem iniciar.
}
