import rateLimit from 'express-rate-limit';
import config from '../config/environment';

/**
 * Rate limiter padrão para todas as rotas
 */
export const defaultLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas requisições, por favor tente novamente mais tarde'
  }
});

/**
 * Rate limiter mais restritivo para rotas sensíveis como auth
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // limitar cada IP a 10 requisições por janela
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de login, tente novamente após 15 minutos'
  }
});