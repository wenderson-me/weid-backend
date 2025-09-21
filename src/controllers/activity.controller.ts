import { Request, Response, NextFunction } from 'express';
import activityService from '../services/activity.service';
import {
  successResponse,
  createdResponse,
  notFoundResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';

/**
 * Controlador de atividades
 */
class ActivityController {
  /**
   * Cria uma nova atividade
   * @route POST /api/v1/activities
   */
  public async createActivity(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const activity = await activityService.createActivity(req.body, req.user.id);
      return createdResponse(res, activity, 'Atividade registrada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca uma atividade pelo ID
   * @route GET /api/v1/activities/:id
   */
  public async getActivityById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const activity = await activityService.getActivityById(req.params.id);
      return successResponse(res, activity);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista atividades com filtros e paginação
   * @route GET /api/v1/activities
   */
  public async getActivities(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const {
        task,
        note,
        user,
        targetUser,
        type,
        createdStart,
        createdEnd,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await activityService.getActivities({
        task: task as string,
        note: note as string,
        user: user as string,
        targetUser: targetUser as string,
        type: type as any,
        createdStart: createdStart ? new Date(createdStart as string) : undefined,
        createdEnd: createdEnd ? new Date(createdEnd as string) : undefined,
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
   * Obtém o histórico de atividades de uma tarefa
   * @route GET /api/v1/activities/task/:taskId/history
   */
  public async getTaskHistory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { limit } = req.query;
      const history = await activityService.getTaskHistory(
        req.params.taskId,
        limit ? parseInt(limit as string) : undefined
      );
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém o histórico de atividades de uma nota
   * @route GET /api/v1/activities/note/:noteId/history
   */
  public async getNoteHistory(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { limit } = req.query;
      const history = await activityService.getNoteHistory(
        req.params.noteId,
        limit ? parseInt(limit as string) : undefined
      );
      return successResponse(res, history);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém as atividades do usuário logado
   * @route GET /api/v1/activities/user/recent
   */
  public async getUserActivities(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { limit } = req.query;
      const activities = await activityService.getUserActivities(
        req.user.id,
        limit ? parseInt(limit as string) : undefined
      );
      return successResponse(res, activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém todas as atividades relacionadas ao usuário (como ator ou alvo)
   * @route GET /api/v1/activities/user/related
   */
  public async getUserRelatedActivities(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { limit } = req.query;
      const activities = await activityService.getUserRelatedActivities(
        req.user.id,
        limit ? parseInt(limit as string) : undefined
      );
      return successResponse(res, activities);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém as atividades de um usuário específico
   * @route GET /api/v1/activities/user/:userId/recent
   */
  public async getSpecificUserActivities(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { limit } = req.query;
      const activities = await activityService.getUserActivities(
        req.params.userId,
        limit ? parseInt(limit as string) : undefined
      );
      return successResponse(res, activities);
    } catch (error) {
      next(error);
    }
  }
}

export default new ActivityController();