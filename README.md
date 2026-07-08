# TaskFlow

Sistema de gestão de tarefas colaborativo (estilo Trello/Jira simplificado): usuários criam **organizações**, que agrupam **quadros (boards)**, que contêm **colunas** ordenáveis, que contêm **tarefas** ordenáveis — com comentários, histórico de atividades e movimentação por drag-and-drop. Veja `docs/TaskFlow_Documento_de_Requisitos.pdf` para a especificação completa (requisitos, regras de negócio, modelo de dados e endpoints) e `docs/TaskFlow_Documento_do_Projeto.pdf` para a arquitetura e o roadmap.

## Funcionalidades

- **Autenticação** — cadastro, login, JWT (access + refresh token).
- **Organizações e membros** — criação de organização (criador vira ADMIN), convite de membros por e-mail (ADMIN-only), listagem de membros.
- **Quadros e colunas** — CRUD de quadros, colunas customizáveis e reordenáveis por drag-and-drop.
- **Tarefas** — CRUD completo, atribuição de responsável (restrita a membros da organização), prazo, prioridade, movimentação entre colunas por drag-and-drop, filtros e busca.
- **Comentários** — comentar em tarefas, editar (até 15 minutos após a criação) ou excluir (sem limite de tempo), sempre restrito ao autor.
- **Histórico de atividades** — timeline de criação, edição de campos, atribuição e mudança de coluna de cada tarefa.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS + TypeScript, Clean Architecture (domain/application/infrastructure/presentation) |
| Banco / ORM | PostgreSQL + Prisma |
| Autenticação | JWT (access + refresh token), stateless |
| Frontend | React 18 + TypeScript + Vite, Zustand, React Router, dnd-kit |
| Documentação da API | Swagger/OpenAPI (`@nestjs/swagger`) |
| Testes | Jest (unitário + integração/Supertest), Vitest + React Testing Library, Playwright (e2e) |
| Infra | Docker / docker-compose, GitHub Actions (CI/CD) |

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Setup local

```bash
cp .env.example .env
cp backend/.env.example backend/.env

# sobe o banco
docker compose up -d postgres

# aplica o schema (migrations já versionadas em backend/prisma/migrations)
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
cd ..

# sobe backend + frontend
docker compose up -d --build
```

- Frontend: http://localhost:5173
- API: http://localhost:3000 (health-check em `/health`)
- **Documentação interativa da API (Swagger)**: http://localhost:3000/docs

## Desenvolvimento sem Docker

```bash
# backend
cd backend
npm run start:dev

# frontend
cd frontend
npm run dev
```

## Testes

### Backend

```bash
cd backend
npm test              # unitários (Jest) — domain + application em 100% de cobertura
npm run test:cov       # unitários com relatório de cobertura + quality gate (falha se cair abaixo do threshold)
npm run test:e2e       # integração (Supertest contra Postgres real, schema "test" isolado, resetado a cada run)
```

Os testes de integração reaproveitam o mesmo Postgres do `docker compose up -d postgres` (ou o service container do CI), isolados via `?schema=test` na `DATABASE_URL` — não é preciso um segundo banco.

### Frontend

```bash
cd frontend
npm test                 # unitários/componentes (Vitest + React Testing Library)
npm run test:coverage    # com relatório de cobertura + quality gate (stores, httpClient, lógica de dnd)
npm run test:e2e         # Playwright — exige a stack rodando via `docker compose up -d --build`
```

## CI/CD

Pipeline (`.github/workflows/ci.yml`), a cada push/PR:

1. **lint** — ESLint no backend e frontend.
2. **test** — testes unitários com quality gate de cobertura (backend e frontend).
3. **test-e2e** — testes de integração contra Postgres real (service container).
4. **build** — build de produção do backend (Nest) e frontend (Vite).
5. **e2e-playwright** — sobe a stack completa via Docker Compose e roda os cenários e2e do frontend.
6. **docker** — build das imagens Docker de backend e frontend.
7. **publish** — (apenas em push na `main`, após todos os estágios acima passarem) publica as imagens no GitHub Container Registry, tagueadas `latest` e com o SHA do commit.

## Deploy

Não há ambiente de staging hospedado no momento — o pipeline deixa a imagem pronta (estágio `publish`), e `docker-compose.staging.yml` é a referência de como subir a stack publicada em qualquer host Docker (VPS, PaaS com suporte a Docker, etc.), sem precisar clonar o repositório:

```bash
cp .env.example .env   # ajuste POSTGRES_*, JWT_*, DATABASE_URL e CORS_ORIGIN
docker compose -f docker-compose.staging.yml up -d
docker compose -f docker-compose.staging.yml exec backend npx prisma migrate deploy
```

O backend recusa subir (`NODE_ENV=production`) se `CORS_ORIGIN` não estiver definida — evita cair silenciosamente para `localhost` num deploy real.

### Pendências antes de um deploy de produção real

A auditoria de homologação (2026-07-07) identificou o que falta para sair de "docker-compose num host qualquer" para produção de verdade. A plataforma de destino ainda não foi decidida, então nada abaixo foi implementado — é o checklist para quando for:

- [ ] **TLS/HTTPS** — colocar um proxy reverso (Caddy/Traefik) ou LB gerenciado na frente; hoje o nginx do frontend só serve HTTP puro na porta 80.
- [ ] **Deploy automático (CD)** — o CI publica a imagem no GHCR mas nada a implanta; hoje subir uma versão nova é manual (`docker compose pull && up -d`).
- [ ] **Backup/restore do Postgres** — hoje é só um volume Docker local; definir e testar uma rotina de backup (gerenciado, ou `pg_dump` agendado + restore validado).
- [ ] Usuário não-root nos Dockerfiles, segredos num gestor real (não só `.env`), CDN para os assets do frontend — ver relatório completo da auditoria para detalhes e prioridade relativa de cada item.

## Documentos do projeto

- `docs/TaskFlow_Documento_de_Requisitos.pdf` — especificação completa (requisitos funcionais/não funcionais, regras de negócio, modelo de dados, endpoints), otimizada para consumo por agentes de IA.
- `docs/TaskFlow_Documento_do_Projeto.pdf` — arquitetura, stack, boas práticas e roadmap.
- `docs/design-handoff.md` — referência de design (tokens visuais, telas, comportamento) usada na implementação do frontend.

## Status

Todas as 8 fases do roadmap concluídas:

1. **Fundação** — monorepo, Docker, CI básico, modelagem do banco (Prisma).
2. **Autenticação** — cadastro, login, JWT + refresh token, guards.
3. **Quadros e Colunas** — CRUD de organizações, quadros e colunas.
4. **Tarefas** — CRUD, atribuição, prazos, movimentação entre colunas.
5. **Comentários e Histórico** — comentários com janela de edição de 15 min, histórico de atividades.
6. **Frontend Completo** — SPA React integrada à API, drag-and-drop de tarefas e colunas.
7. **Testes e Qualidade** — cobertura com quality gate, testes de integração e e2e, revisão de SOLID.
8. **Documentação e Deploy** — README, Swagger anotado, infraestrutura de deploy (imagens publicadas via CI).
