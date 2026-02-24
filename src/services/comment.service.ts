import { AppError } from '../middleware/error.middleware';
import { Comment, Activity, Task, User } from '../models';
import { Op } from 'sequelize';
import {
  CreateCommentInput,
  UpdateCommentInput,
  CommentFilterOptions,
  CommentResponse,
  CommentsWithPagination,
  sanitizeComment
} from '../types/comment.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING, ACTIVITY_TYPES } from '../utils/constants';

/**
 * Serviço de comentários
 */
class CommentService {
  /**
   * Cria um novo comentário
   * @param commentData Dados do comentário
   * @param userId ID do usuário autor
   * @returns Comentário criado
   */
  public async createComment(commentData: CreateCommentInput, userId: string): Promise<CommentResponse> {
    const taskExists = await Task.findByPk(commentData.task);

    if (!taskExists) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    if (commentData.parentComment) {
      const parentCommentExists = await Comment.findByPk(commentData.parentComment);

      if (!parentCommentExists) {
        throw new AppError('Comentário pai não encontrado', 404);
      }
    }

    const comment = await Comment.create({
      ...commentData,
      authorId: userId,
      taskId: commentData.task,
      parentCommentId: commentData.parentComment,
    });

    await Activity.create({
      type: ACTIVITY_TYPES.COMMENT_ADDED,
      taskId: commentData.task,
      userId: userId,
      description: `Comentário adicionado à tarefa`,
      metadata: {
        commentId: comment.id,
        isReply: !!commentData.parentComment,
      },
    });

    const populatedComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeComment(populatedComment);
  }

  /**
   * Atualiza um comentário existente
   * @param commentId ID do comentário
   * @param commentData Dados para atualização
   * @param userId ID do usuário que faz a atualização
   * @returns Comentário atualizado
   */
  public async updateComment(
    commentId: string,
    commentData: UpdateCommentInput,
    userId: string
  ): Promise<CommentResponse> {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError('Você não tem permissão para editar este comentário', 403);
    }

    comment.content = commentData.content;

    if (commentData.attachments !== undefined) {
      comment.attachments = commentData.attachments;
    }

    comment.isEdited = true;
    await comment.save();

    const populatedComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeComment(populatedComment);
  }

  /**
   * Busca um comentário pelo ID
   * @param commentId ID do comentário
   * @returns Comentário encontrado
   */
  public async getCommentById(commentId: string): Promise<CommentResponse> {
    const comment = await Comment.findByPk(commentId, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'likedByUsers', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    return sanitizeComment(comment);
  }

  /**
   * Lista comentários com filtros e paginação
   * @param options Opções de filtro e paginação
   * @returns Lista de comentários e metadados de paginação
   */
  public async getComments(options: CommentFilterOptions): Promise<CommentsWithPagination> {
    const {
      task,
      author,
      parentComment,
      createdStart,
      createdEnd,
      page = DEFAULT_PAGINATION.PAGE,
      limit = DEFAULT_PAGINATION.LIMIT,
      sortBy = DEFAULT_SORTING.COMMENTS.FIELD,
      sortOrder = DEFAULT_SORTING.COMMENTS.ORDER,
    } = options;

    const filter: any = {};

    if (task) {
      filter.taskId = task;
    }

    if (author) {
      filter.authorId = author;
    }

    if (parentComment === null) {
      filter.parentCommentId = null;
    } else if (parentComment) {
      filter.parentCommentId = parentComment;
    }

    if (createdStart || createdEnd) {
      filter.createdAt = {};

      if (createdStart) {
        filter.createdAt[Op.gte] = new Date(createdStart);
      }

      if (createdEnd) {
        filter.createdAt[Op.lte] = new Date(createdEnd);
      }
    }

    const total = await Comment.count({ where: filter });

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    const comments = await Comment.findAll({
      where: filter,
      order: [[sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']],
      offset: skip,
      limit,
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'likedByUsers', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    const sanitizedComments = comments.map((comment: any) => sanitizeComment(comment));

    return {
      comments: sanitizedComments,
      total,
      page: currentPage,
      limit,
      pages,
    };
  }

  /**
   * Exclui um comentário pelo ID
   * @param commentId ID do comentário
   * @param userId ID do usuário que tenta excluir o comentário
   * @returns Booleano indicando sucesso
   */
  public async deleteComment(commentId: string, userId: string): Promise<boolean> {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    if (comment.authorId !== userId) {
      throw new AppError('Você não tem permissão para excluir este comentário', 403);
    }

    await comment.destroy();

    await Comment.destroy({ where: { parentCommentId: commentId } });

    return true;
  }

  /**
   * Adiciona ou remove um curtir em um comentário
   * @param commentId ID do comentário
   * @param userId ID do usuário
   * @returns Comentário atualizado
   */
  public async toggleLike(commentId: string, userId: string): Promise<CommentResponse> {
    const comment = await Comment.findByPk(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    const likes = comment.likes || [];
    const userLikeIndex = likes.findIndex(
      (id: string) => id === userId
    );

    if (userLikeIndex === -1) {
      likes.push(userId);
    } else {
      likes.splice(userLikeIndex, 1);
    }

    comment.likes = likes;
    await comment.save();

    const populatedComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'likedByUsers', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeComment(populatedComment);
  }

  /**
   * Obtém as respostas a um comentário
   * @param commentId ID do comentário pai
   * @returns Lista de comentários que são respostas
   */
  public async getCommentReplies(commentId: string): Promise<CommentResponse[]> {
    const commentExists = await Comment.findByPk(commentId);

    if (!commentExists) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    const replies = await Comment.findAll({
      where: { parentCommentId: commentId },
      order: [['createdAt', 'ASC']],
      include: [
        { model: User, as: 'author', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'likedByUsers', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return replies.map((reply: any) => sanitizeComment(reply));
  }
}

export default new CommentService();