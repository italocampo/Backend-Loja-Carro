import { app } from './app';
import pino from 'pino';

const logger = pino({ level: 'info' });
const PORT = process.env.PORT || 4000;

// A MUDANÇA ESTÁ AQUI: Adicionamos '0.0.0.0'
// Isso permite que o servidor aceite conexões de fora do contêiner.
app.listen(Number(PORT), '0.0.0.0', () => {
  // A mensagem de log não precisa mudar, é apenas um texto informativo.
  logger.info(`API v1 rodando em http://localhost:${PORT}/api/v1`);
});
