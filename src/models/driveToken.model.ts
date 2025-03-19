import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './user.model';

export interface IDriveToken extends Document {
  user: mongoose.Types.ObjectId | IUser;
  accessToken: string;
  refreshToken: string;
  expiryDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const driveTokenSchema = new Schema<IDriveToken>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    accessToken: {
      type: String,
      required: true
    },
    refreshToken: {
      type: String,
      required: true
    },
    expiryDate: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Índice para melhorar a performance
driveTokenSchema.index({ user: 1 });

const DriveToken = mongoose.model<IDriveToken>('DriveToken', driveTokenSchema);

export default DriveToken;