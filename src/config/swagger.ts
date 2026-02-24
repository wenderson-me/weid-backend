import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import config from './environment';

const components = {
  securitySchemes: {
    bearerAuth: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  schemas: {
    Error: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['error'],
          example: 'error',
        },
        message: {
          type: 'string',
          example: 'Mensagem de erro',
        },
        errors: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              message: { type: 'string' },
              path: { type: 'array', items: { type: 'string' } },
            },
          },
          example: [
            { message: 'Email é obrigatório', path: ['email'] },
            { message: 'Senha deve ter no mínimo 8 caracteres', path: ['password'] },
          ],
        },
      },
      required: ['status', 'message'],
    },
    User: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6123456789abcdef01234567' },
        name: { type: 'string', example: 'Nome do Usuário' },
        email: { type: 'string', format: 'email', example: 'usuario@exemplo.com' },
        role: { type: 'string', enum: ['user', 'admin', 'manager'], example: 'user' },
        avatar: { type: 'string', example: 'url_do_avatar.png' },
        isActive: { type: 'boolean', example: true },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-15T10:30:40.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2023-01-15T10:30:40.000Z' }
      },
      required: ['_id', 'name', 'email', 'role', 'isActive', 'createdAt', 'updatedAt'],
    },
    TaskStatus: {
      type: 'string',
      enum: ['todo', 'inProgress', 'inReview', 'done'],
      example: 'inProgress'
    },
    TaskPriority: {
      type: 'string',
      enum: ['low', 'medium', 'high', 'urgent'],
      example: 'medium'
    },
    Task: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6123456789abcdef01234568' },
        title: { type: 'string', example: 'Implementar Frontend' },
        description: { type: 'string', example: 'Desenvolver a interface do usuário' },
        status: { $ref: '#/components/schemas/TaskStatus' },
        priority: { $ref: '#/components/schemas/TaskPriority' },
        dueDate: { type: 'string', format: 'date-time', example: '2023-03-15T00:00:00.000Z' },
        estimatedHours: { type: 'number', example: 20 },
        owner: { $ref: '#/components/schemas/User' },
        assignees: {
          type: 'array',
          items: { $ref: '#/components/schemas/User' }
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['frontend', 'UI', 'React']
        },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          example: ['url_anexo_1.pdf', 'url_anexo_2.jpg']
        },
        isArchived: { type: 'boolean', example: false },
        progress: { type: 'number', minimum: 0, maximum: 100, example: 30 },
        createdBy: { $ref: '#/components/schemas/User' },
        updatedBy: { $ref: '#/components/schemas/User' },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-16T09:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2023-01-16T09:30:00.000Z' }
      },
      required: ['_id', 'title', 'status', 'priority', 'owner', 'createdBy', 'createdAt', 'updatedAt'],
    },
    Comment: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6123456789abcdef01234569' },
        content: { type: 'string', example: 'Este é um comentário sobre a tarefa.' },
        task: { type: 'string', example: '6123456789abcdef01234568' },
        author: { $ref: '#/components/schemas/User' },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          example: ['url_anexo_1.pdf', 'url_anexo_2.jpg']
        },
        likes: {
          type: 'array',
          items: { $ref: '#/components/schemas/User' }
        },
        isEdited: { type: 'boolean', example: false },
        parentComment: { type: 'string', example: '6123456789abcdef01234570' },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-16T10:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2023-01-16T10:00:00.000Z' }
      },
      required: ['_id', 'content', 'task', 'author', 'createdAt', 'updatedAt'],
    },
    Activity: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6123456789abcdef01234571' },
        type: {
          type: 'string',
          enum: [
            'task_created',
            'task_updated',
            'task_status_changed',
            'task_assigned',
            'task_unassigned',
            'comment_added',
            'task_completed',
            'task_reopened',
            'task_archived',
            'attachment_added',
            'due_date_changed'
          ],
          example: 'task_updated'
        },
        task: { type: 'string', example: '6123456789abcdef01234568' },
        user: { $ref: '#/components/schemas/User' },
        description: { type: 'string', example: 'Status alterado de todo para inProgress' },
        metadata: {
          type: 'object',
          example: {
            "oldStatus": "todo",
            "newStatus": "inProgress"
          }
        },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-16T11:00:00.000Z' }
      },
      required: ['_id', 'type', 'task', 'user', 'description', 'createdAt'],
    },
    AuthTokens: {
      type: 'object',
      properties: {
        accessToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
        refreshToken: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
      },
      required: ['accessToken', 'refreshToken'],
    },
    Pagination: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        pages: { type: 'number', example: 5 }
      },
      required: ['total', 'page', 'limit', 'pages'],
    },
    TaskStatistics: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        byStatus: {
          type: 'object',
          properties: {
            todo: { type: 'number', example: 15 },
            inProgress: { type: 'number', example: 10 },
            inReview: { type: 'number', example: 7 },
            done: { type: 'number', example: 10 }
          },
          required: ['todo', 'inProgress', 'inReview', 'done']
        },
        byPriority: {
          type: 'object',
          properties: {
            low: { type: 'number', example: 5 },
            medium: { type: 'number', example: 20 },
            high: { type: 'number', example: 12 },
            urgent: { type: 'number', example: 5 }
          },
          required: ['low', 'medium', 'high', 'urgent']
        },
        completed: { type: 'number', example: 10 },
        overdue: { type: 'number', example: 3 },
        withoutAssignee: { type: 'number', example: 8 }
      },
      required: ['total', 'byStatus', 'byPriority', 'completed', 'overdue', 'withoutAssignee'],
    },
    // Adicionar schema para Nota
    Note: {
      type: 'object',
      properties: {
        _id: { type: 'string', example: '6123456789abcdef01234578' },
        title: { type: 'string', example: 'Reunião de Projeto' },
        content: { type: 'string', example: 'Discutir os próximos passos do projeto e distribuir tarefas para a equipe.' },
        category: {
          type: 'string',
          enum: ['general', 'personal', 'work', 'important', 'idea'],
          example: 'work'
        },
        color: { type: 'string', example: '#3498db' },
        isPinned: { type: 'boolean', example: true },
        tags: {
          type: 'array',
          items: { type: 'string' },
          example: ['projeto', 'reunião', 'importante']
        },
        owner: { $ref: '#/components/schemas/User' },
        createdBy: { $ref: '#/components/schemas/User' },
        updatedBy: { $ref: '#/components/schemas/User' },
        createdAt: { type: 'string', format: 'date-time', example: '2023-01-16T09:00:00.000Z' },
        updatedAt: { type: 'string', format: 'date-time', example: '2023-01-16T09:30:00.000Z' }
      },
      required: ['_id', 'title', 'content', 'category', 'isPinned', 'owner', 'createdBy', 'createdAt', 'updatedAt'],
    },
    // Adicionar schema para estatísticas de notas
    NoteStatistics: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        byCategory: {
          type: 'object',
          properties: {
            general: { type: 'number', example: 10 },
            personal: { type: 'number', example: 8 },
            work: { type: 'number', example: 15 },
            important: { type: 'number', example: 5 },
            idea: { type: 'number', example: 4 }
          }
        },
        pinned: { type: 'number', example: 7 }
      },
      required: ['total', 'byCategory', 'pinned'],
    }
  },
  responses: {
    UnauthorizedError: {
      description: 'Token de acesso não fornecido ou inválido',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            status: 'error',
            message: 'Não autorizado. Por favor, faça login para ter acesso.'
          }
        }
      }
    },
    ForbiddenError: {
      description: 'Acesso negado para este recurso',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            status: 'error',
            message: 'Você não tem permissão para realizar esta ação'
          }
        }
      }
    },
    NotFoundError: {
      description: 'Recurso não encontrado',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            status: 'error',
            message: 'Recurso não encontrado'
          }
        }
      }
    },
    ValidationError: {
      description: 'Erro de validação dos dados enviados',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            status: 'error',
            message: 'Erro de validação',
            errors: [
              { message: 'Email é obrigatório', path: ['email'] },
              { message: 'Senha deve ter no mínimo 8 caracteres', path: ['password'] }
            ]
          }
        }
      }
    },
    ServerError: {
      description: 'Erro interno do servidor',
      content: {
        'application/json': {
          schema: {
            $ref: '#/components/schemas/Error'
          },
          example: {
            status: 'error',
            message: 'Erro interno do servidor'
          }
        }
      }
    }
  }
};

