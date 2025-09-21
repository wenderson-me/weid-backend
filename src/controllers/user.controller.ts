import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';
import {
  successResponse,
  createdResponse,
  notFoundResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';

/**
 * Controlador de usuários
 */
class UserController {
  /**
   * Cria um novo usuário
   * @route POST /api/v1/users
   */
  public async createUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.createUser(req.body);
      return createdResponse(res, user, 'Usuário criado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um usuário existente
   * @route PUT /api/v1/users/:id
   */
  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      return successResponse(res, user, 'Usuário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um usuário pelo ID
   * @route GET /api/v1/users/:id
   */
  public async getUserById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.getUserById(req.params.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Exclui um usuário pelo ID
   * @route DELETE /api/v1/users/:id
   */
  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await userService.deleteUser(req.params.id);
      return successResponse(res, null, 'Usuário excluído com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Desativa um usuário
   * @route PATCH /api/v1/users/:id/deactivate
   */
  public async deactivateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.deactivateUser(req.params.id);
      return successResponse(res, user, 'Usuário desativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reativa um usuário
   * @route PATCH /api/v1/users/:id/activate
   */
  public async activateUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.activateUser(req.params.id);
      return successResponse(res, user, 'Usuário reativado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista usuários com filtros e paginação
   * @route GET /api/v1/users
   */
  public async getUsers(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const {
        search,
        role,
        isActive,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await userService.getUsers({
        search: search as string,
        role: role as string,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
        page: page ? parseInt(page as string) : undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        sortBy: sortBy as string,
        sortOrder: (sortOrder as 'asc' | 'desc') || undefined,
      });

      return successResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém o perfil do usuário logado
   * @route GET /api/v1/users/profile
   */
  public async getProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await userService.getUserById(req.user.id);
      return successResponse(res, user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza o perfil do usuário logado
   * @route PUT /api/v1/users/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const allowedUpdates = {
        name: req.body.name,
        avatar: req.body.avatar,
      };

      const user = await userService.updateUser(req.user.id, allowedUpdates);
      return successResponse(res, user, 'Perfil atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
 * Atualiza as preferências do usuário logado
 * @route PUT /api/v1/users/profile/preferences
 */
public async updatePreferences(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const user = await userService.updatePreferences(req.user.id, req.body);
    return successResponse(res, user, 'Preferências atualizadas com sucesso');
  } catch (error) {
    next(error);
  }
}

/**
 * Atualiza o avatar do usuário logado
 * @route PUT /api/v1/users/profile/avatar
 */
public async updateAvatar(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const avatarUrl = req.body.avatar;

    const user = await userService.updateAvatar(req.user.id, avatarUrl);
    return successResponse(res, user, 'Avatar atualizado com sucesso');
  } catch (error) {
    next(error);
  }
}

/**
 * Desativa a conta do usuário logado
 * @route PATCH /api/v1/users/profile/deactivate
 */
public async deactivateOwnAccount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const user = await userService.deactivateUser(req.user.id);
    return successResponse(res, null, 'Sua conta foi desativada com sucesso');
  } catch (error) {
    next(error);
  }
}

/**
 * Obtém estatísticas do usuário logado
 * @route GET /api/v1/users/profile/statistics
 */
public async getProfileStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
  try {
    const statistics = await userService.getUserStatistics(req.user.id);
    return successResponse(res, statistics);
  } catch (error) {
    next(error);
  }
}
}

export default new UserController();