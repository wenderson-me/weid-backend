import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import Task, { ITask } from '../models/task.model';
import Activity from '../models/activity.model';
import {
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterOptions,
  TaskResponse,
  TasksWithPagination,
  TaskStatistics,
  sanitizeTask
} from '../types/task.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING, ACTIVITY_TYPES } from '../utils/constants';

/**
 * Serviço de tarefas
 */
class TaskService {
  /**
   * Cria uma nova tarefa
   * @param taskData Dados da tarefa
   * @param userId ID do usuário criador
   * @returns Tarefa criada
   */
  public async createTask(taskData: CreateTaskInput, userId: string): Promise<TaskResponse> {

    const task = await Task.create({
      ...taskData,
      owner: userId,
      createdBy: userId,
    });


    await Activity.create({
      type: ACTIVITY_TYPES.TASK_CREATED,
      task: task._id,
      user: userId,
      description: `Tarefa criada: ${task.title}`,
    });

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    return sanitizeTask(populatedTask as ITask);
  }

  /**
   * Atualiza uma tarefa existente
   * @param taskId ID da tarefa
   * @param taskData Dados para atualização
   * @param userId ID do usuário que faz a atualização
   * @returns Tarefa atualizada
   */
  public async updateTask(taskId: string, taskData: UpdateTaskInput, userId: string): Promise<TaskResponse> {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

  if (task.status !== taskData.status && taskData.status) {
    const maxPositionTask = await Task.findOne({ status: taskData.status })
      .sort({ position: -1 })
      .limit(1);

    const newPosition = maxPositionTask ? maxPositionTask.position + 1 : 0;
    taskData.position = newPosition;
  }

    const statusChanged = taskData.status && taskData.status !== task.status;
    const oldStatus = task.status;

    Object.assign(task, {
      ...taskData,
      updatedBy: userId,
    });

    if (statusChanged) {
      switch (taskData.status) {
        case 'todo':
          if (task.progress !== 0) task.progress = 0;
        case 'inProgress':
          if (task.progress !== 10) task.progress = 10;
          break;
        case 'inReview':
          if (task.progress !== 70) task.progress = 70;
          break;
        case 'done':
          if (task.progress !== 100) task.progress = 100;
          break;
      }
    }

    await task.save();

    const activities = [];

    activities.push({
      type: ACTIVITY_TYPES.TASK_UPDATED,
      task: task._id,
      user: userId,
      description: `Tarefa atualizada: ${task.title}`,
      metadata: {
        changes: Object.keys(taskData),
      },
    });

    if (statusChanged) {
      activities.push({
        type: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
        task: task._id,
        user: userId,
        description: `Status alterado de ${oldStatus} para ${task.status}`,
        metadata: {
          oldStatus,
          newStatus: task.status,
        },
      });

      if (task.status === 'done') {
        activities.push({
          type: ACTIVITY_TYPES.TASK_COMPLETED,
          task: task._id,
          user: userId,
          description: 'Tarefa marcada como concluída',
        });
      } else if (oldStatus === 'done') {
        activities.push({
          type: ACTIVITY_TYPES.TASK_REOPENED,
          task: task._id,
          user: userId,
          description: 'Tarefa reaberta',
        });
      }
    }

    if ('dueDate' in taskData) {
      activities.push({
        type: ACTIVITY_TYPES.DUE_DATE_CHANGED,
        task: task._id,
        user: userId,
        description: taskData.dueDate
          ? `Data de entrega definida para ${new Date(taskData.dueDate).toLocaleDateString()}`
          : 'Data de entrega removida',
        metadata: {
          oldDueDate: task.dueDate ? task.dueDate.toISOString() : null,
          newDueDate: taskData.dueDate ? new Date(taskData.dueDate).toISOString() : null,
        },
      });
    }

    if ('isArchived' in taskData) {
      if (taskData.isArchived) {
        activities.push({
          type: ACTIVITY_TYPES.TASK_ARCHIVED,
          task: task._id,
          user: userId,
          description: 'Tarefa arquivada',
        });
      } else {
        activities.push({
          type: ACTIVITY_TYPES.TASK_REOPENED,
          task: task._id,
          user: userId,
          description: 'Tarefa desarquivada',
        });
      }
    }

    await Activity.insertMany(activities);

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    return sanitizeTask(populatedTask as ITask);
  }

  /**
   * Busca uma tarefa pelo ID
   * @param taskId ID da tarefa
   * @returns Tarefa encontrada
   */
  public async getTaskById(taskId: string): Promise<TaskResponse> {
    const task = await Task.findById(taskId)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    return sanitizeTask(task);
  }

