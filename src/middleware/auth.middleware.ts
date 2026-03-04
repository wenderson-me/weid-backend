import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import config from '../config/environment';
import { User } from '../models';

declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware de autenticação
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    else if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Você não está logado! Por favor, faça login para ter acesso.', 401)
      );
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return next(
        new AppError('Token inválido', 401)
      );
    }

    try {
      const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
      if (header.alg && header.alg !== 'HS256') {
        console.warn(`[Auth] JWT com algoritmo não permitido: ${header.alg}`);
        return next(
          new AppError('Algoritmo JWT não suportado', 401)
        );
      }
      if (!header.alg) {
        console.warn(`[Auth] JWT sem algoritmo especificado`);
        return next(
          new AppError('JWT inválido: sem algoritmo', 401)
        );
      }
    } catch (e) {
      console.warn(`[Auth] Erro ao decodificar header JWT:`, e);
      return next(
        new AppError('Token malformado', 401)
      );
    }

    let decoded;
    try {
      decoded = jwt.verify(token, config.JWT_SECRET, {
        algorithms: ['HS256']
      }) as jwt.JwtPayload;
    } catch (jwtError: any) {
      console.warn(`[Auth] Erro ao verificar JWT:`, jwtError.message);
      return next(
        new AppError('Token inválido ou expirado', 401)
      );
    }

    const currentUser = await User.findByPk(decoded.id, {
      attributes: { include: ['passwordChangedAt'] }
    });

    if (!currentUser) {
      return next(
        new AppError('O usuário deste token não existe mais.', 401)
      );
    }

    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        new Date(currentUser.passwordChangedAt).getTime() / 1000
      );

      if (decoded.iat && changedTimestamp > decoded.iat) {
        return next(
          new AppError('Usuário alterou a senha recentemente! Por favor, faça login novamente.', 401)
        );
      }
    }

    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Falha na autenticação', 401));
  }
};

/**
 * Middleware que restringe o acesso a endpoints administrativos
 * @param roles Lista de papéis permitidos (ex: ['admin'])
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Você não tem permissão para realizar esta ação', 403)
      );
    }

    next();
  };
};