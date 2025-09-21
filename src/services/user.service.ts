import Task from '../models/task.model';
import { AppError } from '../middleware/error.middleware';
import User, { IUser, UserPreferences } from '../models/user.model';
import Activity from '../models/activity.model';
import { CreateUserInput, UpdateUserInput, sanitizeUser, UserResponse, UpdatePreferencesInput, UserStatistics } from '../types/user.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING, ACTIVITY_TYPES } from '../utils/constants';
import Comment from '../models/comment.model';
import Note from '../models/note.model';

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
    const existingUser = await User.findOne({ email: userData.email });

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
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    if (userData.email && userData.email !== user.email) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        throw new AppError(MESSAGES.VALIDATION.EMAIL_EXISTS, 409);
      }
    }

    Object.assign(user, userData);
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      user: userId,
      targetUser: userId,
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
    const user = await User.findById(userId);

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
    const result = await User.findByIdAndDelete(userId);

    if (!result) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    return true;
  }

  /**
   * Desativa um usuário sem excluí-lo
   * @param userId ID do usuário
   * @returns Usuário desativado
   */
  public async deactivateUser(userId: string): Promise<UserResponse> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    return sanitizeUser(user);
  }

  /**
   * Reativa um usuário desativado
   * @param userId ID do usuário
   * @returns Usuário reativado
   */
  public async activateUser(userId: string): Promise<UserResponse> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

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

    const filter: any = {};

    if (role) {
      filter.role = role;
    }

    if (typeof isActive === 'boolean') {
      filter.isActive = isActive;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await User.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages : page;
    const skip = (currentPage - 1) * limit;

    const users = await User.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit);

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
    const user = await User.findById(userId);

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
      user: userId,
      targetUser: userId,
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
    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl },
      { new: true }
    );

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    await Activity.create({
      type: ACTIVITY_TYPES.AVATAR_CHANGED,
      user: userId,
      targetUser: userId,
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
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    const taskCounts = {
      total: await Task.countDocuments({ assignees: userId }),
      completed: await Task.countDocuments({ assignees: userId, status: 'done' }),
      overdue: await Task.countDocuments({
        assignees: userId,
        status: { $ne: 'done' },
        dueDate: { $lt: new Date() }
      }),
      inProgress: await Task.countDocuments({ assignees: userId, status: 'inProgress' })
    };

    const noteCounts = {
      total: await Note.countDocuments({ owner: userId }),
      pinned: await Note.countDocuments({ owner: userId, isPinned: true })
    };

    const commentsCount = await Comment.countDocuments({ author: userId });

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