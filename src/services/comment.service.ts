import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import Comment, { IComment } from '../models/comment.model';
import Activity from '../models/activity.model';
import Task from '../models/task.model';
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
    const taskExists = await Task.exists({ _id: commentData.task });

    if (!taskExists) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    if (commentData.parentComment) {
      const parentCommentExists = await Comment.exists({ _id: commentData.parentComment });

      if (!parentCommentExists) {
        throw new AppError('Comentário pai não encontrado', 404);
      }
    }

    const comment = await Comment.create({
      ...commentData,
      author: userId,
    });

    await Activity.create({
      type: ACTIVITY_TYPES.COMMENT_ADDED,
      task: commentData.task,
      user: userId,
      description: `Comentário adicionado à tarefa`,
      metadata: {
        commentId: comment._id,
        isReply: !!commentData.parentComment,
      },
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar');

    return sanitizeComment(populatedComment as IComment);
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
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    if (comment.author.toString() !== userId) {
      throw new AppError('Você não tem permissão para editar este comentário', 403);
    }

    comment.content = commentData.content;

    if (commentData.attachments !== undefined) {
      comment.attachments = commentData.attachments;
    }

    comment.isEdited = true;
    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar');

    return sanitizeComment(populatedComment as IComment);
  }

  /**
   * Busca um comentário pelo ID
   * @param commentId ID do comentário
   * @returns Comentário encontrado
   */
  public async getCommentById(commentId: string): Promise<CommentResponse> {
    const comment = await Comment.findById(commentId)
      .populate('author', 'name email avatar')
      .populate('likes', 'name email avatar');

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
      filter.task = new mongoose.Types.ObjectId(task);
    }

    if (author) {
      filter.author = new mongoose.Types.ObjectId(author);
    }

    if (parentComment === null) {
      filter.parentComment = { $exists: false };
    } else if (parentComment) {
      filter.parentComment = new mongoose.Types.ObjectId(parentComment);
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

    const total = await Comment.countDocuments(filter);

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    const comments = await Comment.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email avatar')
      .populate('likes', 'name email avatar');

    const sanitizedComments = comments.map(comment => sanitizeComment(comment));

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
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    if (comment.author.toString() !== userId) {
      throw new AppError('Você não tem permissão para excluir este comentário', 403);
    }

    await comment.deleteOne();

    await Comment.deleteMany({ parentComment: commentId });

    return true;
  }

  /**
   * Adiciona ou remove um curtir em um comentário
   * @param commentId ID do comentário
   * @param userId ID do usuário
   * @returns Comentário atualizado
   */
  public async toggleLike(commentId: string, userId: string): Promise<CommentResponse> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    const userLikeIndex = comment.likes.findIndex(
      (id) => id.toString() === userId
    );

    if (userLikeIndex === -1) {
      comment.likes.push();
    } else {
      comment.likes.splice(userLikeIndex, 1);
    }

    await comment.save();

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name email avatar')
      .populate('likes', 'name email avatar');

    return sanitizeComment(populatedComment as IComment);
  }

  /**
   * Obtém as respostas a um comentário
   * @param commentId ID do comentário pai
   * @returns Lista de comentários que são respostas
   */
  public async getCommentReplies(commentId: string): Promise<CommentResponse[]> {
    const commentExists = await Comment.exists({ _id: commentId });

    if (!commentExists) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    const replies = await Comment.find({ parentComment: commentId })
      .sort({ createdAt: 1 })
      .populate('author', 'name email avatar')
      .populate('likes', 'name email avatar');

    return replies.map(reply => sanitizeComment(reply));
  }
}

export default new CommentService();