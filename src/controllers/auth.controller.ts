import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import {
  successResponse,
  createdResponse,
  errorResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: 'lax' as const,
  path: '/',
};
const ACCESS_TOKEN_EXPIRY  = 15 * 60 * 1000;
const REFRESH_TOKEN_EXPIRY = 7  * 24 * 60 * 60 * 1000;

function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }) {
  res.cookie('accessToken', tokens.accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_EXPIRY,
  });
  res.cookie('refreshToken', tokens.refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_EXPIRY,
    path: '/api/v1/auth/refresh-token',
  });
}

function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken',  { ...COOKIE_OPTIONS });
  res.clearCookie('refreshToken', { ...COOKIE_OPTIONS, path: '/api/v1/auth/refresh-token' });
}

class AuthController {
  /**
   * Registra um novo usuário
   * @route POST /api/v1/auth/register
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.tokens);
      return createdResponse(res, { user: result.user }, 'Usuário registrado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realiza login do usuário
   * @route POST /api/v1/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await authService.login(req.body);
      setAuthCookies(res, result.tokens);
      return successResponse(res, { user: result.user }, MESSAGES.AUTH.LOGIN_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza o token de acesso utilizando o token de refresh
   * @route POST /api/v1/auth/refresh-token
   */
  public async refreshToken(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken) {
        return errorResponse(res, 'Refresh token não fornecido', 401);
      }
      const result = await authService.refreshToken(refreshToken);
      setAuthCookies(res, result);
      return successResponse(res, null, 'Token atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna os dados do usuário autenticado
   * @route GET /api/v1/auth/me
   */
  public async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        isActive: req.user.isActive,
        isVerified: req.user.isVerified,
        lastLogin: req.user.lastLogin,
        preferences: req.user.preferences,
      };
      return successResponse(res, user, 'Dados do usuário recuperados com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Altera a senha do usuário logado
   * @route POST /api/v1/auth/change-password
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await authService.changePassword(req.user.id, req.body);
      return successResponse(res, null, MESSAGES.AUTH.PASSWORD_CHANGE_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Solicita redefinição de senha
   * @route POST /api/v1/auth/forgot-password
   */
  public async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await authService.forgotPassword(req.body);
      return successResponse(res, null, MESSAGES.AUTH.PASSWORD_RESET_EMAIL_SENT);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Redefine a senha do usuário
   * @route POST /api/v1/auth/reset-password
   */
  public async resetPassword(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await authService.resetPassword(req.body);
      return successResponse(res, null, MESSAGES.AUTH.PASSWORD_RESET_SUCCESS);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Realiza logout (para futuras implementações com blacklist de tokens)
   * @route POST /api/v1/auth/logout
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await authService.logout(req.user.id);
      clearAuthCookies(res);
      return successResponse(res, null, MESSAGES.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();