// Definição manual das rotas para documentação
const paths = {
  '/auth/register': {
    post: {
      tags: ['Auth'],
      summary: 'Registra um novo usuário',
      description: 'Cria uma nova conta de usuário e retorna tokens de autenticação',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password', 'confirmPassword'],
              properties: {
                name: {
                  type: 'string',
                  minLength: 2,
                  maxLength: 100,
                  example: 'Nome do Usuário'
                },
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'usuario@exemplo.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  minLength: 8,
                  description: 'Deve conter letras maiúsculas, minúsculas, números e caracteres especiais',
                  example: 'Senha123!'
                },
                confirmPassword: {
                  type: 'string',
                  format: 'password',
                  example: 'Senha123!'
                },
                avatar: {
                  type: 'string',
                  example: 'url_opcional_da_imagem'
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Usuário registrado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'success'
                  },
                  message: {
                    type: 'string',
                    example: 'Usuário registrado com sucesso'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      tokens: {
                        $ref: '#/components/schemas/AuthTokens'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        409: {
          description: 'Email já está em uso',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                message: 'Email já está em uso'
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  '/auth/login': {
    post: {
      tags: ['Auth'],
      summary: 'Autentica um usuário',
      description: 'Valida as credenciais de um usuário e retorna tokens de autenticação',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'usuario@exemplo.com'
                },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'Senha123!'
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Login realizado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: {
                    type: 'string',
                    example: 'success'
                  },
                  message: {
                    type: 'string',
                    example: 'Login realizado com sucesso'
                  },
                  data: {
                    type: 'object',
                    properties: {
                      user: {
                        $ref: '#/components/schemas/User'
                      },
                      tokens: {
                        $ref: '#/components/schemas/AuthTokens'
                      }
                    }
                  }
                }
              }
            }
          }
        },
        400: {
          $ref: '#/components/responses/ValidationError'
        },
        401: {
          description: 'Credenciais inválidas',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                status: 'error',
                message: 'Credenciais inválidas'
              }
            }
          }
        },
        500: {
          $ref: '#/components/responses/ServerError'
        }
      }
    }
  },
  // Rotas para usuários
  '/users': {
    get: {
      tags: ['Users'],
      summary: 'Lista usuários',
      description: 'Retorna uma lista paginada de usuários com filtros opcionais',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'search', in: 'query', description: 'Busca por nome ou email', schema: { type: 'string' } },
        { name: 'role', in: 'query', description: 'Filtrar por papel', schema: { type: 'string', enum: ['user', 'admin', 'manager'] } },
        { name: 'isActive', in: 'query', description: 'Filtrar por status ativo', schema: { type: 'boolean' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'sortBy', in: 'query', schema: { type: 'string' } },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ],
      responses: {
        200: {
          description: 'Lista de usuários',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      users: { type: 'array', items: { $ref: '#/components/schemas/User' } },
                      meta: { $ref: '#/components/schemas/Pagination' },
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' },
      }
    },
    post: {
      tags: ['Users'],
      summary: 'Cria um novo usuário',
      description: 'Cria um novo usuário. Requer papel admin ou manager.',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email', 'password', 'confirmPassword'],
              properties: {
                name: { type: 'string', example: 'Novo Usuário' },
                email: { type: 'string', format: 'email', example: 'novo@exemplo.com' },
                password: { type: 'string', format: 'password', example: 'Senha123!' },
                confirmPassword: { type: 'string', format: 'password', example: 'Senha123!' },
                role: { type: 'string', enum: ['user', 'admin', 'manager'], default: 'user' },
                avatar: { type: 'string', example: 'https://exemplo.com/avatar.png' },
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Usuário criado com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Usuário criado com sucesso' },
                  data: { $ref: '#/components/schemas/User' },
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        409: { description: 'Email já está em uso', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        500: { $ref: '#/components/responses/ServerError' },
      }
    }
  },
  '/users/profile': {
    get: {
      tags: ['Users'],
      summary: 'Obtém o perfil do usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Perfil do usuário', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Atualiza o perfil do usuário autenticado',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string', example: 'Nome Atualizado' },
                avatar: { type: 'string', example: 'https://exemplo.com/novo-avatar.png' },
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Perfil atualizado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, message: { type: 'string', example: 'Perfil atualizado com sucesso' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' },
      }
    }
  },
  '/users/profile/preferences': {
    put: {
      tags: ['Users'],
      summary: 'Atualiza as preferências do usuário autenticado',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', example: { theme: 'dark', language: 'pt-BR' } } } } },
      responses: {
        200: { description: 'Preferências atualizadas', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    }
  },
  '/users/profile/avatar': {
    put: {
      tags: ['Users'],
      summary: 'Atualiza o avatar do usuário autenticado',
      security: [{ bearerAuth: [] }],
      requestBody: { required: true, content: { 'application/json': { schema: { type: 'object', required: ['avatar'], properties: { avatar: { type: 'string', example: 'https://exemplo.com/avatar.png' } } } } } },
      responses: {
        200: { description: 'Avatar atualizado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    }
  },
  '/users/profile/deactivate': {
    patch: {
      tags: ['Users'],
      summary: 'Desativa a própria conta',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Conta desativada', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, message: { type: 'string', example: 'Sua conta foi desativada com sucesso' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    }
  },
  '/users/profile/statistics': {
    get: {
      tags: ['Users'],
      summary: 'Obtém estatísticas do usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        200: { description: 'Estatísticas do usuário', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { type: 'object' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    }
  },
  '/users/{id}': {
    get: {
      tags: ['Users'],
      summary: 'Obtém um usuário pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Usuário encontrado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    },
    put: {
      tags: ['Users'],
      summary: 'Atualiza um usuário pelo ID',
      description: 'Requer papel admin ou manager.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                role: { type: 'string', enum: ['user', 'admin', 'manager'] },
                avatar: { type: 'string' },
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Usuário atualizado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    },
    delete: {
      tags: ['Users'],
      summary: 'Exclui um usuário pelo ID',
      description: 'Requer papel admin.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Usuário excluído', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, message: { type: 'string', example: 'Usuário excluído com sucesso' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },
  '/users/{id}/deactivate': {
    patch: {
      tags: ['Users'],
      summary: 'Desativa um usuário pelo ID',
      description: 'Requer papel admin ou manager.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Usuário desativado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },
  '/users/{id}/activate': {
    patch: {
      tags: ['Users'],
      summary: 'Reativa um usuário pelo ID',
      description: 'Requer papel admin ou manager.',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Usuário reativado', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/User' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },

  // Rotas para tarefas
  '/tasks': {
    get: {
      tags: ['Tasks'],
      summary: 'Lista tarefas',
      description: 'Retorna uma lista paginada de tarefas com filtros opcionais',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'status', in: 'query', schema: { type: 'string', enum: ['todo', 'inProgress', 'inReview', 'done'] } },
        { name: 'priority', in: 'query', schema: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] } },
        { name: 'owner', in: 'query', description: 'UUID do proprietário', schema: { type: 'string', format: 'uuid' } },
        { name: 'assignee', in: 'query', description: 'UUID do responsável', schema: { type: 'string', format: 'uuid' } },
        { name: 'search', in: 'query', schema: { type: 'string' } },
        { name: 'tags', in: 'query', schema: { type: 'array', items: { type: 'string' } } },
        { name: 'dueStart', in: 'query', schema: { type: 'string', format: 'date-time' } },
        { name: 'dueEnd', in: 'query', schema: { type: 'string', format: 'date-time' } },
        { name: 'isArchived', in: 'query', schema: { type: 'boolean' } },
        { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
        { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        { name: 'sortBy', in: 'query', schema: { type: 'string' } },
        { name: 'sortOrder', in: 'query', schema: { type: 'string', enum: ['asc', 'desc'] } },
      ],
      responses: {
        200: {
          description: 'Lista de tarefas',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      tasks: { type: 'array', items: { $ref: '#/components/schemas/Task' } },
                      meta: { $ref: '#/components/schemas/Pagination' },
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' },
      }
    },
    post: {
      tags: ['Tasks'],
      summary: 'Cria uma nova tarefa',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title'],
              properties: {
                title: { type: 'string', minLength: 3, maxLength: 200, example: 'Implementar autenticação' },
                description: { type: 'string', example: 'Adicionar JWT ao backend' },
                status: { $ref: '#/components/schemas/TaskStatus' },
                priority: { $ref: '#/components/schemas/TaskPriority' },
                dueDate: { type: 'string', format: 'date-time', example: '2024-06-01T00:00:00.000Z' },
                estimatedHours: { type: 'number', example: 8 },
                assignees: { type: 'array', items: { type: 'string', format: 'uuid' } },
                tags: { type: 'array', items: { type: 'string' }, example: ['backend', 'auth'] },
                color: { type: 'string', example: '#3498db' },
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Tarefa criada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Tarefa criada com sucesso' },
                  data: { $ref: '#/components/schemas/Task' },
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' },
      }
    }
  },
  '/tasks/statistics': {
    get: {
      tags: ['Tasks'],
      summary: 'Obtém estatísticas das tarefas',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'owner', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'assignee', in: 'query', schema: { type: 'string', format: 'uuid' } },
        { name: 'isArchived', in: 'query', schema: { type: 'boolean' } },
      ],
      responses: {
        200: { description: 'Estatísticas das tarefas', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/TaskStatistics' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
      }
    }
  },
  '/tasks/{id}': {
    get: {
      tags: ['Tasks'],
      summary: 'Obtém uma tarefa pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Tarefa encontrada', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    },
    put: {
      tags: ['Tasks'],
      summary: 'Atualiza uma tarefa pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                status: { $ref: '#/components/schemas/TaskStatus' },
                priority: { $ref: '#/components/schemas/TaskPriority' },
                dueDate: { type: 'string', format: 'date-time' },
                estimatedHours: { type: 'number' },
                tags: { type: 'array', items: { type: 'string' } },
                color: { type: 'string' },
                progress: { type: 'integer', minimum: 0, maximum: 100 },
              }
            }
          }
        }
      },
      responses: {
        200: { description: 'Tarefa atualizada', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    },
    delete: {
      tags: ['Tasks'],
      summary: 'Exclui uma tarefa pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Tarefa excluída', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, message: { type: 'string', example: 'Tarefa excluída com sucesso' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },
  '/tasks/{id}/archive': {
    patch: {
      tags: ['Tasks'],
      summary: 'Arquiva uma tarefa',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Tarefa arquivada', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },
  '/tasks/{id}/restore': {
    patch: {
      tags: ['Tasks'],
      summary: 'Restaura uma tarefa arquivada',
      security: [{ bearerAuth: [] }],
      parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
      responses: {
        200: { description: 'Tarefa restaurada', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },
  '/tasks/{id}/assignees/{userId}': {
    post: {
      tags: ['Tasks'],
      summary: 'Atribui um usuário à tarefa',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: { description: 'Usuário atribuído', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    },
    delete: {
      tags: ['Tasks'],
      summary: 'Remove um usuário da tarefa',
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        { name: 'userId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      responses: {
        200: { description: 'Usuário removido', content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string', example: 'success' }, data: { $ref: '#/components/schemas/Task' } } } } } },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        404: { $ref: '#/components/responses/NotFoundError' },
      }
    }
  },

  // Rotas para notas
  '/notes': {
    get: {
      tags: ['Notes'],
      summary: 'Lista notas do usuário',
      description: 'Retorna uma lista paginada de notas com filtros opcionais',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'category',
          in: 'query',
          description: 'Filtrar por categoria',
          schema: {
            type: 'string',
            enum: ['general', 'personal', 'work', 'important', 'idea']
          }
        },
        {
          name: 'isPinned',
          in: 'query',
          description: 'Filtrar por status de fixação',
          schema: {
            type: 'boolean'
          }
        },
        {
          name: 'search',
          in: 'query',
          description: 'Termo de busca para título ou conteúdo',
          schema: {
            type: 'string'
          }
        },
        {
          name: 'page',
          in: 'query',
          description: 'Número da página',
          schema: {
            type: 'integer',
            default: 1
          }
        },
        {
          name: 'limit',
          in: 'query',
          description: 'Número de itens por página',
          schema: {
            type: 'integer',
            default: 10
          }
        }
      ],
      responses: {
        200: {
          description: 'Lista de notas',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: {
                    type: 'object',
                    properties: {
                      notes: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Note' }
                      },
                      total: { type: 'number', example: 42 },
                      page: { type: 'number', example: 1 },
                      limit: { type: 'number', example: 10 },
                      pages: { type: 'number', example: 5 }
                    }
                  }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    },
    post: {
      tags: ['Notes'],
      summary: 'Cria uma nova nota',
      description: 'Cria uma nova nota para o usuário autenticado',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'content'],
              properties: {
                title: {
                  type: 'string',
                  example: 'Reunião de Projeto'
                },
                content: {
                  type: 'string',
                  example: 'Discutir os próximos passos do projeto e distribuir tarefas para a equipe.'
                },
                category: {
                  type: 'string',
                  enum: ['general', 'personal', 'work', 'important', 'idea'],
                  default: 'general',
                  example: 'work'
                },
                color: {
                  type: 'string',
                  example: '#3498db'
                },
                isPinned: {
                  type: 'boolean',
                  default: false,
                  example: true
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['projeto', 'reunião', 'importante']
                }
              }
            }
          }
        }
      },
      responses: {
        201: {
          description: 'Nota criada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Nota criada com sucesso' },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    }
  },
  '/notes/{id}': {
    get: {
      tags: ['Notes'],
      summary: 'Obtém uma nota pelo ID',
      description: 'Retorna uma nota específica pelo ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da nota',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Nota encontrada',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    },
    put: {
      tags: ['Notes'],
      summary: 'Atualiza uma nota',
      description: 'Atualiza uma nota existente',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da nota',
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string', example: 'Reunião de Projeto (Atualizado)' },
                content: { type: 'string', example: 'Conteúdo atualizado da nota' },
                category: {
                  type: 'string',
                  enum: ['general', 'personal', 'work', 'important', 'idea'],
                  example: 'important'
                },
                color: { type: 'string', example: '#e74c3c' },
                isPinned: { type: 'boolean', example: true },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['urgente', 'reunião', 'importante']
                }
              }
            }
          }
        }
      },
      responses: {
        200: {
          description: 'Nota atualizada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Nota atualizada com sucesso' },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        400: { $ref: '#/components/responses/ValidationError' },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    },
    delete: {
      tags: ['Notes'],
      summary: 'Exclui uma nota',
      description: 'Exclui uma nota existente',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da nota',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Nota excluída com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Nota excluída com sucesso' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    }
  },
  '/notes/{id}/pin': {
    patch: {
      tags: ['Notes'],
      summary: 'Fixa uma nota',
      description: 'Marca uma nota como fixada',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da nota',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Nota fixada com sucesso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Nota fixada com sucesso' },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    }
  },
  '/notes/{id}/unpin': {
    patch: {
      tags: ['Notes'],
      summary: 'Desfixa uma nota',
      description: 'Remove a marcação de fixada de uma nota',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          description: 'ID da nota',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: {
          description: 'Nota desfixada com sucesso',
          content: {'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  message: { type: 'string', example: 'Nota desfixada com sucesso' },
                  data: { $ref: '#/components/schemas/Note' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        403: { $ref: '#/components/responses/ForbiddenError' },
        404: { $ref: '#/components/responses/NotFoundError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    }
  },
  '/notes/statistics': {
    get: {
      tags: ['Notes'],
      summary: 'Obtém estatísticas das notas',
      description: 'Retorna estatísticas de notas do usuário autenticado',
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: 'Estatísticas das notas',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'string', example: 'success' },
                  data: { $ref: '#/components/schemas/NoteStatistics' }
                }
              }
            }
          }
        },
        401: { $ref: '#/components/responses/UnauthorizedError' },
        500: { $ref: '#/components/responses/ServerError' }
      }
    }
  },
};

// Especificação OpenAPI completa
const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'API Weid',
    version: '1.0.0',
    description: 'Documentação da API Weid para gerenciamento pessoal',
    contact: {
      name: 'Suporte Weid',
      email: 'suporte@weid.com',
    },
  },
  servers: [
    {
      url: `http://localhost:${config.PORT}${config.API_PREFIX}`,
      description: 'Servidor de Desenvolvimento',
    },
  ],
  components,
  paths,
  tags: [
    {
      name: 'Auth',
      description: 'Endpoints para autenticação e gestão de sessão',
    },
    {
      name: 'Users',
      description: 'Endpoints para gerenciamento de usuários',
    },
    {
      name: 'Tasks',
      description: 'Endpoints para gerenciamento de tarefas',
    },
    {
      name: 'Comments',
      description: 'Endpoints para gerenciamento de comentários em tarefas',
    },
    {
      name: 'Activities',
      description: 'Endpoints para registro e consulta de atividades',
    },
    {
      name: 'Notes',
      description: 'Endpoints para gerenciamento de notas pessoais',
    },
  ],
  security: [
    {
      bearerAuth: [],
    },
  ],
};

// Função para configurar o Swagger na aplicação
export const setupSwagger = (app: Express): void => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'API Weid - Documentação',
  }));
};

export default swaggerSpec;