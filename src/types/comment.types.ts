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
  parentComment?: string | null;
  createdStart?: Date;
  createdEnd?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CommentResponse {
  id: string;
  content: string;
  taskId: string;
  task?: any;
  authorId: string;
  author?: UserResponse;
  attachments: string[];
  likes: string[];
  likedByUsers?: UserResponse[];
  isEdited: boolean;
  parentCommentId?: string;
  parentComment?: CommentResponse;
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

export const sanitizeComment = (comment: any): CommentResponse => {
  const sanitizedComment: any = {
    id: comment.id,
    content: comment.content,
    taskId: comment.taskId,
    authorId: comment.authorId,
    attachments: comment.attachments || [],
    likes: comment.likes || [],
    isEdited: comment.isEdited,
    parentCommentId: comment.parentCommentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };

  if (comment.author && typeof comment.author === 'object') {
    sanitizedComment.author = sanitizeUser(comment.author);
  }

  if (comment.likedByUsers && Array.isArray(comment.likedByUsers)) {
    sanitizedComment.likedByUsers = comment.likedByUsers.map((user: any) => sanitizeUser(user));
  }

  if (comment.parentComment && typeof comment.parentComment === 'object') {
    sanitizedComment.parentComment = sanitizeComment(comment.parentComment);
  }

  if (comment.replies && Array.isArray(comment.replies)) {
    sanitizedComment.replies = comment.replies.map((reply: any) => sanitizeComment(reply));
  }

  return sanitizedComment;
};