import { DataTypes, Model, Optional } from 'sequelize';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { getSequelize } from '../config/database';

export interface UserAttributes {
  id: string;
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin' | 'manager';
  isActive: boolean;
  isVerified: boolean;
  verificationToken?: string;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  preferences?: UserPreferences;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultTaskView?: 'list' | 'board' | 'calendar';
  defaultTaskFilter?: {
    status?: string[];
    priority?: string[];
  };
}

interface UserCreationAttributes extends Optional<UserAttributes,
  'id' | 'avatar' | 'role' | 'isActive' | 'isVerified' | 'lastLogin' | 'preferences' | 'createdAt' | 'updatedAt'
> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public name!: string;
  public email!: string;
  public password!: string;
  public avatar?: string;
  public role!: 'user' | 'admin' | 'manager';
  public isActive!: boolean;
  public isVerified!: boolean;
  public verificationToken?: string;
  public lastLogin?: Date;
  public passwordChangedAt?: Date;
  public resetPasswordToken?: string;
  public resetPasswordExpires?: Date;
  public preferences?: UserPreferences;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;

  public async comparePassword(candidatePassword: string): Promise<boolean> {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  public changedPasswordAfter(JWTTimestamp: number): boolean {
    if (this.passwordChangedAt) {
      const changedTimestamp = Math.floor(this.passwordChangedAt.getTime() / 1000);
      return JWTTimestamp < changedTimestamp;
    }
    return false;
  }

  public createPasswordResetToken(): string {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    this.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
    return resetToken;
  }
}

export const initUserModel = () => {
  const sequelize = getSequelize();

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Nome é obrigatório' },
          len: {
            args: [2, 100],
            msg: 'Nome deve ter entre 2 e 100 caracteres'
          }
        }
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: { msg: 'Email é obrigatório' },
          isEmail: { msg: 'Por favor, forneça um email válido' }
        },
        set(value: string) {
          this.setDataValue('email', value.toLowerCase().trim());
        }
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
          notEmpty: { msg: 'Senha é obrigatória' },
          len: {
            args: [8, 255],
            msg: 'Senha deve ter pelo menos 8 caracteres'
          }
        }
      },
      avatar: {
        type: DataTypes.STRING(500),
        allowNull: true,
        defaultValue: 'default-avatar.png'
      },
      role: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'user',
        validate: {
          isIn: {
            args: [['user', 'admin', 'manager']],
            msg: 'Papel deve ser: user, admin ou manager'
          }
        }
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      isVerified: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      verificationToken: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
      },
      passwordChangedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      resetPasswordToken: {
        type: DataTypes.STRING(500),
        allowNull: true
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
      },
      preferences: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: {
          theme: 'system',
          language: 'pt-BR',
          defaultTaskView: 'board'
        }
      }
    },
    {
      sequelize,
      tableName: 'users',
      modelName: 'User',
      timestamps: true,
      underscored: true,
      hooks: {
        beforeCreate: async (user: User) => {
          if (user.password) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
          }
        },
        beforeUpdate: async (user: User) => {
          if (user.changed('password')) {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
            user.passwordChangedAt = new Date();
          }
        }
      },
      defaultScope: {
        attributes: { exclude: ['password'] }
      },
      scopes: {
        withPassword: {
          attributes: { include: ['password'] }
        },
        active: {
          where: { isActive: true }
        },
        verified: {
          where: { isVerified: true }
        }
      }
    }
  );

  return User;
};

export default User;
