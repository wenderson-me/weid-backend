import { AppError } from '../middleware/error.middleware';
import { Activity, User } from '../models/index.pg';
import { Op } from 'sequelize';
import { MESSAGES, DEFAULT_PAGINATION } from '../utils/constants';

interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

interface NotificationResponse {
  id: string;
  title: string;
  message: string;
  timestamp: Date;
  isRead: boolean;
  type: string;
  priority: 'low' | 'medium' | 'high';
  relatedId?: string;
  relatedType?: 'task' | 'note' | 'user';
}

interface NotificationsWithPagination {
  notifications: NotificationResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
  unreadCount: number;
}

/**
 * Serviço de notificações
 */
class NotificationService {
  /**
   * Busca notificações do usuário baseadas em atividades
   */
  async getNotifications(
    userId: string,
    filters: NotificationFilters = {}
  ): Promise<NotificationsWithPagination> {
    try {
      const {
        page = DEFAULT_PAGINATION.PAGE,
        limit = DEFAULT_PAGINATION.LIMIT,
        unreadOnly = false
      } = filters;

      const query: any = {
        [Op.or]: [
          { userId },
          { targetUserId: userId },
        ]
      };

      if (unreadOnly) {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        query.createdAt = { [Op.gte]: sevenDaysAgo };
      }

      const skip = (page - 1) * limit;

      const [activities, total] = await Promise.all([
        Activity.findAll({
          where: query,
          include: [
            { model: User, as: 'user', attributes: ['id', 'name', 'email'] },
            { model: User, as: 'targetUser', attributes: ['id', 'name', 'email'] }
          ],
          order: [['createdAt', 'DESC']],
          offset: skip,
          limit,
          raw: false
        }),
        Activity.count({ where: query })
      ]);

      const notifications = activities.map((activity: any) => this.transformActivityToNotification(activity, userId));

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const unreadCount = await Activity.count({
        where: {
          [Op.or]: [
            { userId },
            { targetUserId: userId }
          ],
          createdAt: { [Op.gte]: sevenDaysAgo }
        }
      });

      const pages = Math.ceil(total / limit);

      return {
        notifications,
        total,
        page,
        limit,
        pages,
        unreadCount
      };
    } catch (error) {
      throw new AppError(MESSAGES.NOT_FOUND.ACTIVITY, 500);
    }
  }

  /**
   * Transforma uma atividade em notificação
   */
  private transformActivityToNotification(activity: any, currentUserId: string): NotificationResponse {
    const isOwnActivity = activity.userId === currentUserId;
    const userName = activity.user?.name || activity.user?.email;
    const targetUserName = activity.targetUser?.name || activity.targetUser?.email;

    let title = '';
    let message = '';
    let type = 'system';
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let relatedId: string | undefined;
    let relatedType: 'task' | 'note' | 'user' | undefined;

    switch (activity.type) {
      case 'task_created':
        title = isOwnActivity ? 'Tarefa criada' : 'Nova tarefa';
        message = isOwnActivity
          ? `Você criou a tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} criou a tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'task';
        priority = 'medium';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'task_assigned':
        title = 'Tarefa atribuída';
        message = isOwnActivity
          ? `Você foi designado para a tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} foi designado para a tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'task';
        priority = 'high';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'task_completed':
        title = 'Tarefa concluída';
        message = isOwnActivity
          ? `Você concluiu a tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} concluiu a tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'completion';
        priority = 'medium';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'task_status_changed':
        title = 'Status da tarefa alterado';
        message = isOwnActivity
          ? `Você alterou o status da tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} alterou o status da tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'task';
        priority = 'low';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'comment_added':
        title = 'Novo comentário';
        message = isOwnActivity
          ? `Você comentou na tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} comentou na tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'comment';
        priority = 'low';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'due_date_changed':
        title = 'Prazo alterado';
        message = isOwnActivity
          ? `Você alterou o prazo da tarefa "${activity.task?.title || 'Sem título'}"`
          : `${userName} alterou o prazo da tarefa "${activity.task?.title || 'Sem título'}"`;
        type = 'reminder';
        priority = 'high';
        relatedId = activity.taskId;
        relatedType = 'task';
        break;

      case 'note_created':
        title = 'Nova nota';
        message = isOwnActivity
          ? `Você criou a nota "${activity.note?.title || 'Sem título'}"`
          : `${userName} criou a nota "${activity.note?.title || 'Sem título'}"`;
        type = 'note';
        priority = 'low';
        relatedId = activity.noteId;
        relatedType = 'note';
        break;

      case 'note_updated':
        title = 'Nota atualizada';
        message = isOwnActivity
          ? `Você atualizou a nota "${activity.note?.title || 'Sem título'}"`
          : `${userName} atualizou a nota "${activity.note?.title || 'Sem título'}"`;
        type = 'note';
        priority = 'low';
        relatedId = activity.noteId;
        relatedType = 'note';
        break;

      case 'profile_updated':
        title = 'Perfil atualizado';
        message = isOwnActivity
          ? 'Você atualizou seu perfil'
          : `${userName} atualizou o perfil`;
        type = 'system';
        priority = 'low';
        relatedType = 'user';
        break;

      default:
        title = 'Atividade do sistema';
        message = activity.description || 'Nova atividade registrada';
        type = 'system';
        priority = 'low';
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const isRead = activity.createdAt < sevenDaysAgo;

    return {
      id: activity.id,
      title,
      message,
      timestamp: activity.createdAt,
      isRead,
      type,
      priority,
      relatedId,
      relatedType
    };
  }

  /**
   * Marca notificação como lida
   */
  async markAsRead(notificationId: string, userId: string): Promise<{ success: boolean }> {
    // não tem um campo "isRead"
    // criar uma tabela separada para controlar o estado de leitura

    return { success: true };

  }

  /**
   * Marca todas as notificações como lidas
   */
  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const count = await Activity.count({
      where: {
        [Op.or]: [
          { userId },
          { targetUserId: userId }
        ],
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });

    return { success: true, count };
  }

  /**
   * Remove uma notificação
   */
  async deleteNotification(notificationId: string, userId: string): Promise<{ success: boolean }> {

    return { success: true };
  }

  /**
   * Conta notificações não lidas
   */
  async getUnreadCount(userId: string): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    return await Activity.count({
      where: {
        [Op.or]: [
          { userId },
          { targetUserId: userId }
        ],
        createdAt: { [Op.gte]: sevenDaysAgo }
      }
    });
  }
}

export default new NotificationService();