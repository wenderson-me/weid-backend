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
    // Verificar se a tarefa existe
    const taskExists = await Task.exists({ _id: commentData.task });

    if (!taskExists) {
      throw new AppError(MESSAGES.NOT_FOUND.TASK, 404);
    }

    // Verificar se o comentário pai existe (se fornecido)
    if (commentData.parentComment) {
      const parentCommentExists = await Comment.exists({ _id: commentData.parentComment });

      if (!parentCommentExists) {
        throw new AppError('Comentário pai não encontrado', 404);
      }
    }

    // Criar o comentário
    const comment = await Comment.create({
      ...commentData,
      author: userId,
    });

    // Registrar atividade
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

    // Preencher dados populados para a resposta
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
    // Verificar se o comentário existe
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    // Verificar se o usuário é o autor do comentário
    if (comment.author.toString() !== userId) {
      throw new AppError('Você não tem permissão para editar este comentário', 403);
    }

    // Atualizar o comentário
    comment.content = commentData.content;

    if (commentData.attachments !== undefined) {
      comment.attachments = commentData.attachments;
    }

    comment.isEdited = true;
    await comment.save();

    // Preencher dados populados para a resposta
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

    // Construir filtro
    const filter: any = {};

    if (task) {
      filter.task = new mongoose.Types.ObjectId(task);
    }

    if (author) {
      filter.author = new mongoose.Types.ObjectId(author);
    }

    // Filtrar por comentários pai ou comentários de nível superior
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

    // Contar total de comentários
    const total = await Comment.countDocuments(filter);

    // Calcular páginas
    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    // Buscar comentários
    const comments = await Comment.find(filter)
      .sort({ [sortBy]: sortOrder === 'asc' ? 1 : -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'name email avatar')
      .populate('likes', 'name email avatar');

    // Sanitizar comentários
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
    // Verificar se o comentário existe
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    // Verificar se o usuário é o autor do comentário
    if (comment.author.toString() !== userId) {
      throw new AppError('Você não tem permissão para excluir este comentário', 403);
    }

    // Excluir o comentário
    await comment.deleteOne();

    // Excluir respostas a este comentário
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
    // Verificar se o comentário existe
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(MESSAGES.NOT_FOUND.COMMENT, 404);
    }

    // Verificar se o usuário já curtiu o comentário
    const userLikeIndex = comment.likes.findIndex(
      (id) => id.toString() === userId
    );

    if (userLikeIndex === -1) {
      // Adicionar curtida - convertendo string para ObjectId
      comment.likes.push();
    } else {
      // Remover curtida
      comment.likes.splice(userLikeIndex, 1);
    }

    await comment.save();

    // Preencher dados populados para a resposta
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
    // Verificar se o comentário existe
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