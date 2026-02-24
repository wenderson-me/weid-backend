import Joi from 'joi';

const passwordRules = Joi.string()
  .min(8)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])/)
  .message(
    'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais'
  );

export const registerSchema = Joi.object({
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
  password: passwordRules.required().messages({
    'string.base': 'Senha deve ser um texto',
    'string.empty': 'Senha é obrigatória',
    'string.min': 'Senha deve ter pelo menos {#limit} caracteres',
    'string.pattern.base': 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    'any.required': 'Senha é obrigatória',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'string.base': 'Confirmação de senha deve ser um texto',
    'string.empty': 'Confirmação de senha é obrigatória',
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória',
  }),
  role: Joi.string().valid('user', 'admin', 'manager').default('user').messages({
    'string.base': 'Papel deve ser um texto',
    'any.only': 'Papel deve ser: user, admin ou manager',
  }),
  avatar: Joi.string().optional(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required().messages({
    'string.base': 'Token deve ser um texto',
    'string.empty': 'Token é obrigatório',
    'any.required': 'Token é obrigatório',
  }),
  newPassword: passwordRules.required().messages({
    'string.base': 'Nova senha deve ser um texto',
    'string.empty': 'Nova senha é obrigatória',
    'string.min': 'Nova senha deve ter pelo menos {#limit} caracteres',
    'string.pattern.base': 'A nova senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    'any.required': 'Nova senha é obrigatória',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.base': 'Confirmação de senha deve ser um texto',
    'string.empty': 'Confirmação de senha é obrigatória',
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória',
  }),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email deve ser um texto',
    'string.empty': 'Email é obrigatório',
    'string.email': 'Por favor, forneça um email válido',
    'any.required': 'Email é obrigatório',
  }),
  password: Joi.string().required().messages({
    'string.base': 'Senha deve ser um texto',
    'string.empty': 'Senha é obrigatória',
    'any.required': 'Senha é obrigatória',
  }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required().messages({
    'string.base': 'Refresh token deve ser um texto',
    'string.empty': 'Refresh token é obrigatório',
    'any.required': 'Refresh token é obrigatório',
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'string.base': 'Senha atual deve ser um texto',
    'string.empty': 'Senha atual é obrigatória',
    'any.required': 'Senha atual é obrigatória',
  }),
  newPassword: passwordRules.required().messages({
    'string.base': 'Nova senha deve ser um texto',
    'string.empty': 'Nova senha é obrigatória',
    'string.min': 'Nova senha deve ter pelo menos {#limit} caracteres',
    'string.pattern.base': 'A nova senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    'any.required': 'Nova senha é obrigatória',
  }),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'string.base': 'Confirmação de senha deve ser um texto',
    'string.empty': 'Confirmação de senha é obrigatória',
    'any.only': 'As senhas não coincidem',
    'any.required': 'Confirmação de senha é obrigatória',
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.base': 'Email deve ser um texto',
    'string.empty': 'Email é obrigatório',
    'string.email': 'Por favor, forneça um email válido',
    'any.required': 'Email é obrigatório',
  }),
});