import { AppError } from '../middleware/error.middleware';
import { Task, Activity, User } from '../models';
import { Op } from 'sequelize';
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
      ownerId: userId,
      createdById: userId,
    });

    await Activity.create({
      type: ACTIVITY_TYPES.TASK_CREATED,
      taskId: task.id,
      userId: userId,
      description: `Tarefa criada: ${task.title}`,
    });

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

    return sanitizeTask(populatedTask!);
  }

  /**
   * Atualiza uma tarefa existente
   * @param taskId ID da tarefa
   * @param taskData Dados para atualização
   * @param userId ID do usuário que faz a atualização
   * @returns Tarefa atualizada
   */
  public async updateTask(taskId: string, taskData: UpdateTaskInput, userId: string): Promise<TaskResponse> {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    if (task.status !== taskData.status && taskData.status) {
      const maxPositionTask = await Task.findOne({
        where: { status: taskData.status },
        order: [['position', 'DESC']],
        limit: 1
      });

      const newPosition = maxPositionTask ? maxPositionTask.position + 1 : 0;
      taskData.position = newPosition;
    }

    const statusChanged = taskData.status && taskData.status !== task.status;
    const oldStatus = task.status;

    Object.assign(task, {
      ...taskData,
      updatedById: userId,
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
      taskId: task.id,
      userId: userId,
      description: `Tarefa atualizada: ${task.title}`,
      metadata: {
        changes: Object.keys(taskData),
      },
    });

    if (statusChanged) {
      activities.push({
        type: ACTIVITY_TYPES.TASK_STATUS_CHANGED,
        taskId: task.id,
        userId: userId,
        description: `Status alterado de ${oldStatus} para ${task.status}`,
        metadata: {
          oldStatus,
          newStatus: task.status,
        },
      });

      if (task.status === 'done') {
        activities.push({
          type: ACTIVITY_TYPES.TASK_COMPLETED,
          taskId: task.id,
          userId: userId,
          description: 'Tarefa marcada como concluída',
        });
      } else if (oldStatus === 'done') {
        activities.push({
          type: ACTIVITY_TYPES.TASK_REOPENED,
          taskId: task.id,
          userId: userId,
          description: 'Tarefa reaberta',
        });
      }
    }

    if ('dueDate' in taskData) {
      activities.push({
        type: ACTIVITY_TYPES.DUE_DATE_CHANGED,
        taskId: task.id,
        userId: userId,
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
          taskId: task.id,
          userId: userId,
          description: 'Tarefa arquivada',
        });
      } else {
        activities.push({
          type: ACTIVITY_TYPES.TASK_REOPENED,
          taskId: task.id,
          userId: userId,
          description: 'Tarefa desarquivada',
        });
      }
    }

    await Activity.bulkCreate(activities);

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'updatedBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

    return sanitizeTask(populatedTask!);
  }

  /**
   * Busca uma tarefa pelo ID
   * @param taskId ID da tarefa
   * @returns Tarefa encontrada
   */
  public async getTaskById(taskId: string): Promise<TaskResponse> {
    const task = await Task.findByPk(taskId, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'updatedBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

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

    const where: any = { isArchived };

    const order: any[] = [];
    order.push([options.sortBy || DEFAULT_SORTING.TASKS.FIELD, options.sortOrder === 'asc' ? 'ASC' : 'DESC']);

    if (status) {
      where.status = Array.isArray(status) ? { [Op.in]: status } : status;
    }

    if (priority) {
      where.priority = Array.isArray(priority) ? { [Op.in]: priority } : priority;
    }

    if (options.sortBy !== 'position') {
      order.push(['position', 'ASC']);
    }

    if (owner) {
      where.ownerId = owner;
    }

    if (assignee) {
      where.assignees = { [Op.contains]: [assignee] };
    }

    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } },
      ];
    }

    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      where.tags = { [Op.overlap]: tagsArray };
    }

    if (dueStart || dueEnd) {
      where.dueDate = {};

      if (dueStart) {
        where.dueDate[Op.gte] = new Date(dueStart);
      }

      if (dueEnd) {
        where.dueDate[Op.lte] = new Date(dueEnd);
      }
    }

    const total = await Task.count({ where });

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const offset = (currentPage - 1) * limit;

    const tasks = await Task.findAll({
      where,
      order,
      offset,
      limit,
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'updatedBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

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
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    await task.destroy();
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
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    const isAlreadyAssigned = task.assignees.includes(assigneeId);

    if (isAlreadyAssigned) {
      throw new AppError('Usuário já está atribuído a esta tarefa', 400);
    }

    task.assignees = [...task.assignees, assigneeId];
    task.updatedById = userId;
    await task.save();

    await Activity.create({
      type: ACTIVITY_TYPES.TASK_ASSIGNED,
      taskId: task.id,
      userId: userId,
      description: `Usuário atribuído à tarefa`,
      metadata: {
        assigneeId,
      },
    });

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'updatedBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

    return sanitizeTask(populatedTask!);
  }

  /**
   * Remove um usuário da lista de responsáveis da tarefa
   * @param taskId ID da tarefa
   * @param assigneeId ID do usuário a ser removido
   * @param userId ID do usuário que está realizando a operação
   * @returns Tarefa atualizada
   */
  public async unassignUser(taskId: string, assigneeId: string, userId: string): Promise<TaskResponse> {
    const task = await Task.findByPk(taskId);

    if (!task) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    const isAssigned = task.assignees.includes(assigneeId);

    if (!isAssigned) {
      throw new AppError('Usuário não está atribuído a esta tarefa', 400);
    }

    task.assignees = task.assignees.filter(id => id !== assigneeId);
    task.updatedById = userId;
    await task.save();

    await Activity.create({
      type: ACTIVITY_TYPES.TASK_UNASSIGNED,
      taskId: task.id,
      userId: userId,
      description: `Usuário removido da tarefa`,
      metadata: {
        assigneeId,
      },
    });

    const populatedTask = await Task.findByPk(task.id, {
      include: [
        { model: User, as: 'owner', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'createdBy', attributes: ['name', 'email', 'avatar'] },
        { model: User, as: 'updatedBy', attributes: ['name', 'email', 'avatar'] }
      ]
    });

    return sanitizeTask(populatedTask!);
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

    const baseWhere: any = { isArchived };

    if (owner) {
      baseWhere.ownerId = owner;
    }

    if (assignee) {
      baseWhere.assignees = { [Op.contains]: [assignee] };
    }

    const total = await Task.count({ where: baseWhere });

    const byStatus = {
      todo: await Task.count({ where: { ...baseWhere, status: 'todo' } }),
      inProgress: await Task.count({ where: { ...baseWhere, status: 'inProgress' } }),
      inReview: await Task.count({ where: { ...baseWhere, status: 'inReview' } }),
      done: await Task.count({ where: { ...baseWhere, status: 'done' } }),
    };

    const byPriority = {
      low: await Task.count({ where: { ...baseWhere, priority: 'low' } }),
      medium: await Task.count({ where: { ...baseWhere, priority: 'medium' } }),
      high: await Task.count({ where: { ...baseWhere, priority: 'high' } }),
      urgent: await Task.count({ where: { ...baseWhere, priority: 'urgent' } }),
    };

    const completed = byStatus.done;

    const overdue = await Task.count({
      where: {
        ...baseWhere,
        status: { [Op.ne]: 'done' },
        dueDate: { [Op.lt]: new Date() },
      }
    });

    const withoutAssignee = await Task.count({
      where: {
        ...baseWhere,
        assignees: { [Op.eq]: [] },
      }
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