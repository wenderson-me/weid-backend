import { UserPreferences } from '../models/user.model';

export type UserRole = 'user' | 'admin' | 'manager';

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role?: UserRole;
  preferences?: UserPreferences;
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  avatar?: string;
  role?: UserRole;
  isActive?: boolean;
  preferences?: UserPreferences;
}

export interface UpdatePreferencesInput {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notifications?: {
    email?: boolean;
    inApp?: boolean;
    taskAssignment?: boolean;
    taskComments?: boolean;
    taskDeadline?: boolean;
  };
  defaultTaskView?: 'list' | 'board' | 'calendar';
  defaultTaskFilter?: {
    status?: string[];
    priority?: string[];
  };
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordInput {
  email: string;
}

export interface UserTokens {
  accessToken: string;
  refreshToken: string;
}

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStatistics {
  tasks: {
    total: number;
    completed: number;
    overdue: number;
    inProgress: number;
  };
  notes: {
    total: number;
    pinned: number;
  };
  comments: number;
  lastLogin?: Date;
  memberSince: Date;
}

export const sanitizeUser = (user: any): UserResponse => {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar,
    role: user.role,
    isActive: user.isActive,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};