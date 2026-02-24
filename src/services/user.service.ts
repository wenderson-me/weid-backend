import { Task, User, Activity, Comment, Note } from '../models';
import { AppError } from '../middleware/error.middleware';
import { UserPreferences } from '../models/user.model';
import { CreateUserInput, UpdateUserInput, sanitizeUser, UserResponse, UpdatePreferencesInput, UserStatistics } from '../types/user.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING, ACTIVITY_TYPES } from '../utils/constants';
import { Op } from 'sequelize';

/**
 * Serviço de usuários
 */
class UserService {
  /**
   * Cria um novo usuário
   * @param userData Dados do usuário
   * @returns Usuário criado
   */
  public async createUser(userData: CreateUserInput): Promise<UserResponse> {
    const existingUser = await User.findOne({ where: { email: userData.email } });

    if (existingUser) {
      throw new AppError(MESSAGES.VALIDATION.EMAIL_EXISTS, 409);
    }

    const user = await User.create(userData);

    return sanitizeUser(user);
  }

  /**
   * Atualiza um usuário existente
   * @param userId ID do usuário
   * @param userData Dados para atualização
   * @returns Usuário atualizado
   */
  public async updateUser(userId: string, userData: UpdateUserInput): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    if (userData.email && userData.email !== user.email) {
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        throw new AppError(MESSAGES.VALIDATION.EMAIL_EXISTS, 409);
      }
    }

    Object.assign(user, userData);
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      userId: userId,
      targetUserId: userId,
      description: 'Perfil de usuário atualizado',
      metadata: {
        changes: Object.keys(userData)
      }
    });

    return sanitizeUser(user);
  }

  /**
   * Busca um usuário pelo ID
   * @param userId ID do usuário
   * @returns Usuário encontrado
   */
  public async getUserById(userId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    return sanitizeUser(user);
  }

  /**
   * Exclui um usuário pelo ID
   * @param userId ID do usuário
   * @returns Booleano indicando sucesso
   */
  public async deleteUser(userId: string): Promise<boolean> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    await user.destroy();
    return true;
  }

  /**
   * Desativa um usuário sem excluí-lo
   * @param userId ID do usuário
   * @returns Usuário desativado
   */
  public async deactivateUser(userId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    user.isActive = false;
    await user.save();

    return sanitizeUser(user);
  }

  /**
   * Reativa um usuário desativado
   * @param userId ID do usuário
   * @returns Usuário reativado
   */
  public async activateUser(userId: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    user.isActive = true;
    await user.save();

    return sanitizeUser(user);
  }

  /**
   * Lista usuários com filtros e paginação
   * @param options Opções de filtro e paginação
   * @returns Lista de usuários e metadados de paginação
   */
  public async getUsers(options: {
    search?: string;
    role?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<{
    users: UserResponse[];
    total: number;
    page: number;
    limit: number;
    pages: number;
  }> {
    const {
      search,
      role,
      isActive,
      page = DEFAULT_PAGINATION.PAGE,
      limit = DEFAULT_PAGINATION.LIMIT,
      sortBy = DEFAULT_SORTING.USERS.FIELD,
      sortOrder = DEFAULT_SORTING.USERS.ORDER,
    } = options;

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (typeof isActive === 'boolean') {
      where.isActive = isActive;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
      ];
    }

    const total = await User.count({ where });

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages : page;
    const offset = (currentPage - 1) * limit;

    const users = await User.findAll({
      where,
      order: [[sortBy, sortOrder.toUpperCase()]],
      offset,
      limit,
    });

    const sanitizedUsers = users.map(user => sanitizeUser(user));

    return {
      users: sanitizedUsers,
      total,
      page: currentPage,
      limit,
      pages,
    };
  }

  /**
   * Atualiza as preferências do usuário
   * @param userId ID do usuário
   * @param preferencesData Dados de preferências para atualização
   * @returns Usuário atualizado
   */
  public async updatePreferences(userId: string, preferencesData: UpdatePreferencesInput): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    if (!user.preferences) {
      user.preferences = {} as UserPreferences;
    }

    if (preferencesData.theme) {
      user.preferences.theme = preferencesData.theme;
    }

    if (preferencesData.language) {
      user.preferences.language = preferencesData.language;
    }

    if (preferencesData.defaultTaskView) {
      user.preferences.defaultTaskView = preferencesData.defaultTaskView;
    }

    if (preferencesData.defaultTaskFilter) {
      user.preferences.defaultTaskFilter = {
        ...user.preferences.defaultTaskFilter,
        ...preferencesData.defaultTaskFilter
      };
    }

    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PREFERENCES_UPDATED,
      userId: userId,
      targetUserId: userId,
      description: 'Preferências do usuário atualizadas',
      metadata: {
        preferences: preferencesData
      }
    });

    return sanitizeUser(user);
  }

  /**
   * Atualiza o avatar do usuário
   * @param userId ID do usuário
   * @param avatarUrl URL do avatar
   * @returns Usuário atualizado
   */
  public async updateAvatar(userId: string, avatarUrl: string): Promise<UserResponse> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    user.avatar = avatarUrl;
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.AVATAR_CHANGED,
      userId: userId,
      targetUserId: userId,
      description: 'Avatar do usuário atualizado',
    });

    return sanitizeUser(user);
  }

  /**
   * Obtém estatísticas do usuário
   * @param userId ID do usuário
   * @returns Estatísticas do usuário
   */
  public async getUserStatistics(userId: string): Promise<UserStatistics> {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    const taskCounts = {
      total: await Task.count({ where: { assignees: { [Op.contains]: [userId] } } }),
      completed: await Task.count({ where: { assignees: { [Op.contains]: [userId] }, status: 'done' } }),
      overdue: await Task.count({
        where: {
          assignees: { [Op.contains]: [userId] },
          status: { [Op.ne]: 'done' },
          dueDate: { [Op.lt]: new Date() }
        }
      }),
      inProgress: await Task.count({ where: { assignees: { [Op.contains]: [userId] }, status: 'inProgress' } })
    };

    const noteCounts = {
      total: await Note.count({ where: { ownerId: userId } }),
      pinned: await Note.count({ where: { ownerId: userId, isPinned: true } })
    };

    const commentsCount = await Comment.count({ where: { authorId: userId } });

    return {
      tasks: taskCounts,
      notes: noteCounts,
      comments: commentsCount,
      lastLogin: user.lastLogin,
      memberSince: user.createdAt
    };
  }
}

export default new UserService();