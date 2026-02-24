import { TaskStatus, TaskPriority } from '../models/task.model';
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
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  estimatedHours?: number;
  ownerId: string;
  owner?: UserResponse;
  assignees: string[];
  tags: string[];
  attachments: string[];
  color?: string;
  isArchived: boolean;
  progress: number;
  position: number;
  createdById: string;
  createdBy?: UserResponse;
  updatedById?: string;
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

export const sanitizeTask = (task: any): TaskResponse => {
  const sanitizedTask: any = {
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    estimatedHours: task.estimatedHours,
    ownerId: task.ownerId,
    assignees: task.assignees || [],
    tags: task.tags || [],
    attachments: task.attachments || [],
    color: task.color,
    isArchived: task.isArchived,
    progress: task.progress,
    position: task.position,
    createdById: task.createdById,
    updatedById: task.updatedById,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };

  if (task.owner && typeof task.owner === 'object') {
    sanitizedTask.owner = sanitizeUser(task.owner);
  }

  if (task.createdBy && typeof task.createdBy === 'object') {
    sanitizedTask.createdBy = sanitizeUser(task.createdBy);
  }

  if (task.updatedBy && typeof task.updatedBy === 'object') {
    sanitizedTask.updatedBy = sanitizeUser(task.updatedBy);
  }

  return sanitizedTask;
};