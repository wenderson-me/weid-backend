import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import Activity, { IActivity } from '../models/activity.model';
import Task from '../models/task.model';
import Note from '../models/note.model';
import User from '../models/user.model';
import {
  CreateActivityInput,
  ActivityFilterOptions,
  ActivityResponse,
  ActivitiesWithPagination,
  sanitizeActivity
} from '../types/activity.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING } from '../utils/constants';

/**
 * Serviço de atividades
 */
class ActivityService {
  /**
   * Cria uma nova atividade
   * @param activityData Dados da atividade
   * @param userId ID do usuário que realiza a ação
   * @returns Atividade criada
   */
  public async createActivity(activityData: CreateActivityInput, userId: string): Promise<ActivityResponse> {
    if (activityData.type.startsWith('task_') && activityData.task) {
      const taskExists = await Task.exists({ _id: activityData.task });
      if (!taskExists) {
        throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
      }
    } else if (activityData.type.startsWith('note_') && activityData.note) {
      const noteExists = await Note.exists({ _id: activityData.note });
      if (!noteExists) {
        throw new AppError(MESSAGES.NOT_FOUND.NOTE, 404);
      }
    } else if (activityData.targetUser) {
      const userExists = await User.exists({ _id: activityData.targetUser });
      if (!userExists) {
        throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
      }
    }

    const activity = await Activity.create({
      ...activityData,
      user: userId,
    });

    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    return sanitizeActivity(populatedActivity as IActivity);
  }

  /**
   * Busca uma atividade pelo ID
   * @param activityId ID da atividade
   * @returns Atividade encontrada
   */
  public async getActivityById(activityId: string): Promise<ActivityResponse> {
    const activity = await Activity.findById(activityId)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    if (!activity) {
      throw new AppError(MESSAGES.NOT_FOUND.ACTIVITY, 404);
    }

    return sanitizeActivity(activity);
  }

  /**
   * Lista atividades com filtros e paginação
   * @param options Opções de filtro e paginação
   * @returns Lista de atividades e metadados de paginação
   */
  public async getActivities(options: ActivityFilterOptions): Promise<ActivitiesWithPagination> {
    const {
      task,
      note,
      user,
      targetUser,
      type,
      createdStart,
      createdEnd,
      page = DEFAULT_PAGINATION.PAGE,
      limit = DEFAULT_PAGINATION.LIMIT,
      sortBy = DEFAULT_SORTING.ACTIVITIES.FIELD,
      sortOrder = DEFAULT_SORTING.ACTIVITIES.ORDER,
    } = options;

    const filter: any = {};

    if (task) {
      filter.task = new mongoose.Types.ObjectId(task);
    }

    if (note) {
      filter.note = new mongoose.Types.ObjectId(note);
    }

    if (user) {
      filter.user = new mongoose.Types.ObjectId(user);
    }

    if (targetUser) {
      filter.targetUser = new mongoose.Types.ObjectId(targetUser);
    }

    if (type) {
      filter.type = Array.isArray(type) ? { $in: type } : type;
    }

    if (createdStart || createdEnd) {
      filter.createdAt = {};

      if (createdStart) {
        filter.createdAt.$gte = new Date(createdStart);
      }

      if (createdEnd) {
        filter.createdAt.$lte = new Date(createdEnd);
      }
    }

    const total = await Activity.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    const activities = await Activity.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    const sanitizedActivities = activities.map(activity => sanitizeActivity(activity));

    return {
      activities: sanitizedActivities,
      total,
      page: currentPage,
      limit,
      pages,
    };
  }

  /**
   * Obtém o histórico de atividades de uma tarefa
   * @param taskId ID da tarefa
   * @param limit Limite de atividades a serem retornadas
   * @returns Lista de atividades
   */
  public async getTaskHistory(taskId: string, limit = 50): Promise<ActivityResponse[]> {
    const taskExists = await Task.exists({ _id: taskId });

    if (!taskExists) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    const activities = await Activity.find({ task: taskId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    return activities.map(activity => sanitizeActivity(activity));
  }

  /**
   * Obtém o histórico de atividades de uma nota
   * @param noteId ID da nota
   * @param limit Limite de atividades a serem retornadas
   * @returns Lista de atividades
   */
  public async getNoteHistory(noteId: string, limit = 50): Promise<ActivityResponse[]> {
    const noteExists = await Note.exists({ _id: noteId });

    if (!noteExists) {
      throw new AppError(MESSAGES.NOT_FOUND.NOTE, 404);
    }

    const activities = await Activity.find({ note: noteId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    return activities.map(activity => sanitizeActivity(activity));
  }

  /**
   * Obtém as atividades mais recentes do usuário
   * @param userId ID do usuário
   * @param limit Limite de atividades a serem retornadas
   * @returns Lista de atividades
   */
  public async getUserActivities(userId: string, limit = 20): Promise<ActivityResponse[]> {
    const activities = await Activity.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    return activities.map(activity => sanitizeActivity(activity));
  }

  /**
   * Obtém as atividades recentes relacionadas a um usuário específico
   * (tanto como ator quanto como alvo da ação)
   * @param userId ID do usuário
   * @param limit Limite de atividades a serem retornadas
   * @returns Lista de atividades
   */
  public async getUserRelatedActivities(userId: string, limit = 20): Promise<ActivityResponse[]> {
    const activities = await Activity.find({
      $or: [
        { user: userId },
        { targetUser: userId }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('user', 'name email avatar')
      .populate('targetUser', 'name email avatar');

    return activities.map(activity => sanitizeActivity(activity));
  }
}

export default new ActivityService();