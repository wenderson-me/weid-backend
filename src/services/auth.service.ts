import { AppError } from '../middleware/error.middleware';
import User from '../models/user.model';
import Activity from '../models/activity.model';
import {
  LoginInput,
  UserTokens,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  CreateUserInput
} from '../types/user.types';
import { comparePassword, hashPassword } from '../utils/password.util';
import { generateTokens, verifyToken } from '../utils/jwt.util';
import { MESSAGES, ACTIVITY_TYPES } from '../utils/constants';

/**
 * Serviço de autenticação
 */
class AuthService {
  /**
   * Registra um novo usuário
   * @param userData Dados do usuário
   * @returns Usuário criado e tokens
   */
  public async register(userData: CreateUserInput): Promise<{ user: any; tokens: UserTokens }> {
    // Verificar se o email já está em uso
    const existingUser = await User.findOne({ email: userData.email });

    if (existingUser) {
      throw new AppError(MESSAGES.VALIDATION.EMAIL_EXISTS, 409);
    }

    // Criar o novo usuário
    const user = await User.create(userData);

    // Gerar tokens para o usuário
    const tokens = generateTokens(user);

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Registrar atividade de criação de perfil
    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      user: user._id,
      targetUser: user._id,
      description: 'Conta de usuário criada',
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      tokens,
    };
  }

  /**
   * Realiza login do usuário
   * @param loginData Dados de login
   * @returns Usuário e tokens
   */
  public async login(loginData: LoginInput): Promise<{ user: any; tokens: UserTokens }> {
    // Buscar usuário pelo email
    const user = await User.findOne({ email: loginData.email }).select('+password');

    if (!user) {
      throw new AppError(MESSAGES.VALIDATION.INVALID_CREDENTIALS, 401);
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new AppError('Sua conta está desativada. Entre em contato com o administrador.', 403);
    }

    // Verificar senha
    const isPasswordValid = await user.comparePassword(loginData.password);

    if (!isPasswordValid) {
      throw new AppError(MESSAGES.VALIDATION.INVALID_CREDENTIALS, 401);
    }

    // Gerar tokens para o usuário
    const tokens = generateTokens(user);

    // Atualizar último login
    const previousLogin = user.lastLogin;
    user.lastLogin = new Date();
    await user.save();

    // Registrar atividade de login
    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      user: user._id,
      targetUser: user._id,
      description: 'Usuário realizou login',
      metadata: {
        previousLogin
      }
    });

    return {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      tokens,
    };
  }

  /**
   * Atualiza o token de acesso utilizando o token de refresh
   * @param refreshToken Token de refresh
   * @returns Novos tokens
   */
  public async refreshToken(refreshToken: string): Promise<UserTokens> {
    // Verificar se o token é válido
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      throw new AppError('Token de refresh inválido ou expirado', 401);
    }

    // Buscar usuário pelo ID do token
    const user = await User.findById(decoded.id);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    // Verificar se o usuário está ativo
    if (!user.isActive) {
      throw new AppError('Sua conta está desativada. Entre em contato com o administrador.', 403);
    }

    // Gerar novos tokens
    const tokens = generateTokens(user);

    return tokens;
  }

  /**
   * Altera a senha do usuário
   * @param userId ID do usuário
   * @param passwordData Dados de senha
   */
  public async changePassword(userId: string, passwordData: ChangePasswordInput): Promise<void> {
    // Buscar usuário pelo ID
    const user = await User.findById(userId).select('+password');

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);

    if (!isCurrentPasswordValid) {
      throw new AppError('Senha atual incorreta', 400);
    }

    // Verificar se nova senha é igual à atual
    if (passwordData.currentPassword === passwordData.newPassword) {
      throw new AppError('A nova senha deve ser diferente da senha atual', 400);
    }

    // Verificar se as senhas coincidem
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new AppError(MESSAGES.VALIDATION.PASSWORDS_DONT_MATCH, 400);
    }

    // Atualizar senha
    user.password = passwordData.newPassword;
    await user.save();

    // Registrar atividade de troca de senha
    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      user: userId,
      targetUser: userId,
      description: 'Senha alterada pelo usuário',
    });
  }

  /**
   * Solicita redefinição de senha
   * @param data Dados para redefinição de senha
   * @returns Booleano indicando sucesso
   */
  public async forgotPassword(data: ForgotPasswordInput): Promise<boolean> {
    // Buscar usuário pelo email
    const user = await User.findOne({ email: data.email });

    // Se o usuário não existir, retorna sucesso de qualquer forma por segurança
    if (!user) {
      return true;
    }

    // Gerar token de redefinição
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Em uma implementação real, aqui enviaríamos um email com o token
    // Para fins de demonstração, vamos apenas retornar sucesso
    console.log(`Token de redefinição para ${user.email}: ${resetToken}`);

    // Registrar atividade de solicitação de redefinição de senha
    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      user: user._id,
      targetUser: user._id,
      description: 'Solicitação de redefinição de senha',
    });

    return true;
  }

  /**
   * Redefine a senha do usuário
   * @param data Dados para redefinição de senha
   */
  public async resetPassword(data: ResetPasswordInput): Promise<void> {
    // Verificar se as senhas coincidem
    if (data.newPassword !== data.confirmPassword) {
      throw new AppError(MESSAGES.VALIDATION.PASSWORDS_DONT_MATCH, 400);
    }

    // Buscar usuário com token de redefinição válido
    const user = await User.findOne({
      passwordResetToken: data.token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      throw new AppError('Token inválido ou expirado', 400);
    }

    // Atualizar senha
    user.password = data.newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Registrar atividade de redefinição de senha
    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      user: user._id,
      targetUser: user._id,
      description: 'Senha redefinida com sucesso',
    });
  }

  /**
   * Realiza logout (apenas para finalidade de API, já que o JWT é stateless)
   * @param userId ID do usuário
   * @returns Booleano indicando sucesso
   */
  public async logout(userId: string): Promise<boolean> {
    // Registrar atividade de logout
    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      user: userId,
      targetUser: userId,
      description: 'Usuário realizou logout',
    });

    // Em uma implementação real com JWT blacklist ou similar, poderíamos invalidar o token aqui
    // Para fins de demonstração, vamos apenas retornar sucesso
    return true;
  }
}

export default new AuthService();