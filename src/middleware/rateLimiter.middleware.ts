import rateLimit from 'express-rate-limit';
import config from '../config/environment';
import { Request } from 'express';

/**
 * Configuração para reconhecer IP real do cliente atrás de proxies
 */
const trustProxyConfig = {

  keyGenerator: (req: Request) => {
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIp = req.headers['x-real-ip'];

    let ip = '';

    if (typeof xForwardedFor === 'string') {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (typeof xRealIp === 'string') {
      ip = xRealIp;
    } else {
      ip = req.ip || '0.0.0.0';
    }

    console.log(`Requisição de IP: ${ip}`);
    return ip;
  }
};

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
  },
  ...trustProxyConfig
});

/**
 * Rate limiter mais restritivo para rotas sensíveis como auth
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de login, tente novamente após 15 minutos'
  },
  ...trustProxyConfig
});