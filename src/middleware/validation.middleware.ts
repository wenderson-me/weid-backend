import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from './error.middleware';

/**
 * Middleware para validação de dados com Joi
 * @param schema - Schema do Joi para validação
 * @param property - Propriedade do request a ser validada (body, params, query)
 */
export const validate = (
  schema: Joi.ObjectSchema,
  property: 'body' | 'query' | 'params' = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (!error) {
      return next();
    }

    const errorDetails = error.details.map((detail) => ({
      message: detail.message,
      path: detail.path,
    }));

    return next(
      new AppError(
        `Erro de validação: ${errorDetails.map(e => e.message).join(', ')}`,
        400
      )
    );
  };
};