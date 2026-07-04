# TaskFlow

Sistema de gestão de tarefas colaborativo (estilo Trello/Jira simplificado), com organizações, quadros, colunas e tarefas. Veja `docs/requirements.json` para a especificação completa e `docs/TaskFlow_Documento_do_Projeto.pdf` para a arquitetura.

## Stack

- **Backend**: NestJS + TypeScript, Prisma + PostgreSQL, JWT (access + refresh token), Swagger/OpenAPI.
- **Frontend**: React 18 + TypeScript + Vite, Zustand.
- **Infra**: Docker / docker-compose, GitHub Actions (CI).

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Setup local

```bash
cp .env.example .env
cp backend/.env.example backend/.env

# sobe o banco
docker compose up -d postgres

# aplica o schema (migration já versionada em backend/prisma/migrations)
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# sobe backend + frontend
docker compose up -d --build
```

- API: http://localhost:3000 (health-check em `/health`, docs em `/docs`)
- Frontend: http://localhost:5173

## Desenvolvimento sem Docker (backend)

```bash
cd backend
npm run start:dev
```

## Testes

```bash
cd backend && npm test
cd frontend && npm test
```

## Status

Fase 1 (Fundação) concluída: monorepo, Docker, CI básico e modelagem do banco. Próxima fase: autenticação (cadastro, login, JWT + refresh token).
