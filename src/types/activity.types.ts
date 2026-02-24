import { ActivityType } from '../models/activity.pg.model';
import { sanitizeUser, UserResponse } from './user.types';

export interface CreateActivityInput {
  type: ActivityType;
  task?: string;
  note?: string;
  targetUser?: string;
  description: string;
  metadata?: Record<string, any>;
}

export interface ActivityFilterOptions {
  task?: string;
  note?: string;
  user?: string;
  targetUser?: string;
  type?: ActivityType | ActivityType[];
  createdStart?: Date;
  createdEnd?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ActivityResponse {
  id: string;
  type: ActivityType;
  taskId?: string;
  task?: any;
  noteId?: string;
  note?: any;
  userId: string;
  user?: UserResponse;
  targetUserId?: string;
  targetUser?: UserResponse;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface ActivitiesWithPagination {
  activities: ActivityResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const sanitizeActivity = (activity: any): ActivityResponse => {
  const sanitizedActivity: any = {
    id: activity.id,
    type: activity.type,
    description: activity.description,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
    userId: activity.userId,
    taskId: activity.taskId,
    noteId: activity.noteId,
    targetUserId: activity.targetUserId,
  };

  if (activity.user && typeof activity.user === 'object') {
    sanitizedActivity.user = sanitizeUser(activity.user);
  }

  if (activity.targetUser && typeof activity.targetUser === 'object') {
    sanitizedActivity.targetUser = sanitizeUser(activity.targetUser);
  }

  return sanitizedActivity;
};