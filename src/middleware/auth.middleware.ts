import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error.middleware';
import config from '../config/environment';
import User from '../models/user.model';

// Estende a interface Request para incluir o usuário
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * Middleware de autenticação que verifica se o usuário está autenticado
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // 1) Verificar se o token existe no header
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Você não está logado! Por favor, faça login para ter acesso.', 401)
      );
    }

    // 2) Verificar se o token é válido
    const decoded = jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;

    // 3) Verificar se o usuário ainda existe
    const currentUser = await User.findById(decoded.id).select('+passwordChangedAt');
    if (!currentUser) {
      return next(
        new AppError('O usuário deste token não existe mais.', 401)
      );
    }

    // 4) Verificar se o usuário alterou a senha depois que o token foi emitido
    if (currentUser.passwordChangedAt) {
      const changedTimestamp = Math.floor(
        new Date(currentUser.passwordChangedAt).getTime() / 1000
      );

      // Se a senha foi alterada após a emissão do token
      if (decoded.iat && changedTimestamp > decoded.iat) {
        return next(
          new AppError('Usuário alterou a senha recentemente! Por favor, faça login novamente.', 401)
        );
      }
    }

    // 5) Conceder acesso à rota protegida
    req.user = currentUser;
    next();
  } catch (error) {
    return next(new AppError('Falha na autenticação', 401));
  }
};

/**
 * Middleware que restringe o acesso a determinadas funções com base no papel do usuário
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Verifica se o usuário tem um dos papéis requeridos
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        new AppError('Você não tem permissão para realizar esta ação', 403)
      );
    }

    next();
  };
};