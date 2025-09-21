import Joi from 'joi';

// Schema para criação de notas
export const createNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.base': 'Título deve ser um texto',
    'string.empty': 'Título é obrigatório',
    'string.min': 'Título deve ter pelo menos {#limit} caractere',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
    'any.required': 'Título é obrigatório',
  }),
  content: Joi.string().required().messages({
    'string.base': 'Conteúdo deve ser um texto',
    'string.empty': 'Conteúdo é obrigatório',
    'any.required': 'Conteúdo é obrigatório',
  }),
  category: Joi.string()
    .valid('general', 'personal', 'work', 'important', 'idea')
    .default('general')
    .messages({
      'string.base': 'Categoria deve ser um texto',
      'any.only': 'Categoria deve ser: general, personal, work, important ou idea',
    }),
  color: Joi.string().optional(),
  isPinned: Joi.boolean().default(false),
  tags: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Tag deve ser um texto',
    })
  ).optional(),
});

// Schema para atualização de notas
export const updateNoteSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.base': 'Título deve ser um texto',
    'string.min': 'Título deve ter pelo menos {#limit} caractere',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
  }),
  content: Joi.string().optional().messages({
    'string.base': 'Conteúdo deve ser um texto',
  }),
  category: Joi.string()
    .valid('general', 'personal', 'work', 'important', 'idea')
    .optional()
    .messages({
      'string.base': 'Categoria deve ser um texto',
      'any.only': 'Categoria deve ser: general, personal, work, important ou idea',
    }),
  color: Joi.string().optional().allow(''),
  isPinned: Joi.boolean().optional(),
  tags: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Tag deve ser um texto',
    })
  ).optional(),
});

// Schema para obtenção de nota por ID
export const getNoteSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

// Schema para exclusão de nota
export const deleteNoteSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

// Schema para consulta de notas
export const queryNotesSchema = Joi.object({
  owner: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
  category: Joi.alternatives().try(
    Joi.string().valid('general', 'personal', 'work', 'important', 'idea'),
    Joi.array().items(
      Joi.string().valid('general', 'personal', 'work', 'important', 'idea')
    )
  ).optional(),
  search: Joi.string().optional(),
  isPinned: Joi.boolean().optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  createdStart: Joi.date().iso().optional(),
  createdEnd: Joi.date().iso().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid(
    'title',
    'category',
    'createdAt',
    'updatedAt',
    'isPinned'
  ).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});