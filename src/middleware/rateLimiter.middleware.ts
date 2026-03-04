import rateLimit from 'express-rate-limit';
import config from '../config/environment';
import { Request } from 'express';

const trustProxyConfig = {
  keyGenerator: (req: Request) => {
    const cloudflareIp = req.headers['cf-connecting-ip'];
    const xForwardedFor = req.headers['x-forwarded-for'];
    const xRealIp = req.headers['x-real-ip'];
    const xClientIp = req.headers['x-client-ip'];

    let ip = '';

    if (typeof cloudflareIp === 'string') {
      ip = cloudflareIp;
    } else if (typeof xForwardedFor === 'string') {
      ip = xForwardedFor.split(',')[0].trim();
    } else if (typeof xRealIp === 'string') {
      ip = xRealIp;
    } else if (typeof xClientIp === 'string') {
      ip = xClientIp;
    } else {
      ip = req.ip || req.socket?.remoteAddress || '0.0.0.0';
    }

    if (config.NODE_ENV === 'development') {
      console.log(`[Rate Limit] IP detectado: ${ip} | Headers: cf=${cloudflareIp} xff=${xForwardedFor} xri=${xRealIp}`);
    }

    return ip;
  }
};

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

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Muitas tentativas de autenticação, tente novamente após 15 minutos'
  },
  skip: () => config.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      status: 'error',
      message: 'Muitas tentativas de autenticação, tente novamente após 15 minutos'
    });
  },
  ...trustProxyConfig
});