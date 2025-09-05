import { app } from './app';
import pino from 'pino';

const logger = pino({ level: 'info' });
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  logger.info(`API v1 rodando em http://localhost:${PORT}/api/v1`);
});