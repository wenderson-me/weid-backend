import jwt from 'jsonwebtoken';
import config from '../config/environment';
import { IUser } from '../models/user.model';
import { UserTokens } from '../types/user.types';

/**
 * Gera um token JWT de acesso
 * @param user Usuário para o qual gerar o token
 * @returns Token JWT assinado
 */
export const generateAccessToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
    },
    config.JWT_SECRET
  );
};

/**
 * Gera um token JWT de refresh
 * @param user Usuário para o qual gerar o token
 * @returns Token JWT assinado
 */
export const generateRefreshToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
    },
    config.JWT_SECRET
  );
};

/**
 * Gera ambos os tokens (acesso e refresh) para um usuário
 * @param user Usuário para o qual gerar os tokens
 * @returns Objeto contendo ambos os tokens
 */
export const generateTokens = (user: IUser): UserTokens => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user)

  return {
    accessToken,
    refreshToken

  };
};

/**
 * Verifica e decodifica um token JWT
 * @param token Token JWT a ser verificado
 * @returns Payload decodificado ou null se inválido
 */
export const verifyToken = (token: string): jwt.JwtPayload | null => {
  try {
    return jwt.verify(token, config.JWT_SECRET) as jwt.JwtPayload;
  } catch (error) {
    return null;
  }
};

/**
 * Gera um token para redefinição de senha
 * @param user Usuário para o qual gerar o token
 * @returns Token JWT assinado
 */
export const generatePasswordResetToken = (user: IUser): string => {
  return jwt.sign(
    {
      id: user._id,
      version: user.password.substring(0, 10),
    },
    config.JWT_SECRET,
  );
};