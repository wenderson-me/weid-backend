import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';
import config from '../config/environment';

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

const handleAppError = (err: AppError, res: Response) => {
  return res.status(err.statusCode).json({
    status: 'error',
    message: err.message,
  });
};

const handleMongoDBError = (err: any, res: Response) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      status: 'error',
      message: `Valor duplicado para o campo '${field}'`,
    });
  }

  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((val: any) => val.message);
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'Erro no banco de dados',
  });
};

const handleJWTError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Token inválido. Por favor, faça login novamente.',
  });
};

const handleJWTExpiredError = (res: Response) => {
  return res.status(401).json({
    status: 'error',
    message: 'Seu token expirou. Por favor, faça login novamente.',
  });
};

export const errorMiddleware = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error('Error:', err);

  if (err instanceof AppError) {
    return handleAppError(err, res);
  }

  if (err.name === 'MongoError' || err.name === 'ValidationError' || (err as any).code === 11000) {
    return handleMongoDBError(err, res);
  }

  if (err.name === 'JsonWebTokenError') {
    return handleJWTError(res);
  }

  if (err.name === 'TokenExpiredError') {
    return handleJWTExpiredError(res);
  }

  const statusCode = (err as any).statusCode || 500;
  const message = err.message || 'Algo deu errado';

  if (config.NODE_ENV ) {
    return res.status(statusCode).json({
      status: 'error',
      message,
      stack: err.stack,
      error: err,
    });
  }

  return res.status(statusCode).json({
    status: 'error',
    message: statusCode === 500 ? 'Erro interno do servidor' : message,
  });
};