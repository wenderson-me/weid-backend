import { NoteCategory } from '../models/note.model';
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
  id: string;
  title: string;
  content: string;
  ownerId: string;
  owner?: UserResponse;
  category: NoteCategory;
  color?: string;
  isPinned: boolean;
  tags: string[];
  createdById: string;
  createdBy?: UserResponse;
  updatedById?: string;
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

export const sanitizeNote = (note: any): NoteResponse => {
  const sanitizedNote: any = {
    id: note.id,
    title: note.title,
    content: note.content,
    ownerId: note.ownerId,
    category: note.category,
    color: note.color,
    isPinned: note.isPinned,
    tags: note.tags || [],
    createdById: note.createdById,
    updatedById: note.updatedById,
    createdAt: note.createdAt,
    updatedAt: note.updatedAt,
  };

  if (note.owner && typeof note.owner === 'object') {
    sanitizedNote.owner = sanitizeUser(note.owner);
  }

  if (note.creator && typeof note.creator === 'object') {
    sanitizedNote.createdBy = sanitizeUser(note.creator);
  }

  if (note.updater && typeof note.updater === 'object') {
    sanitizedNote.updatedBy = sanitizeUser(note.updater);
  }

  return sanitizedNote;
};