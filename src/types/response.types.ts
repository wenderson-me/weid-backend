export interface IValidationError {
  [field: string]: string;
}

export interface IApiResponse<T = any> {
  success: boolean;
  message: string;
  statusCode?: number;
  [key: string]: any;
}

export interface IErrorResponse extends IApiResponse {
  success: false;
  errors?: IValidationError;
  statusCode: number;
}

export interface ISuccessResponse<T = any> extends IApiResponse {
  success: true;
  data?: T;
}

export interface IPaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  message?: string;
}

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