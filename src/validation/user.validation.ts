import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.base': 'Nome deve ser um texto',
    'string.empty': 'Nome é obrigatório',
    'string.min': 'Nome deve ter pelo menos {#limit} caracteres',
    'string.max': 'Nome deve ter no máximo {#limit} caracteres',
    'any.required': 'Nome é obrigatório',
  }),
  email: Joi.string().email().required().messages({
    'string.base': 'Email deve ser um texto',
    'string.empty': 'Email é obrigatório',
    'string.email': 'Por favor, forneça um email válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
    .required()
    .messages({
      'string.base': 'Senha deve ser um texto',
      'string.empty': 'Senha é obrigatória',
      'string.min': 'Senha deve ter pelo menos {#limit} caracteres',
      'string.pattern.base': 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
      'any.required': 'Senha é obrigatória',
    }),
  role: Joi.string().valid('user', 'admin', 'manager').default('user').messages({
    'string.base': 'Papel deve ser um texto',
    'any.only': 'Papel deve ser: user, admin ou manager',
  }),
  avatar: Joi.string().optional(),
  isActive: Joi.boolean().default(true),
});

export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.base': 'Nome deve ser um texto',
    'string.min': 'Nome deve ter pelo menos {#limit} caracteres',
    'string.max': 'Nome deve ter no máximo {#limit} caracteres',
  }),
  email: Joi.string().email().optional().messages({
    'string.base': 'Email deve ser um texto',
    'string.email': 'Por favor, forneça um email válido',
  }),
  role: Joi.string().valid('user', 'admin', 'manager').optional().messages({
    'string.base': 'Papel deve ser um texto',
    'any.only': 'Papel deve ser: user, admin ou manager',
  }),
  avatar: Joi.string().optional().allow(''),
  isActive: Joi.boolean().optional(),
});

export const getUserSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const deleteUserSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const queryUsersSchema = Joi.object({
  search: Joi.string().optional(),
  role: Joi.string().valid('user', 'admin', 'manager').optional(),
  isActive: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid('name', 'email', 'role', 'createdAt', 'lastLogin').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const updatePreferencesSchema = Joi.object({
  theme: Joi.string().valid('light', 'dark', 'system').optional().messages({
    'string.base': 'Tema deve ser um texto',
    'any.only': 'Tema deve ser: light, dark ou system',
  }),
  language: Joi.string().optional().messages({
    'string.base': 'Idioma deve ser um texto',
  }),
  defaultTaskView: Joi.string().valid('list', 'board', 'calendar').optional().messages({
    'string.base': 'Visualização padrão deve ser um texto',
    'any.only': 'Visualização padrão deve ser: list, board ou calendar',
  }),
  defaultTaskFilter: Joi.object({
    status: Joi.array().items(Joi.string()).optional(),
    priority: Joi.array().items(Joi.string()).optional(),
  }).optional(),
});

export const avatarUploadSchema = Joi.object({
  avatar: Joi.string().required().messages({
    'string.base': 'Avatar deve ser um texto',
    'string.empty': 'Avatar é obrigatório',
    'any.required': 'Avatar é obrigatório',
  }),
});