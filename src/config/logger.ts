import winston from 'winston';
import fs from 'fs';
import path from 'path';
import config from './environment';

// Cria o diretório de logs se não existir
const logDir = path.dirname(config.LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Define o formato de log
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Cria o logger
const logger = winston.createLogger({
  level: config.LOG_LEVEL,
  format: logFormat,
  defaultMeta: { service: 'weid-api' },
  transports: [
    // Escreve todos os logs com nível `error` ou abaixo em `error.log`
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error'
    }),
    // Escreve todos os logs em `combined.log`
    new winston.transports.File({
      filename: config.LOG_FILE
    }),
  ],
  exitOnError: false,
});

// Se não estiver em produção, também loga no console
if (config.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Cria um stream para o Morgan
export const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export default logger;