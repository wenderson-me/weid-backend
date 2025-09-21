
# Weid - Backend

> API Express.js para o sistema de gerenciamento pessoal.

## Pré-requisitos

- Node.js (v14 ou superior)
- MongoDB (v4.4 ou superior)
- npm (v7 ou superior)

## Instalação

1. Instale as dependências:
	```bash
	npm install
	```
2. Configure as variáveis de ambiente:
	- Copie `.env.example` para `.env` e ajuste os valores:
	  - String de conexão MongoDB
	  - Chaves secretas JWT
	  - Porta da API

## Desenvolvimento

Para rodar o backend em modo desenvolvimento:

```bash
npm run dev
```

Acesse a API em `http://localhost:3000`.

## Build para Produção

```bash
npm run build
```

## Funcionalidades

- 📋 Gerenciamento de tarefas com quadros kanban
- 📝 Criação e organização de notas
- 📊 Registro e acompanhamento de atividades
- 👥 Autenticação e autorização de usuários
- 🔔 Notificações em tempo real

## Documentação da API

Acesse `/api-docs` com o backend rodando para consultar a documentação Swagger.

## Testes

Para rodar os testes automatizados:

```bash
npm test
```

## Licença
Apache 2.0
