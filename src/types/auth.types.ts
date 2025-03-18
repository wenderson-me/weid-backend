// src/types/auth.types.ts - Tipos para autenticação e usuários
import { Request } from 'express';
import { Document, Types } from 'mongoose';

// Enum para papéis/roles de usuário
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

// Interface para usuário
export interface IUser extends Document {
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

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateAuthToken(): Promise<string>;
  generateRefreshToken(): Promise<string>;
}

// Interface estendida para Request com usuário autenticado
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    iat?: number;
    exp?: number;
  };
}

// Interface para dados de registro
export interface IRegisterInput {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Interface para dados de login
export interface ILoginInput {
  email: string;
  password: string;
}

// Interface para refresh token
export interface IRefreshTokenInput {
  refreshToken: string;
}

// Interface para tokens de autenticação
export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Interface para payload do JWT
export interface IJwtPayload {
  id: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Interface para resposta de autenticação
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

// Interface para atualização de perfil de usuário
export interface IUpdateProfileInput {
  name?: string;
  avatar?: string;
  currentPassword?: string;
  newPassword?: string;
  confirmNewPassword?: string;
}

// Interface para criar usuário (admin)
export interface ICreateUserInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
  isActive?: boolean;
}

// Interface para atualizar usuário (admin)
export interface IUpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  isActive?: boolean;
}

// Interface para filtro de usuários
export interface IUserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Interface para respostas paginadas
export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Interface para estatísticas de usuários
export interface IUserStats {
  total: number;
  byRole: Record<string, number>;
  active: number;
  inactive: number;
  newUsersLastMonth: number;
}

// Interface para erro de validação
export interface IValidationError {
  [field: string]: string;
}

// Interface para resposta de erro
export interface IErrorResponse {
  success: false;
  message: string;
  errors?: IValidationError;
  statusCode: number;
}

// Interface para resposta de sucesso
export interface ISuccessResponse<T = any> {
  success: true;
  message: string;
  data?: T;
  [key: string]: any;
}

// Estender a interface do modelo User para métodos estáticos
export interface IUserModel extends Document {
  findByEmailWithPassword: (email: string) => Promise<IUser | null>;
  findByRefreshToken: (refreshToken: string) => Promise<IUser | null>;
}