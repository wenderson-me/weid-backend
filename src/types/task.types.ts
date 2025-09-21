import mongoose from 'mongoose';
import { TaskStatus, TaskPriority, ITask } from '../models/task.model';
import { IUser } from '../models/user.model';
import { sanitizeUser, UserResponse } from './user.types';

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  assignees?: string[];
  tags?: string[];
  color?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date | null;
  estimatedHours?: number | null;
  assignees?: string[];
  tags?: string[];
  color?: string;
  progress?: number;
  isArchived?: boolean;
  position?: number;
}

export interface TaskFilterOptions {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  owner?: string;
  assignee?: string;
  search?: string;
  tags?: string[];
  dueStart?: Date;
  dueEnd?: Date;
  isArchived?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<TaskPriority, number>;
  completed: number;
  overdue: number;
  withoutAssignee: number;
}

export interface TaskResponse {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  owner: UserResponse;
  assignees: UserResponse[];
  tags: string[];
  attachments: string[];
  color?: string;
  isArchived: boolean;
  progress: number;
  createdBy: UserResponse;
  updatedBy?: UserResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface TasksWithPagination {
  tasks: TaskResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const sanitizeTask = (task: ITask, populateUsers = true): TaskResponse => {
  const sanitizedTask: any = {
    _id: task._id.toString(),
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    tags: task.tags,
    attachments: task.attachments || [],
    color: task.color,
    isArchived: task.isArchived,
    progress: task.progress,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };


  if (populateUsers) {
    if (task.owner instanceof mongoose.Types.ObjectId) {
      sanitizedTask.owner = task.owner.toString();
    } else {
      sanitizedTask.owner = sanitizeUser(task.owner as IUser);
    }

    sanitizedTask.assignees = task.assignees.map((assignee) => {
      if (assignee instanceof mongoose.Types.ObjectId) {
        return assignee.toString();
      }
      return sanitizeUser(assignee as IUser);
    });

    if (task.createdBy instanceof mongoose.Types.ObjectId) {
      sanitizedTask.createdBy = task.createdBy.toString();
    } else {
      sanitizedTask.createdBy = sanitizeUser(task.createdBy as IUser);
    }

    if (task.updatedBy) {
      if (task.updatedBy instanceof mongoose.Types.ObjectId) {
        sanitizedTask.updatedBy = task.updatedBy.toString();
      } else {
        sanitizedTask.updatedBy = sanitizeUser(task.updatedBy as IUser);
      }
    }
  } else {
    sanitizedTask.owner = task.owner.toString();
    sanitizedTask.assignees = task.assignees.map(assignee => assignee.toString());
    sanitizedTask.createdBy = task.createdBy.toString();
    if (task.updatedBy) {
      sanitizedTask.updatedBy = task.updatedBy.toString();
    }
  }

  return sanitizedTask;
};