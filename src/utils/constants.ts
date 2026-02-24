export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'inProgress',
  IN_REVIEW: 'inReview',
  DONE: 'done',
} as const;

export const TASK_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
  MANAGER: 'manager',
} as const;

export const NOTE_CATEGORY = {
  GENERAL: 'general',
  PERSONAL: 'personal',
  WORK: 'work',
  IMPORTANT: 'important',
  IDEA: 'idea',
} as const;

export const ACTIVITY_TYPES = {
  TASK_CREATED: 'task_created',
  TASK_UPDATED: 'task_updated',
  TASK_STATUS_CHANGED: 'task_status_changed',
  TASK_ASSIGNED: 'task_assigned',
  TASK_UNASSIGNED: 'task_unassigned',
  COMMENT_ADDED: 'comment_added',
  TASK_COMPLETED: 'task_completed',
  TASK_REOPENED: 'task_reopened',
  TASK_ARCHIVED: 'task_archived',
  ATTACHMENT_ADDED: 'attachment_added',
  DUE_DATE_CHANGED: 'due_date_changed',

  NOTE_CREATED: 'note_created',
  NOTE_UPDATED: 'note_updated',
  NOTE_PINNED: 'note_pinned',
  NOTE_UNPINNED: 'note_unpinned',
  NOTE_DELETED: 'note_deleted',

  PROFILE_UPDATED: 'profile_updated',
  AVATAR_CHANGED: 'avatar_changed',
  PREFERENCES_UPDATED: 'preferences_updated',
  PASSWORD_CHANGED: 'password_changed'
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const DEFAULT_SORTING = {
  TASKS: {
    FIELD: 'createdAt',
    ORDER: 'desc',
  },
  COMMENTS: {
    FIELD: 'createdAt',
    ORDER: 'asc',
  },
  ACTIVITIES: {
    FIELD: 'createdAt',
    ORDER: 'desc',
  },
  USERS: {
    FIELD: 'name',
    ORDER: 'asc',
  },
  NOTES: {
    FIELD: 'updatedAt',
    ORDER: 'desc',
  },
} as const;

export const MESSAGES = {
  NOT_FOUND: {
    USER: 'Usuário não encontrado',
    TASK: 'Tarefa não encontrada',
    COMMENT: 'Comentário não encontrado',
    ACTIVITY: 'Atividade não encontrada',
    RESOURCE: 'Recurso não encontrado',
    NOTE: 'Nota não encontrada',
  },
  VALIDATION: {
    INVALID_CREDENTIALS: 'Credenciais inválidas',
    EMAIL_EXISTS: 'Email já está em uso',
    WEAK_PASSWORD: 'A senha não atende aos requisitos mínimos de segurança',
    PASSWORDS_DONT_MATCH: 'As senhas não coincidem',
  },
  AUTH: {
    LOGIN_SUCCESS: 'Login realizado com sucesso',
    LOGOUT_SUCCESS: 'Logout realizado com sucesso',
    PASSWORD_RESET_EMAIL_SENT: 'Email de redefinição de senha enviado',
    PASSWORD_RESET_SUCCESS: 'Senha redefinida com sucesso',
    PASSWORD_CHANGE_SUCCESS: 'Senha alterada com sucesso',
  },
  CRUD: {
    CREATE_SUCCESS: 'Recurso criado com sucesso',
    UPDATE_SUCCESS: 'Recurso atualizado com sucesso',
    DELETE_SUCCESS: 'Recurso excluído com sucesso',
    ARCHIVE_SUCCESS: 'Recurso arquivado com sucesso',
    RESTORE_SUCCESS: 'Recurso restaurado com sucesso',
  },
} as const;