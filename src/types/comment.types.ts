import mongoose, { Schema, Types } from 'mongoose';
import { IComment } from '../models/comment.model';
import { IUser } from '../models/user.model';
import { sanitizeUser, UserResponse } from './user.types';

export interface CreateCommentInput {
  content: string;
  task: string;
  attachments?: string[];
  parentComment?: string;
}

export interface UpdateCommentInput {
  content: string;
  attachments?: string[];
}

export interface CommentFilterOptions {
  task?: string;
  author?: string;
  parentComment?: string | null; // null para comentários de nível superior
  createdStart?: Date;
  createdEnd?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CommentResponse {
  _id: string;
  content: string;
  task: string;
  author: UserResponse;
  attachments: string[];
  likes: mongoose.Types.ObjectId | IUser
  isEdited: boolean;
  parentComment?: string;
  replies?: CommentResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentsWithPagination {
  comments: CommentResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

// Função para converter o modelo de comentário em uma resposta
export const sanitizeComment = (comment: IComment, includeReplies = false): CommentResponse => {
  const sanitizedComment: any = {
    _id: comment._id.toString(),
    content: comment.content,
    task: comment.task.toString(),
    attachments: comment.attachments || [],
    isEdited: comment.isEdited,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };

  // Processar autor
  if (comment.author instanceof mongoose.Types.ObjectId) {
    sanitizedComment.author = comment.author.toString();
  } else {
    sanitizedComment.author = sanitizeUser(comment.author as IUser);
  }

  // Processar likes
  sanitizedComment.likes = comment.likes.map((like) => {
    if (like instanceof mongoose.Types.ObjectId) {
      return like.toString();
    }
    return sanitizeUser(like as IUser);
  });

  // Processar comentário pai, se houver
  if (comment.parentComment) {
    sanitizedComment.parentComment = comment.parentComment.toString();
  }

  // Processar respostas, se solicitadas e populadas
  if (includeReplies && Array.isArray((comment as any).replies)) {
    sanitizedComment.replies = (comment as any).replies.map((reply: IComment) =>
      sanitizeComment(reply, false)  // Não incluir respostas aninhadas para evitar recursão profunda
    );
  }

  return sanitizedComment;
};