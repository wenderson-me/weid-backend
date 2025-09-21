import mongoose from 'mongoose';
import { NoteCategory, INote } from '../models/note.model';
import { IUser } from '../models/user.model';
import { sanitizeUser, UserResponse } from './user.types';

export interface CreateNoteInput {
  title: string;
  content: string;
  category?: NoteCategory;
  color?: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface UpdateNoteInput {
  title?: string;
  content?: string;
  category?: NoteCategory;
  color?: string;
  isPinned?: boolean;
  tags?: string[];
}

export interface NoteFilterOptions {
  owner?: string;
  category?: NoteCategory | NoteCategory[];
  search?: string;
  isPinned?: boolean;
  tags?: string[];
  createdStart?: Date;
  createdEnd?: Date;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NoteResponse {
  _id: string;
  title: string;
  content: string;
  owner: UserResponse;
  category: NoteCategory;
  color?: string;
  isPinned: boolean;
  tags: string[];
  createdBy: UserResponse;
  updatedBy?: UserResponse;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotesWithPagination {
  notes: NoteResponse[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const sanitizeNote = (note: INote, populateUsers = true): NoteResponse => {
  const sanitizedNote: any = {
    _id: note._id.toString(),
    title: note.title,
    content: note.content,
    category: note.category,
    color: note.color,
    isPinned: note.isPinned,
    tags: note.tags,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };

  if (populateUsers) {
    if (note.owner instanceof mongoose.Types.ObjectId) {
      sanitizedNote.owner = note.owner.toString();
    } else {
      sanitizedNote.owner = sanitizeUser(note.owner as IUser);
    }

    if (note.createdBy instanceof mongoose.Types.ObjectId) {
      sanitizedNote.createdBy = note.createdBy.toString();
    } else {
      sanitizedNote.createdBy = sanitizeUser(note.createdBy as IUser);
    }

    if (note.updatedBy) {
      if (note.updatedBy instanceof mongoose.Types.ObjectId) {
        sanitizedNote.updatedBy = note.updatedBy.toString();
      } else {
        sanitizedNote.updatedBy = sanitizeUser(note.updatedBy as IUser);
      }
    }
  } else {
    sanitizedNote.owner = note.owner.toString();
    sanitizedNote.createdBy = note.createdBy.toString();
    if (note.updatedBy) {
      sanitizedNote.updatedBy = note.updatedBy.toString();
    }
  }

  return sanitizedNote;
};