  /**
   * Lista tarefas com filtros e paginação
   * @param options Opções de filtro e paginação
   * @returns Lista de tarefas e metadados de paginação
   */
  public async getTasks(options: TaskFilterOptions): Promise<TasksWithPagination> {
    const {
      status,
      priority,
      owner,
      assignee,
      search,
      tags,
      dueStart,
      dueEnd,
      isArchived = false,
      page = DEFAULT_PAGINATION.PAGE,
      limit = DEFAULT_PAGINATION.LIMIT,
      sortBy = DEFAULT_SORTING.TASKS.FIELD,
      sortOrder = DEFAULT_SORTING.TASKS.ORDER,
    } = options;

    const filter: any = { isArchived };

    const sort: any = {};
      sort[options.sortBy || DEFAULT_SORTING.TASKS.FIELD] = options.sortOrder === 'asc' ? 1 : -1;

    if (status) {
      filter.status = Array.isArray(status) ? { $in: status } : status;
    }

    if (priority) {
      filter.priority = Array.isArray(priority) ? { $in: priority } : priority;
    }

    if (options.sortBy !== 'position') {
      sort.position = 1;
    }

    if (owner) {
      filter.owner = new mongoose.Types.ObjectId(owner);
    }

    if (assignee) {
      filter.assignees = new mongoose.Types.ObjectId(assignee);
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (tags) {
      filter.tags = Array.isArray(tags)
        ? { $in: tags }
        : { $in: [tags] };
    }

    if (dueStart || dueEnd) {
      filter.dueDate = {};

      if (dueStart) {
        filter.dueDate.$gte = new Date(dueStart);
      }

      if (dueEnd) {
        filter.dueDate.$lte = new Date(dueEnd);
      }
    }

    const total = await Task.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    const tasks = await Task.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

      const sanitizedTasks = tasks.map(task => sanitizeTask(task));

    return {
      tasks: sanitizedTasks,
      total,
      page: currentPage,
      limit,
      pages,
    };
  }

  /**
   * Exclui uma tarefa pelo ID
   * @param taskId ID da tarefa
   * @returns Booleano indicando sucesso
   */
  public async deleteTask(taskId: string): Promise<boolean> {
    const result = await Task.findByIdAndDelete(taskId);

    if (!result) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    return true;
  }

  /**
   * Arquiva uma tarefa
   * @param taskId ID da tarefa
   * @param userId ID do usuário que está arquivando
   * @returns Tarefa arquivada
   */
  public async archiveTask(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await this.updateTask(taskId, { isArchived: true }, userId);
    return task;
  }

  /**
   * Restaura uma tarefa arquivada
   * @param taskId ID da tarefa
   * @param userId ID do usuário que está restaurando
   * @returns Tarefa restaurada
   */
  public async restoreTask(taskId: string, userId: string): Promise<TaskResponse> {
    const task = await this.updateTask(taskId, { isArchived: false }, userId);
    return task;
  }

  /**
   * Adiciona um usuário à lista de responsáveis da tarefa
   * @param taskId ID da tarefa
   * @param assigneeId ID do usuário a ser adicionado
   * @param userId ID do usuário que está realizando a operação
   * @returns Tarefa atualizada
   */
  public async assignUser(taskId: string, assigneeId: string, userId: string): Promise<TaskResponse> {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    const isAlreadyAssigned = task.assignees.some(
      (id) => id.toString() === assigneeId
    );

    if (isAlreadyAssigned) {
      throw new AppError('Usuário já está atribuído a esta tarefa', 400);
    }

    task.assignees.push(new mongoose.Types.ObjectId(assigneeId));
    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

    await Activity.create({
      type: ACTIVITY_TYPES.TASK_ASSIGNED,
      task: task._id,
      user: userId,
      description: `Usuário atribuído à tarefa`,
      metadata: {
        assigneeId,
      },
    });

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    return sanitizeTask(populatedTask as ITask);
  }

  /**
   * Remove um usuário da lista de responsáveis da tarefa
   * @param taskId ID da tarefa
   * @param assigneeId ID do usuário a ser removido
   * @param userId ID do usuário que está realizando a operação
   * @returns Tarefa atualizada
   */
  public async unassignUser(taskId: string, assigneeId: string, userId: string): Promise<TaskResponse> {
    const task = await Task.findById(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    const isAssigned = task.assignees.some(
      (id) => id.toString() === assigneeId
    );

    if (!isAssigned) {
      throw new AppError('Usuário não está atribuído a esta tarefa', 400);
    }

    task.assignees = task.assignees.filter(
      (id) => id.toString() !== assigneeId
    );
    task.updatedBy = new mongoose.Types.ObjectId(userId);
    await task.save();

    await Activity.create({
      type: ACTIVITY_TYPES.TASK_UNASSIGNED,
      task: task._id,
      user: userId,
      description: `Usuário removido da tarefa`,
      metadata: {
        assigneeId,
      },
    });

    const populatedTask = await Task.findById(task._id)
      .populate('owner', 'name email avatar')
      .populate('assignees', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    return sanitizeTask(populatedTask as ITask);
  }

  /**
   * Obtém estatísticas das tarefas
   * @param filters Filtros opcionais
   * @returns Estatísticas das tarefas
   */
  public async getTaskStatistics(filters: {
    owner?: string;
    assignee?: string;
    isArchived?: boolean;
  } = {}): Promise<TaskStatistics> {
    const { owner, assignee, isArchived = false } = filters;

    const baseFilter: any = { isArchived };

    if (owner) {
      baseFilter.owner = new mongoose.Types.ObjectId(owner);
    }

    if (assignee) {
      baseFilter.assignees = new mongoose.Types.ObjectId(assignee);
    }

    const total = await Task.countDocuments(baseFilter);

    const byStatus = {
      todo: await Task.countDocuments({ ...baseFilter, status: 'todo' }),
      inProgress: await Task.countDocuments({ ...baseFilter, status: 'inProgress' }),
      inReview: await Task.countDocuments({ ...baseFilter, status: 'inReview' }),
      done: await Task.countDocuments({ ...baseFilter, status: 'done' }),
    };

    const byPriority = {
      low: await Task.countDocuments({ ...baseFilter, priority: 'low' }),
      medium: await Task.countDocuments({ ...baseFilter, priority: 'medium' }),
      high: await Task.countDocuments({ ...baseFilter, priority: 'high' }),
      urgent: await Task.countDocuments({ ...baseFilter, priority: 'urgent' }),
    };

    const completed = byStatus.done;

    const overdue = await Task.countDocuments({
      ...baseFilter,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });

    const withoutAssignee = await Task.countDocuments({
      ...baseFilter,
      assignees: { $size: 0 },
    });

    return {
      total,
      byStatus,
      byPriority,
      completed,
      overdue,
      withoutAssignee,
    };
  }
}

export default new TaskService();