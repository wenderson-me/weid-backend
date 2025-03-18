import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import config from '../config/environment';

// Interface para erros customizados com status code
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handler para erros operacionais
const handleAppError = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    status: 'error',
    message: err.message,
  });
};

// Handler para erros do MongoDB
const handleMongoDBError = (err: any, res: Response) => {
  // Erros de duplicação (código 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      status: 'error',
      message: `Valor duplicado para o campo '${field}'`,
    });
  }

  // Erros de validação
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors,
    });
  }

  // Para outros erros do MongoDB
  return res.status(500).json({
    status: 'error',
    message: 'Erro no banco de dados',
  });
};

// Handler para erro de JWT
const handleJWTError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Token inválido. Por favor, faça login novamente.',
  });
};

// Handler para erro de JWT expirado
const handleJWTExpiredError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Seu token expirou. Por favor, faça login novamente.',
  });
};

// Middleware principal de tratamento de erros
export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log do erro
  logger.error('Error:', err);

  // Para AppError (erros operacionais)
  if (err instanceof AppError) {
    return handleAppError(err, res);
  }

  // Outros tipos de erros
  if (err.name === 'MongoError' || err.name === 'ValidationError' || (err as any).code === 11000) {
    return handleMongoDBError(err, res);
  }

  if (err.name === 'JsonWebTokenError') {
    return handleJWTError(res);
  }

  if (err.name === 'TokenExpiredError') {
    return handleJWTExpiredError(res);
  }

  // Para erros não tratados
  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Algo deu errado';

  // No ambiente de desenvolvimento, retorna o stack trace
  if (config.NODE_ENV === 'development') {
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
      error: err,
    });
  }

  // Em produção, não expõe detalhes do erro
  return res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Erro interno do servidor' : message,
  });
};