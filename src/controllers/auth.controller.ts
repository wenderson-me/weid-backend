import { Request, Response, NextFunction } from 'express';
import authService from '../services/auth.service';
import {
  successResponse,
  createdResponse,
  errorResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';

/**
 * Controlador de autenticação
 */
class AuthController {
  /**
   * Registra um novo usuário
   * @route POST /api/v1/auth/register
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await authService.register(req.body);
      return createdResponse(res, result, 'Usuário registrado com sucesso');
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
      return successResponse(res, result, MESSAGES.AUTH.LOGIN_SUCCESS);
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
      const { refreshToken } = req.body;
      const result = await authService.refreshToken(refreshToken);
      return successResponse(res, result, 'Token atualizado com sucesso');
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
      return successResponse(res, null, MESSAGES.AUTH.LOGOUT_SUCCESS);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();