import { AppError } from '../middleware/error.middleware';
import { User, Activity } from '../models';
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
import { Op } from 'sequelize';

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
    const existingUser = await User.findOne({ where: { email: userData.email } });

    if (existingUser) {
      throw new AppError(MESSAGES.VALIDATION.EMAIL_EXISTS, 409);
    }

    // Criar usuário
    const user = await User.create(userData);

    // Gerar tokens
    const tokens = generateTokens(user);

    // Atualizar último login
    user.lastLogin = new Date();
    await user.save();

    // Criar registro de atividade em background (não bloqueia o registro)
    // Usando setImmediate para não bloquear o fluxo principal
    setImmediate(async () => {
      try {
        await Activity.create({
          type: ACTIVITY_TYPES.PROFILE_UPDATED,
          userId: user.id,
          targetUserId: user.id,
          description: 'Conta de usuário criada',
        });
      } catch (error) {
        // Log do erro mas não falha o registro
        console.error('Erro ao criar atividade de registro:', error);
      }
    });

    return {
      user: {
        id: user.id,
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
    const user = await User.scope('withPassword').findOne({ where: { email: loginData.email } });

    if (!user) {
      throw new AppError(MESSAGES.VALIDATION.INVALID_CREDENTIALS, 401);
    }

    if (!user.isActive) {
      throw new AppError('Sua conta está desativada. Entre em contato com o administrador.', 403);
    }

    const isPasswordValid = await user.comparePassword(loginData.password);

    if (!isPasswordValid) {
      throw new AppError(MESSAGES.VALIDATION.INVALID_CREDENTIALS, 401);
    }

    const tokens = generateTokens(user);

    const previousLogin = user.lastLogin;
    user.lastLogin = new Date();
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      userId: user.id,
      targetUserId: user.id,
      description: 'Usuário realizou login',
      metadata: {
        previousLogin
      }
    });

    return {
      user: {
        id: user.id,
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
    const decoded = verifyToken(refreshToken);

    if (!decoded) {
      throw new AppError('Token de refresh inválido ou expirado', 401);
    }

    const user = await User.findByPk(decoded.id);

    if (!user) {
      throw new AppError('Usuário não encontrado', 404);
    }

    if (!user.isActive) {
      throw new AppError('Sua conta está desativada. Entre em contato com o administrador.', 403);
    }

    const tokens = generateTokens(user);

    return tokens;
  }

  /**
   * Altera a senha do usuário
   * @param userId ID do usuário
   * @param passwordData Dados de senha
   */
  public async changePassword(userId: string, passwordData: ChangePasswordInput): Promise<void> {
    const user = await User.scope('withPassword').findByPk(userId);

    if (!user) {
      throw new AppError(MESSAGES.NOT_FOUND.USER, 404);
    }

    const isCurrentPasswordValid = await user.comparePassword(passwordData.currentPassword);

    if (!isCurrentPasswordValid) {
      throw new AppError('Senha atual incorreta', 400);
    }

    if (passwordData.currentPassword === passwordData.newPassword) {
      throw new AppError('A nova senha deve ser diferente da senha atual', 400);
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      throw new AppError(MESSAGES.VALIDATION.PASSWORDS_DONT_MATCH, 400);
    }

    user.password = passwordData.newPassword;
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      userId: userId,
      targetUserId: userId,
      description: 'Senha alterada pelo usuário',
    });
  }

  /**
   * Solicita redefinição de senha
   * @param data Dados para redefinição de senha
   * @returns Booleano indicando sucesso
   */
  public async forgotPassword(data: ForgotPasswordInput): Promise<boolean> {
    const user = await User.findOne({ where: { email: data.email } });

    if (!user) {
      return true;
    }

    const resetToken = user.createPasswordResetToken();
    await user.save();

    sendPasswordResetEmail(user.email, resetToken);

    console.log(`Token de redefinição para ${user.email}: ${resetToken}`);

    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      userId: user.id,
      targetUserId: user.id,
      description: 'Solicitação de redefinição de senha',
    });

    return true;
  }

  /**
   * Redefine a senha do usuário
   * @param data Dados para redefinição de senha
   */
  public async resetPassword(data: ResetPasswordInput): Promise<void> {
    if (data.newPassword !== data.confirmPassword) {
      throw new AppError(MESSAGES.VALIDATION.PASSWORDS_DONT_MATCH, 400);
    }

    const user = await User.findOne({
      where: {
        resetPasswordToken: data.token,
        resetPasswordExpires: { [Op.gt]: new Date() },
      }
    });

    if (!user) {
      throw new AppError('Token inválido ou expirado', 400);
    }

    user.password = data.newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await Activity.create({
      type: ACTIVITY_TYPES.PASSWORD_CHANGED,
      userId: user.id,
      targetUserId: user.id,
      description: 'Senha redefinida com sucesso',
    });
  }

  /**
   * Realiza logout
   * @param userId ID do usuário
   * @returns Booleano indicando sucesso
   */
  public async logout(userId: string): Promise<boolean> {
    await Activity.create({
      type: ACTIVITY_TYPES.PROFILE_UPDATED,
      userId: userId,
      targetUserId: userId,
      description: 'Usuário realizou logout',
    });
    return true;
  }
}

export default new AuthService();

function sendPasswordResetEmail(email: string, resetToken: string) {
  throw new Error('Function not implemented.');
}
