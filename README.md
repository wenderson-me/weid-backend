
# Weid - Backend

> API Express.js para o sistema de gerenciamento pessoal.

## Pré-requisitos

- Node.js (v14 ou superior)
- PostgreSQL (v12 ou superior)
- npm (v7 ou superior)

## Instalação

1. Instale as dependências:
	```bash
	npm install
	```

2. Configure as variáveis de ambiente:
	- Copie `.env.example` para `.env` e ajuste os valores

3. Inicializar o banco:
	```bash
	npm run db:setup
	```

4. Teste a conexão:
	```bash
	npm run db:test
	```

## Desenvolvimento

Para rodar o backend em modo desenvolvimento:

```bash
npm start
```

## Deploy

```bash
npm run dev
```

Acesse a API: `http://localhost:3000`.

## Build para Produção

```bash
npm run build
```

## Documentação da API

Acesse `/api-docs` com o backend em execução para consultar a documentação Swagger.

## Testes

Para rodar os testes automatizados:

```bash
npm test
```

## Licença
Apache 2.0
