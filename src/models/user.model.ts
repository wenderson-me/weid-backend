// src/models/user.model.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// Add preferences interface
export interface UserPreferences {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultTaskView?: 'list' | 'board' | 'calendar';
  defaultTaskFilter?: {
    status?: string[];
    priority?: string[];
  };
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar?: string;
  role: 'user' | 'admin' | 'manager';
  isActive: boolean;
  lastLogin?: Date;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  preferences?: UserPreferences; // Add preferences field
  createdAt: Date;
  updatedAt: Date;

  // Métodos
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: number): boolean;
  createPasswordResetToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Nome é obrigatório'],
      trim: true,
      minlength: [2, 'Nome deve ter pelo menos 2 caracteres'],
      maxlength: [100, 'Nome deve ter no máximo 100 caracteres']
    },
    email: {
      type: String,
      required: [true, 'Email é obrigatório'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(v: string) {
          return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
        },
        message: 'Por favor, forneça um email válido'
      }
    },
    password: {
      type: String,
      required: [true, 'Senha é obrigatória'],
      minlength: [8, 'Senha deve ter pelo menos 8 caracteres'],
      select: false // Não incluir a senha em consultas
    },
    avatar: {
      type: String,
      default: 'default-avatar.png'
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin', 'manager'],
        message: 'Papel deve ser: user, admin ou manager'
      },
      default: 'user'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLogin: {
      type: Date
    },
    passwordChangedAt: {
      type: Date
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    preferences: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      language: {
        type: String,
        default: 'pt-BR'
      },
      defaultTaskView: {
        type: String,
        enum: ['list', 'board', 'calendar'],
        default: 'board'
      },
      defaultTaskFilter: {
        status: [String],
        priority: [String]
      }
    }
  },
  {
    timestamps: true, // Adiciona createdAt e updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Middleware e métodos permanecem os mesmos...
// Middleware para hash da senha antes de salvar
userSchema.pre<IUser>('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('password')) return next();

  // Hash da senha com custo de 12
  this.password = await bcrypt.hash(this.password, 12);

  // Atualiza data de mudança de senha
  if (this.isNew) {
    this.passwordChangedAt = undefined;
  } else {
    this.passwordChangedAt = new Date();
  }

  next();
});

// Método para verificar se a senha está correta
userSchema.methods.comparePassword = async function(
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Método para verificar se a senha foi alterada após a emissão do token
userSchema.methods.changedPasswordAfter = function(JWTTimestamp: number): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

// Método para criar token de redefinição de senha
userSchema.methods.createPasswordResetToken = function(): string {
  const resetToken = Math.random().toString(36).slice(-8);

  // Hash e salva o token
  this.passwordResetToken = bcrypt.hashSync(resetToken, 8);

  // Define a expiração para 10 minutos
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);

  return resetToken;
};

// Índices
userSchema.index({ email: 1 });

const User = mongoose.model<IUser>('User', userSchema);

export default User;