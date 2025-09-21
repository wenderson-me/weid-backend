import { Request, Response, NextFunction } from 'express';
import taskService from '../services/task.service';
import {
  successResponse,
  createdResponse,
} from '../utils/responseHandler';
import User from '@/models/user.model';

/**
 * Controlador de tarefas
 */
class TaskController {
  /**
   * Cria uma nova tarefa
   * @route POST /api/v1/tasks
   */
  public async createTask(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.createTask(req.body, req.user.id);
      return createdResponse(res, task, 'Tarefa criada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma tarefa existente
   * @route PUT /api/v1/tasks/:id
   */
  public async updateTask(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.updateTask(req.params.id, req.body, req.user.id);
      return successResponse(res, task, 'Tarefa atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma tarefa pelo ID
   * @route GET /api/v1/tasks/:id
   */
  public async getTaskById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.getTaskById(req.params.id);
      return successResponse(res, task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista tarefas com filtros e paginação
   * @route GET /api/v1/tasks
   */
  public async getTasks(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const {
        status,
        priority,
        owner,
        assignee,
        search,
        tags,
        dueStart,
        dueEnd,
        isArchived,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await taskService.getTasks({
        status: status as any,
        priority: priority as any,
        owner: owner as string,
        assignee: assignee as string,
        search: search as string,
        tags: tags as any,
        dueStart: dueStart ? new Date(dueStart as string) : undefined,
        dueEnd: dueEnd ? new Date(dueEnd as string) : undefined,
        isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
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
   * Exclui uma tarefa pelo ID
   * @route DELETE /api/v1/tasks/:id
   */
  public async deleteTask(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await taskService.deleteTask(req.params.id);
      return successResponse(res, null, 'Tarefa excluída com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Arquiva uma tarefa
   * @route PATCH /api/v1/tasks/:id/archive
   */
  public async archiveTask(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.archiveTask(req.params.id, req.user.id);
      return successResponse(res, task, 'Tarefa arquivada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Restaura uma tarefa arquivada
   * @route PATCH /api/v1/tasks/:id/restore
   */
  public async restoreTask(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.restoreTask(req.params.id, req.user.id);
      return successResponse(res, task, 'Tarefa restaurada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona um usuário à lista de responsáveis da tarefa
   * @route POST /api/v1/tasks/:id/assignees/:userId
   */
  public async assignUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.assignUser(req.params.id, req.params.userId, req.user.id);
      return successResponse(res, task, 'Usuário atribuído com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um usuário da lista de responsáveis da tarefa
   * @route DELETE /api/v1/tasks/:id/assignees/:userId
   */
  public async unassignUser(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const task = await taskService.unassignUser(req.params.id, req.params.userId, req.user.id);
      return successResponse(res, task, 'Usuário removido com sucesso');
    } catch (error) {
      next(error);
    }
  }

  public async updatePositions(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { updates } = req.body;
      const results = [];

      for (const update of updates) {
        const { taskId, position } = update;
        const updatedTask = await taskService.updateTask(taskId, position, req.user.id);
        results.push(updatedTask);
      }

      return successResponse(res, results, 'Task positions updated successfully');
    } catch (error) {
      next(error);
    }
  }


  /**
   * Obtém estatísticas das tarefas
   * @route GET /api/v1/tasks/statistics
   */
  public async getTaskStatistics(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { owner, assignee, isArchived } = req.query;

      const statistics = await taskService.getTaskStatistics({
        owner: owner as string,
        assignee: assignee as string,
        isArchived: isArchived === 'true' ? true : isArchived === 'false' ? false : undefined,
      });

      return successResponse(res, statistics);
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();