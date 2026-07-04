---
name: taskflow
description: Contexto e convenções do projeto TaskFlow (sistema de gestão de tarefas colaborativo estilo Trello, fullstack NestJS + Prisma/PostgreSQL + React). Use esta skill SEMPRE que o usuário mencionar TaskFlow, pedir para implementar qualquer requisito (RF-xxx, RNF-xxx, RN-xxx, US-xx), criar/editar código de boards, colunas, tarefas, organizações, comentários ou autenticação deste projeto, escrever o schema Prisma, criar endpoints da API, componentes React do quadro kanban, ou testes — mesmo que ele não diga explicitamente "TaskFlow". Se a conversa é sobre implementar este sistema de tarefas, consulte esta skill antes de escrever qualquer código.
---

# TaskFlow — Skill do Projeto

TaskFlow é um sistema de gestão de tarefas colaborativo (estilo Trello/Jira simplificado): usuários criam **organizações**, que contêm **quadros (boards)**, que contêm **colunas** ordenadas, que contêm **tarefas** ordenadas, com comentários e histórico de atividades.

## Fonte da verdade

O arquivo `references/requirements.json` contém a especificação completa e estruturada: os 15 requisitos funcionais (RF-001 a RF-015) com critérios de aceitação, 10 requisitos não funcionais, 6 regras de negócio, 8 user stories, o modelo de dados completo (8 entidades com campos e constraints) e os 17 endpoints REST.

**Antes de implementar qualquer feature, leia a seção relevante do requirements.json.** Se o usuário pedir "implemente o RF-011", os critérios de aceitação estão lá. Se ele pedir algo que contradiz a especificação, aponte a divergência antes de prosseguir — o documento é a fonte da verdade, mas o usuário pode decidir alterá-lo conscientemente.

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | NestJS (TypeScript) |
| ORM / Banco | Prisma + PostgreSQL |
| Autenticação | JWT (access token + refresh token), stateless |
| Frontend | React (TypeScript), responsivo a partir de 360px |
| Infra | Docker / docker-compose |
| Docs de API | Swagger/OpenAPI (via @nestjs/swagger), habilitado em dev |

Convenções detalhadas: leia `references/backend.md` ao trabalhar no backend e `references/frontend.md` ao trabalhar no frontend. Leia apenas o que a tarefa atual exige.

## Regras de negócio invioláveis

Estas regras valem para TODO código gerado, em qualquer camada. Elas existem porque protegem a integridade e a segurança multi-tenant do sistema:

1. **RN-001 — Isolamento por organização.** Todo acesso a board/coluna/tarefa deve verificar que o usuário autenticado é membro da organização dona do recurso. Nunca confie apenas no ID vindo da requisição; sempre valide o membership no service. Este é o controle de segurança mais importante do sistema.
2. **RN-002 — Só ADMIN gerencia membros.** Convidar ou remover membros exige role ADMIN na organização (não basta ser membro).
3. **RN-003 — Tarefa sempre tem exatamente uma coluna/quadro.** `columnId` nunca é nulo; mover tarefa é atualização atômica, nunca deixar tarefa "órfã".
4. **RN-004 — Exclusão de coluna.** Ao excluir coluna, mover as tarefas para a primeira coluna do quadro, ou bloquear a exclusão se não houver destino. Fazer em transação.
5. **RN-005 — Responsável é membro.** Ao atribuir `assigneeId`, validar que o usuário é membro da organização do quadro. Retornar 422/400 com mensagem clara se não for.
6. **RN-006 — Janela de edição de comentário.** Comentários só podem ser editados até 15 minutos após `createdAt`; depois disso, apenas exclusão. Validar no backend (não só no frontend).

Além disso, ao mover tarefa (RF-011): a coluna de destino deve pertencer ao **mesmo quadro** da coluna de origem.

## Requisitos não funcionais que moldam o código

- **Senhas**: sempre bcrypt ou argon2; nunca em texto plano nem logadas (RNF-001).
- **Auth em tudo**: toda rota exceto `/auth/register` e `/auth/login` exige JWT (RNF-002). No NestJS, use guard global e decorator `@Public()` para as exceções.
- **Stateless**: nada de sessão em memória; qualquer estado vai para o banco ou para o token (RNF-004).
- **Testes**: cobertura ≥ 80% nas camadas de domínio/aplicação (RNF-006). Ao implementar um service, escreva os testes junto, não depois.
- **Observabilidade**: logs estruturados (JSON) e endpoint `GET /health` (RNF-009).
- **Swagger**: anote DTOs e controllers para o OpenAPI (RNF-010).

## Contrato de API

Os endpoints seguem exatamente as rotas do requirements.json (ex.: `POST /columns/:id/tasks`, `PATCH /tasks/:id/move`). Não invente rotas alternativas — o frontend e o documento dependem desse contrato, e um endpoint criado silenciosamente quebra a rastreabilidade entre código e requisitos.

**Quando a tarefa exigir um endpoint que não está na especificação** (isso acontece — a especificação tem lacunas conhecidas), não o use silenciosamente como se existisse. Em vez disso:

1. Diga explicitamente ao usuário, no início da resposta, que a especificação não cobre aquele endpoint;
2. Proponha a rota seguindo o estilo do documento (ex.: `GET /tasks/:id/comments`) e implemente-a se o usuário precisar dela para a tarefa;
3. Marque no código com um comentário `// PROPOSTO — não consta na especificação de API v1.0`, para que a divergência fique visível na revisão.

**Lacunas conhecidas da especificação v1.0**: não há endpoints para listar comentários de uma tarefa, editar comentário nem excluir comentário — embora RF-013 e RN-006 impliquem que essas operações existem. Sugestões consistentes com o estilo do documento: `GET /tasks/:id/comments`, `PATCH /comments/:id` (respeitando a janela de 15 min da RN-006) e `DELETE /comments/:id`.

## Ao concluir uma implementação

Feche o ciclo verificando: (a) critérios de aceitação do RF atendidos; (b) regras de negócio aplicáveis validadas no backend; (c) testes escritos; (d) rota igual à especificação. Mencione ao usuário quais RFs/RNs a entrega cobre — isso mantém a rastreabilidade que o documento de requisitos estabelece.