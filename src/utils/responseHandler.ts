import { Response } from 'express';

/**
 * Interface para respostas padronizadas da API
 */
export interface ApiResponse<T> {
  status: 'success' | 'error';
  message?: string;
  data?: T;
  errors?: any;
  meta?: any;
}

/**
 * Retorna uma resposta de sucesso
 * @param res Objeto de resposta do Express
 * @param data Dados a serem retornados
 * @param message Mensagem de sucesso opcional
 * @param statusCode Código de status HTTP (padrão: 200)
 * @param meta Metadados adicionais
 */
export const successResponse = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200,
  meta?: any
): Response => {
  const response: ApiResponse<T> = {
    status: 'success',
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Retorna uma resposta de erro
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 * @param statusCode Código de status HTTP (padrão: 400)
 * @param errors Detalhes dos erros
 * @param meta Metadados adicionais
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode = 400,
  errors?: any,
  meta?: any
): Response => {
  const response: ApiResponse<null> = {
    status: 'error',
    message,
  };

  if (errors) response.errors = errors;
  if (meta) response.meta = meta;

  return res.status(statusCode).json(response);
};

/**
 * Retorna uma resposta de criação bem-sucedida
 * @param res Objeto de resposta do Express
 * @param data Dados do recurso criado
 * @param message Mensagem de sucesso opcional
 */
export const createdResponse = <T>(
  res: Response,
  data: T,
  message = 'Recurso criado com sucesso'
): Response => {
  return successResponse(res, data, message, 201);
};

/**
 * Retorna uma resposta de não encontrado
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 */
export const notFoundResponse = (
  res: Response,
  message = 'Recurso não encontrado'
): Response => {
  return errorResponse(res, message, 404);
};

/**
 * Retorna uma resposta de não autorizado
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 */
export const unauthorizedResponse = (
  res: Response,
  message = 'Não autorizado'
): Response => {
  return errorResponse(res, message, 401);
};

/**
 * Retorna uma resposta de proibido
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 */
export const forbiddenResponse = (
  res: Response,
  message = 'Acesso negado'
): Response => {
  return errorResponse(res, message, 403);
};

/**
 * Retorna uma resposta para conflito
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 */
export const conflictResponse = (
  res: Response,
  message = 'Conflito com recurso existente'
): Response => {
  return errorResponse(res, message, 409);
};

/**
 * Retorna uma resposta para erro interno do servidor
 * @param res Objeto de resposta do Express
 * @param message Mensagem de erro
 */
export const serverErrorResponse = (
  res: Response,
  message = 'Erro interno do servidor'
): Response => {
  return errorResponse(res, message, 500);
};