import { AppError } from '../middleware/error.middleware';
import { Note, Activity, User } from '../models/index.pg';
import { Op } from 'sequelize';
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
    const note = await Note.create({
      ...noteData,
      ownerId: userId,
      createdById: userId,
    });

    await Activity.create({
      type: ACTIVITY_TYPES.NOTE_CREATED,
      noteId: note.id,
      userId: userId,
      description: `Nota criada: ${note.title}`,
      metadata: {
        category: note.category,
        isPinned: note.isPinned
      }
    });

    const populatedNote = await Note.findByPk(note.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeNote(populatedNote);
  }

  /**
   * Atualiza uma nota existente
   * @param {string} noteId ID da nota
   * @param {Object} noteData Dados para atualização
   * @param {string} userId ID do usuário que faz a atualização
   * @returns {Promise<NoteResponse>} Nota atualizada
   */
  async updateNote(noteId: string, noteData: UpdateNoteInput, userId: string): Promise<NoteResponse> {
    const note = await Note.findByPk(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    if (note.ownerId !== userId) {
      throw new AppError('Você não tem permissão para atualizar esta nota', 403);
    }

    const oldTitle = note.title;
    const oldContent = note.content;
    const oldCategory = note.category;
    const oldIsPinned = note.isPinned;

    Object.assign(note, {
      ...noteData,
      updatedBy: userId,
    });

    await note.save();

    const activities = [];

    activities.push({
      type: ACTIVITY_TYPES.NOTE_UPDATED,
      noteId: note.id,
      userId: userId,
      description: `Nota atualizada: ${note.title}`,
      metadata: {
        changes: Object.keys(noteData),
      }
    });

    if (noteData.isPinned !== undefined && oldIsPinned !== noteData.isPinned) {
      activities.push({
        type: noteData.isPinned ? ACTIVITY_TYPES.NOTE_PINNED : ACTIVITY_TYPES.NOTE_UNPINNED,
        noteId: note.id,
        userId: userId,
        description: noteData.isPinned
          ? 'Nota foi fixada'
          : 'Nota foi desfixada',
      });
    }

    await Activity.bulkCreate(activities);

    const populatedNote = await Note.findByPk(note.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeNote(populatedNote);
  }

  /**
   * Busca uma nota pelo ID
   * @param {string} noteId ID da nota
   * @param {string} userId ID do usuário que faz a consulta
   * @returns {Promise<NoteResponse>} Nota encontrada
   */
  async getNoteById(noteId: string, userId: string): Promise<NoteResponse> {
    const note = await Note.findByPk(noteId, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

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

    const filter: any = { ownerId: userId };

    if (category) {
      filter.category = Array.isArray(category) ? { [Op.in]: category } : category;
    }

    if (search) {
      filter[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    if (typeof isPinned === 'boolean') {
      filter.isPinned = isPinned;
    }

    if (tags) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { [Op.overlap]: tagArray };
    }

    if (createdStart || createdEnd) {
      filter.createdAt = {};

      if (createdStart) {
        filter.createdAt[Op.gte] = new Date(createdStart);
      }

      if (createdEnd) {
        filter.createdAt[Op.lte] = new Date(createdEnd);
      }
    }

    const total = await Note.count({ where: filter });

    const pages = Math.ceil(total / limit);
    const currentPage = page > pages ? pages || 1 : page;
    const skip = (currentPage - 1) * limit;

    const order: any[] = [];
    if (sortBy) {
      order.push([sortBy, sortOrder === 'asc' ? 'ASC' : 'DESC']);
    }

    const notes = await Note.findAll({
      where: filter,
      order,
      offset: skip,
      limit,
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    const sanitizedNotes = notes.map((note: any) => sanitizeNote(note));

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
    const note = await Note.findByPk(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    if (note.ownerId !== userId) {
      throw new AppError('Você não tem permissão para excluir esta nota', 403);
    }

    await Activity.create({
      type: ACTIVITY_TYPES.NOTE_DELETED,
      noteId: note.id,
      userId: userId,
      description: `Nota excluída: ${note.title}`,
      metadata: {
        category: note.category,
        isPinned: note.isPinned
      }
    });

    await note.destroy();

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
    const note = await Note.findByPk(noteId);

    if (!note) {
      throw new AppError('Nota não encontrada', 404);
    }

    if (note.ownerId !== userId) {
      throw new AppError('Você não tem permissão para alterar esta nota', 403);
    }

    if (note.isPinned === isPinned) {
      return sanitizeNote(note);
    }

    note.isPinned = isPinned;
    note.updatedById = userId;
    await note.save();

    await Activity.create({
      type: isPinned ? ACTIVITY_TYPES.NOTE_PINNED : ACTIVITY_TYPES.NOTE_UNPINNED,
      noteId: note.id,
      userId: userId,
      description: isPinned
        ? 'Nota foi fixada'
        : 'Nota foi desfixada',
    });

    const populatedNote = await Note.findByPk(note.id, {
      include: [
        { model: User, as: 'owner', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'avatar'] },
        { model: User, as: 'updater', attributes: ['id', 'name', 'email', 'avatar'] }
      ]
    });

    return sanitizeNote(populatedNote);
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
    const total = await Note.count({ where: { ownerId: userId } });

    const categoryCounts = await Note.findAll({
      where: { ownerId: userId },
      attributes: [
        'category',
        [Note.sequelize!.fn('COUNT', Note.sequelize!.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    }) as any[];

    const byCategory: Record<string, number> = {};
    categoryCounts.forEach((item: any) => {
      byCategory[item.category] = parseInt(item.count, 10);
    });

    const pinned = await Note.count({ where: { ownerId: userId, isPinned: true } });

    return {
      total,
      byCategory,
      pinned,
    };
  }
}

export default new NoteService();