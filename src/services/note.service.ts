import mongoose from 'mongoose';
import { AppError } from '../middleware/error.middleware';
import Note, { INote } from '../models/note.model';
import Activity from '../models/activity.model';
import {
  CreateNoteInput,
  UpdateNoteInput,
  NoteFilterOptions,
  NoteResponse,
  NotesWithPagination,
  sanitizeNote
} from '../types/note.types';
import { MESSAGES, DEFAULT_PAGINATION, DEFAULT_SORTING, ACTIVITY_TYPES } from '../utils/constants';

/**
 * Serviço de notas
 */
class NoteService {
  /**
   * Cria uma nova nota
   * @param {Object} noteData Dados da nota
   * @param {string} userId ID do usuário criador
   * @returns {Promise<NoteResponse>} Nota criada
   */
  async createNote(noteData: CreateNoteInput, userId: string): Promise<NoteResponse> {
    // Criar a nota
    const note = await Note.create({
      ...noteData,
      owner: userId,
      createdBy: userId,
    });

    // Registrar atividade
    await Activity.create({
      type: ACTIVITY_TYPES.NOTE_CREATED,
      note: note._id,
      user: userId,
      description: `Nota criada: ${note.title}`,
      metadata: {
        category: note.category,
        isPinned: note.isPinned
      }
    });

    // Preencher dados populados para a resposta
    const populatedNote = await Note.findById(note._id)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email avatar');

    return sanitizeNote(populatedNote as INote);
  }

