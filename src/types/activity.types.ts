import mongoose from 'mongoose';
import { ActivityType, IActivity } from '../models/activity.model';
import { IUser } from '../models/user.model';
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
  _id: string;
  type: ActivityType;
  task?: string;
  note?: string;
  user: UserResponse;
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

export const sanitizeActivity = (activity: IActivity): ActivityResponse => {
  const sanitizedActivity: any = {
    _id: activity._id.toString(),
    type: activity.type,
    description: activity.description,
    metadata: activity.metadata,
    createdAt: activity.createdAt,
  };

  if (activity.task) {
    sanitizedActivity.task = activity.task.toString();
  }

  if (activity.note) {
    sanitizedActivity.note = activity.note.toString();
  }

  if (activity.user instanceof mongoose.Types.ObjectId) {
    sanitizedActivity.user = activity.user.toString();
  } else {
    sanitizedActivity.user = sanitizeUser(activity.user as IUser);
  }

  if (activity.targetUser) {
    if (activity.targetUser instanceof mongoose.Types.ObjectId) {
      sanitizedActivity.targetUser = activity.targetUser.toString();
    } else {
      sanitizedActivity.targetUser = sanitizeUser(activity.targetUser as IUser);
    }
  }

  return sanitizedActivity;
};