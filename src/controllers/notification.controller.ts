import { Request, Response, NextFunction } from 'express';
import notificationService from '../services/notification.service';
import {
  successResponse,
  notFoundResponse
} from '../utils/responseHandler';

/**
 * Controlador de notificações
 */
class NotificationController {
  /**
   * Busca notificações do usuário
   * @route GET /api/v1/notifications
   */
  public async getNotifications(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { page = 1, limit = 20, unreadOnly = false } = req.query;
      const notifications = await notificationService.getNotifications(
        req.user.id,
        {
          page: Number(page),
          limit: Number(limit),
          unreadOnly: unreadOnly === 'true'
        }
      );
      return successResponse(res, notifications);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marca notificação como lida
   * @route PATCH /api/v1/notifications/:id/read
   */
  public async markAsRead(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user.id);
      return successResponse(res, notification, 'Notificação marcada como lida');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Marca todas as notificações como lidas
   * @route PATCH /api/v1/notifications/mark-all-read
   */
  public async markAllAsRead(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const result = await notificationService.markAllAsRead(req.user.id);
      return successResponse(res, result, 'Todas as notificações foram marcadas como lidas');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove uma notificação
   * @route DELETE /api/v1/notifications/:id
   */
  public async deleteNotification(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await notificationService.deleteNotification(req.params.id, req.user.id);
      return successResponse(res, null, 'Notificação removida com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Conta notificações não lidas
   * @route GET /api/v1/notifications/unread-count
   */
  public async getUnreadCount(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const count = await notificationService.getUnreadCount(req.user.id);
      return successResponse(res, { count });
    } catch (error) {
      next(error);
    }
  }
}

export default new NotificationController();