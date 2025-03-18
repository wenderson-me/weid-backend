import { Request, Response, NextFunction } from 'express';
import commentService from '../services/comment.service';
import {
  successResponse,
  createdResponse,
  notFoundResponse
} from '../utils/responseHandler';
import { MESSAGES } from '../utils/constants';

/**
 * Controlador de comentários
 */
class CommentController {
  /**
   * Cria um novo comentário
   * @route POST /api/v1/comments
   */
  public async createComment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const comment = await commentService.createComment(req.body, req.user.id);
      return createdResponse(res, comment, 'Comentário criado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um comentário existente
   * @route PUT /api/v1/comments/:id
   */
  public async updateComment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const comment = await commentService.updateComment(req.params.id, req.body, req.user.id);
      return successResponse(res, comment, 'Comentário atualizado com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Busca um comentário pelo ID
   * @route GET /api/v1/comments/:id
   */
  public async getCommentById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const comment = await commentService.getCommentById(req.params.id);
      return successResponse(res, comment);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista comentários com filtros e paginação
   * @route GET /api/v1/comments
   */
  public async getComments(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const {
        task,
        author,
        parentComment,
        createdStart,
        createdEnd,
        page,
        limit,
        sortBy,
        sortOrder
      } = req.query;

      const result = await commentService.getComments({
        task: task as string,
        author: author as string,
        parentComment: parentComment === 'null' ? null : parentComment as string,
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
   * Exclui um comentário pelo ID
   * @route DELETE /api/v1/comments/:id
   */
  public async deleteComment(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await commentService.deleteComment(req.params.id, req.user.id);
      return successResponse(res, null, 'Comentário excluído com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona ou remove um curtir em um comentário
   * @route POST /api/v1/comments/:id/like
   */
  public async toggleLike(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const comment = await commentService.toggleLike(req.params.id, req.user.id);
      return successResponse(res, comment, 'Curtida atualizada com sucesso');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém as respostas a um comentário
   * @route GET /api/v1/comments/:id/replies
   */
  public async getCommentReplies(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const replies = await commentService.getCommentReplies(req.params.id);
      return successResponse(res, replies);
    } catch (error) {
      next(error);
    }
  }
}

export default new CommentController();