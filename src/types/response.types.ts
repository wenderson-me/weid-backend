// src/types/response.types.ts - Tipos para respostas da API

// Interface para erro de validação
export interface IValidationError {
  [field: string]: string;
}

// Interface base para resposta da API
export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode?: number;
  [key: string]: any;
}

// Interface para resposta de erro
export interface IErrorResponse extends IApiResponse {
  success: false;
  errors?: IValidationError;
  statusCode: number;
}

// Interface para resposta de sucesso
export interface ISuccessResponse<T = any> extends IApiResponse {
  success: true;
  data?: T;
}

// Interface para resposta paginada
export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

// Função para criar resposta de sucesso
export const createSuccessResponse = <T>(
  data?: T,
  message: string = 'Operação concluída com sucesso',
  statusCode: number = 200
): ISuccessResponse<T> => ({
  success: true,
  message,
  ...(data !== undefined && { data }),
  ...(statusCode !== 200 && { statusCode })
});

// Função para criar resposta de erro
export const createErrorResponse = (
  message: string = 'Ocorreu um erro',
  statusCode: number = 500,
  errors?: IValidationError
): IErrorResponse => ({
  success: false,
  message,
  statusCode,
  ...(errors && { errors })
});

// Função para criar resposta paginada
export const createPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
  message?: string
): IPaginatedResponse<T> => {
  const totalPages = Math.ceil(total / limit);

  return {
    success: true,
    data,
    total,
    page,
    limit,
    totalPages,
    ...(message && { message })
  };
};