  /**
   * Atualiza uma nota existente
   * @param {string} noteId ID da nota
   * @param {Object} noteData Dados para atualização
   * @param {string} userId ID do usuário que faz a atualização
   * @returns {Promise<NoteResponse>} Nota atualizada
   */
  async updateNote(noteId: string, noteData: UpdateNoteInput, userId: string): Promise<NoteResponse> {
    // Verificar se a nota existe
    const note = await Note.findById(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    // Verificar se o usuário é o proprietário da nota
    if (note.owner.toString() !== userId) {
      throw new AppError('Você não tem permissão para atualizar esta nota', 403);
    }

    // Capturar valores antigos para comparação
    const oldTitle = note.title;
    const oldContent = note.content;
    const oldCategory = note.category;
    const oldIsPinned = note.isPinned;

    // Atualizar nota
    Object.assign(note, {
      ...noteData,
      updatedBy: userId,
    });

    await note.save();

    // Registrar atividade de atualização
    const activities = [];

    // Atividade genérica de atualização
    activities.push({
      type: ACTIVITY_TYPES.NOTE_UPDATED,
      note: note._id,
      user: userId,
      description: `Nota atualizada: ${note.title}`,
      metadata: {
        changes: Object.keys(noteData),
      }
    });

    // Verificar se o status de fixação foi alterado
    if (noteData.isPinned !== undefined && oldIsPinned !== noteData.isPinned) {
      activities.push({
        type: noteData.isPinned ? ACTIVITY_TYPES.NOTE_PINNED : ACTIVITY_TYPES.NOTE_UNPINNED,
        note: note._id,
        user: userId,
        description: noteData.isPinned
          ? 'Nota foi fixada'
          : 'Nota foi desfixada',
      });
    }

    // Salvar todas as atividades
    await Activity.insertMany(activities);

    // Preencher dados populados para a resposta
    const populatedNote = await Note.findById(note._id)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    return sanitizeNote(populatedNote as INote);
  }

  /**
   * Busca uma nota pelo ID
   * @param {string} noteId ID da nota
   * @param {string} userId ID do usuário que faz a consulta
   * @returns {Promise<NoteResponse>} Nota encontrada
   */
  async getNoteById(noteId: string, userId: string): Promise<NoteResponse> {
    const note = await Note.findById(noteId)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    return sanitizeNote(note);
  }

  /**
   * Lista notas com filtros e paginação
   * @param {Object} options Opções de filtro e paginação
   * @param {string} userId ID do usuário que faz a consulta
   * @returns {Promise<NotesWithPagination>} Lista de notas e metadados de paginação
   */
  async getNotes(options: NoteFilterOptions, userId: string): Promise<NotesWithPagination> {
    const {
      category,
      search,
      isPinned,
      tags,
      createdStart,
      createdEnd,
      page = DEFAULT_PAGINATION.PAGE,
      limit = DEFAULT_PAGINATION.LIMIT,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    // Construir filtro
    const filter: any = { owner: userId }; // O usuário só pode ver suas próprias notas

    if (category) {
      filter.category = Array.isArray(category) ? { $in: category } : category;
    }

    if (search) {
      // Utiliza o índice de texto para pesquisa mais eficiente
      filter.$text = { $search: search };
    }

    if (typeof isPinned === 'boolean') {
      filter.isPinned = isPinned;
    }

    if (tags) {
      filter.tags = Array.isArray(tags)
        ? { $in: tags }
        : { $in: [tags] };
    }

    if (createdStart || createdEnd) {
      filter.createdAt = {};

      if (createdStart) {
        filter.createdAt.$gte = new Date(createdStart);
      }

      if (createdEnd) {
        filter.createdAt.$lte = new Date(createdEnd);
      }
    }

    // Contar total de notas
    const total = await Note.countDocuments(filter);

    // Calcular páginas
    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    // Ajustar a ordenação para considerar o score de texto se houver pesquisa
    let sortOptions: any = {};
    if (search && sortBy === 'relevance') {
      sortOptions = { score: { $meta: 'textScore' } };
    } else {
      sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;
    }

    // Buscar notas
    let query = Note.find(filter);

    // Adicionar score de texto para ordenação se for uma pesquisa de texto
    if (search && sortBy === 'relevance') {
      query = query.select({ score: { $meta: 'textScore' } });
    }

    const notes = await query
      .sort(sortOptions)
      .skip(skip)
      .limit(limit)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    // Sanitizar notas
    const sanitizedNotes = notes.map(note => sanitizeNote(note));

    return {
      notes: sanitizedNotes,
      total,
      page: currentPage,
      limit,
      pages,
    };
  }

  /**
   * Exclui uma nota pelo ID
   * @param {string} noteId ID da nota
   * @param {string} userId ID do usuário que tenta excluir a nota
   * @returns {Promise<boolean>} Booleano indicando sucesso
   */
  async deleteNote(noteId: string, userId: string): Promise<boolean> {
    const note = await Note.findById(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    // Verificar se o usuário é o proprietário da nota
    if (note.owner.toString() !== userId) {
      throw new AppError('Você não tem permissão para excluir esta nota', 403);
    }

    // Registrar atividade de exclusão
    await Activity.create({
      type: ACTIVITY_TYPES.NOTE_DELETED,
      note: note._id,
      user: userId,
      description: `Nota excluída: ${note.title}`,
      metadata: {
        category: note.category,
        isPinned: note.isPinned
      }
    });

    // Excluir a nota
    await note.deleteOne();

    return true;
  }

  /**
   * Altera o status de fixação de uma nota
   * @param {string} noteId ID da nota
   * @param {boolean} isPinned Estado de fixação desejado
   * @param {string} userId ID do usuário que está alterando o estado
   * @returns {Promise<NoteResponse>} Nota atualizada
   */
  async togglePinStatus(noteId: string, isPinned: boolean, userId: string): Promise<NoteResponse> {
    const note = await Note.findById(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    // Verificar se o usuário é o proprietário da nota
    if (note.owner.toString() !== userId) {
      throw new AppError('Você não tem permissão para alterar esta nota', 403);
    }

    // Se o status já é o mesmo, não faz nada
    if (note.isPinned === isPinned) {
      return sanitizeNote(note);
    }

    // Atualizar status
    note.isPinned = isPinned;
    note.updatedBy = new mongoose.Types.ObjectId(userId);
    await note.save();

    // Registrar atividade
    await Activity.create({
      type: isPinned ? ACTIVITY_TYPES.NOTE_PINNED : ACTIVITY_TYPES.NOTE_UNPINNED,
      note: note._id,
      user: userId,
      description: isPinned
        ? 'Nota foi fixada'
        : 'Nota foi desfixada',
    });

    // Preencher dados populados para a resposta
    const populatedNote = await Note.findById(note._id)
      .populate('owner', 'name email avatar')
      .populate('createdBy', 'name email avatar')
      .populate('updatedBy', 'name email avatar');

    return sanitizeNote(populatedNote as INote);
  }

  /**
   * Obtém um resumo das notas do usuário
   * @param {string} userId ID do usuário
   * @returns {Promise<Object>} Estatísticas das notas
   */
  async getNoteStatistics(userId: string): Promise<{
    total: number;
    byCategory: Record<string, number>;
    pinned: number;
  }> {
    // Contagem total
    const total = await Note.countDocuments({ owner: userId });

    // Contagem por categoria
    const categoryCounts = await Note.aggregate([
      { $match: { owner: new mongoose.Types.ObjectId(userId) } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    const byCategory: Record<string, number> = {};
    categoryCounts.forEach((item) => {
      byCategory[item._id] = item.count;
    });

    // Contagem de notas fixadas
    const pinned = await Note.countDocuments({ owner: userId, isPinned: true });

    return {
      total,
      byCategory,
      pinned,
    };
  }
}

export default new NoteService();