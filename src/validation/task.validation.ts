import Joi from 'joi';
import { TASK_STATUS, TASK_PRIORITY } from '../utils/constants';

export const createTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().messages({
    'string.base': 'Título deve ser um texto',
    'string.empty': 'Título é obrigatório',
    'string.min': 'Título deve ter pelo menos {#limit} caracteres',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
    'any.required': 'Título é obrigatório',
  }),
  description: Joi.string().allow('').optional(),
  status: Joi.string()
    .valid(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW, TASK_STATUS.DONE)
    .default(TASK_STATUS.TODO)
    .messages({
      'string.base': 'Status deve ser um texto',
      'any.only': 'Status deve ser: todo, inProgress, inReview ou done',
    }),
  priority: Joi.string()
    .valid(TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH, TASK_PRIORITY.URGENT)
    .default(TASK_PRIORITY.MEDIUM)
    .messages({
      'string.base': 'Prioridade deve ser um texto',
      'any.only': 'Prioridade deve ser: low, medium, high ou urgent',
    }),
  dueDate: Joi.date().iso().optional().messages({
    'date.base': 'Data de entrega deve ser uma data válida',
    'date.format': 'Data de entrega deve estar no formato ISO',
  }),
  estimatedHours: Joi.number().min(0).optional().messages({
    'number.base': 'Horas estimadas deve ser um número',
    'number.min': 'Horas estimadas não pode ser negativo',
  }),
  assignees: Joi.array().items(
    Joi.string().uuid().messages({
      'string.pattern.base': 'ID de usuário inválido',
    })
  ).optional(),
  tags: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Tag deve ser um texto',
    })
  ).optional(),
  color: Joi.string().optional(),
});

export const updateTaskSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().messages({
    'string.base': 'Título deve ser um texto',
    'string.min': 'Título deve ter pelo menos {#limit} caracteres',
    'string.max': 'Título deve ter no máximo {#limit} caracteres',
  }),
  description: Joi.string().allow('').optional(),
  status: Joi.string()
    .valid(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW, TASK_STATUS.DONE)
    .optional()
    .messages({
      'string.base': 'Status deve ser um texto',
      'any.only': 'Status deve ser: todo, inProgress, inReview ou done',
    }),
  priority: Joi.string()
    .valid(TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH, TASK_PRIORITY.URGENT)
    .optional()
    .messages({
      'string.base': 'Prioridade deve ser um texto',
      'any.only': 'Prioridade deve ser: low, medium, high ou urgent',
    }),
  dueDate: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Data de entrega deve ser uma data válida',
    'date.format': 'Data de entrega deve estar no formato ISO',
  }),
  estimatedHours: Joi.number().min(0).allow(null).optional().messages({
    'number.base': 'Horas estimadas deve ser um número',
    'number.min': 'Horas estimadas não pode ser negativo',
  }),
  assignees: Joi.array().items(
    Joi.string().uuid().messages({
      'string.pattern.base': 'ID de usuário inválido',
    })
  ).optional(),
  tags: Joi.array().items(
    Joi.string().messages({
      'string.base': 'Tag deve ser um texto',
    })
  ).optional(),
  color: Joi.string().optional().allow(''),
  progress: Joi.number().min(0).max(100).optional().messages({
    'number.base': 'Progresso deve ser um número',
    'number.min': 'Progresso deve ser no mínimo 0',
    'number.max': 'Progresso deve ser no máximo 100',
  }),
  isArchived: Joi.boolean().optional(),
});

export const getTaskSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const deleteTaskSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    'string.base': 'ID deve ser um texto',
    'string.empty': 'ID é obrigatório',
    'string.pattern.base': 'Por favor, forneça um ID válido',
    'any.required': 'ID é obrigatório',
  }),
});

export const queryTasksSchema = Joi.object({
  status: Joi.alternatives().try(
    Joi.string().valid(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW, TASK_STATUS.DONE),
    Joi.array().items(
      Joi.string().valid(TASK_STATUS.TODO, TASK_STATUS.IN_PROGRESS, TASK_STATUS.IN_REVIEW, TASK_STATUS.DONE)
    )
  ).optional(),
  priority: Joi.alternatives().try(
    Joi.string().valid(TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH, TASK_PRIORITY.URGENT),
    Joi.array().items(
      Joi.string().valid(TASK_PRIORITY.LOW, TASK_PRIORITY.MEDIUM, TASK_PRIORITY.HIGH, TASK_PRIORITY.URGENT)
    )
  ).optional(),
  owner: Joi.string().uuid().optional(),
  assignee: Joi.string().uuid().optional(),
  search: Joi.string().optional(),
  tags: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string())
  ).optional(),
  dueStart: Joi.date().iso().optional(),
  dueEnd: Joi.date().iso().optional(),
  isArchived: Joi.boolean().optional(),
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string().valid(
    'title',
    'status',
    'priority',
    'dueDate',
    'createdAt',
    'updatedAt',
    'progress'
  ).optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
});