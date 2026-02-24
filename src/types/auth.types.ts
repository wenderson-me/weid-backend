import { Request } from 'express';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface IUser {
  id?: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
  refreshToken?: string;
  createdAt: Date;
  updatedAt: Date;

  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ILoginInput {
  email: string;
  password: string;
}

export interface IRefreshTokenInput {
  refreshToken: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IJwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface IAuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: UserRole;
  };
  tokens: IAuthTokens;
}

export interface IUpdateProfileInput {
  name?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

export interface ICreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface IUpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface IUserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IUserStats {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
  newUsersLastMonth: number;
}

export interface IValidationError {
  [field: string]: string;
}

export interface IErrorResponse {
  success: false;
  message: string;
  errors?: IValidationError;
  statusCode: number;
}

export interface ISuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  [key: string]: any;
}