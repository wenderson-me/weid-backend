import bcrypt from 'bcryptjs';

/**
 * Gera um hash da senha
 * @param password Senha em texto puro
 * @returns Hash da senha
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12);
};

/**
 * Compara uma senha em texto puro com um hash
 * @param plainPassword Senha em texto puro
 * @param hashedPassword Hash da senha
 * @returns true se a senha corresponder ao hash, false caso contrário
 */
export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return await bcrypt.compare(plainPassword, hashedPassword);
};

/**
 * Gera uma senha aleatória
 * @param length Comprimento da senha
 * @returns Senha aleatória
 */
export const generateRandomPassword = (length = 10): string => {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
  let password = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    password += charset[randomIndex];
  }

  return password;
};

/**
 * Valida a força da senha
 * @param password Senha a ser validada
 * @returns Objeto com indicador de validade e mensagem de erro, se houver
 */
export const validatePasswordStrength = (
  password: string
): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return {
      isValid: false,
      message: 'A senha deve ter pelo menos 8 caracteres',
    };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChars) {
    return {
      isValid: false,
      message: 'A senha deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
    };
  }

  return { isValid: true };
};