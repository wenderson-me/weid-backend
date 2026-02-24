import Joi from 'joi';

export const createCommentSchema = Joi.object({
  content: Joi.string().required().messages({
    'string.base': 'Conteúdo deve ser um texto',
    'string.empty': 'Conteúdo é obrigatório',
    'any.required': 'Conteúdo é obrigatório',
  }),
  task: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID da tarefa deve ser um texto',
    'string.empty': 'ID da tarefa é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID de tarefa válido',
    'any.required': 'ID da tarefa é obrigatório',
  }),
  attachments: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Anexo deve ser um texto',
    })
  ).optional(),
  parentComment: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.base': 'ID do comentário pai deve ser um texto',
    'string.pattern.base': 'Por favor, forneça um ID de comentário pai válido',
  }),
});

export const updateCommentSchema = Joi.object({
  content: Joi.string().required().messages({
    'string.base': 'Conteúdo deve ser um texto',
    'string.empty': 'Conteúdo é obrigatório',
    'any.required': 'Conteúdo é obrigatório',
  }),
  attachments: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Anexo deve ser um texto',
    })
  ).optional(),
});

export const getCommentSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const deleteCommentSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const queryCommentsSchema = Joi.object({
  task: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.base': 'ID da tarefa deve ser um texto',
    'string.pattern.base': 'Por favor, forneça um ID de tarefa válido',
  }),
  author: Joi.string().regex(/^[0-9a-fA-F]{24}$/).optional().messages({
    'string.base': 'ID do autor deve ser um texto',
    'string.pattern.base': 'Por favor, forneça um ID de autor válido',
  }),
  parentComment: Joi.alternatives().try(
    Joi.string().regex(/^[0-9a-fA-F]{24}$/),
    Joi.valid(null)
  ).optional().messages({
    'string.base': 'ID do comentário pai deve ser um texto',
    'string.pattern.base': 'Por favor, forneça um ID de comentário pai válido',
  }),
  createdStart: Joi.date().iso().optional().messages({
    'date.base': 'Data de início deve ser uma data válida',
    'date.format': 'Data de início deve estar no formato ISO',
  }),
  createdEnd: Joi.date().iso().optional().messages({
    'date.base': 'Data de fim deve ser uma data válida',
    'date.format': 'Data de fim deve estar no formato ISO',
  }),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt').optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});

export const toggleCommentLikeSchema = Joi.object({
  id: Joi.string().regex(/^[0-9a-fA-F]{24}$/).required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});