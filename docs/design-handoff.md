# Handoff: TaskFlow — Sistema de gestão de tarefas colaborativo

## Overview
TaskFlow é um sistema de gestão de tarefas colaborativo (estilo Trello/Jira simplificado): organizações agrupam quadros (boards), quadros contêm colunas ordenáveis, e colunas contêm tarefas movíveis por drag & drop. O protótipo cobre o fluxo ponta a ponta — autenticação, listagem de quadros, quadro Kanban com filtros, detalhe de tarefa (edição + comentários + histórico) e gestão de membros — e mapeia diretamente para a análise de requisitos em `requirements.json` (cada card exibe sua tag `RF-xxx`).

## About the Design Files
Os arquivos deste pacote são **referências de design criadas em HTML** — um protótipo que demonstra a aparência e o comportamento pretendidos, **não código de produção para copiar diretamente**. A tarefa é **recriar estes designs no ambiente do codebase alvo** (React, Vue, Angular, etc.), usando os padrões, componentes e bibliotecas já estabelecidos ali. Se ainda não existe um ambiente, escolha o framework mais apropriado (o protótipo assume um SPA React + API REST, condizente com os endpoints em `requirements.json`) e implemente os designs nele.

O protótipo (`TaskFlow.dc.html`) é um Design Component: um único arquivo HTML com uma classe de lógica em JavaScript (padrão React-like: `state`, `setState`, `renderVals()`). Toda a lógica de estado, filtros e handlers está lá e serve de referência de comportamento — mas o estado é in-memory com dados semente; **a implementação real deve consumir a API descrita em `requirements.json`**.

## Fidelity
**Alta fidelidade (hifi).** Cores, tipografia, espaçamentos, raios, sombras e interações são finais. O desenvolvedor deve recriar a UI fielmente usando as bibliotecas/padrões do codebase. Observação: não havia design system vinculado com tokens próprios, então o sistema visual abaixo foi definido do zero para este protótipo — se o codebase alvo já tiver um design system, **priorize os tokens existentes do codebase** e use os valores abaixo apenas onde não houver equivalente.

## Sistema visual (tokens)

### Cores
| Papel | Hex |
|---|---|
| Canvas / fundo app | `#ECEAE3` |
| Superfície (cards, topbar, modais) | `#FFFFFF` |
| Superfície suave (sidebar modal, inputs) | `#FAF9F6` / `#F2F0EA` |
| Texto ink (primário) | `#17181C` |
| Texto secundário | `#6B7076` |
| Texto muted / mono | `#8A8E95` / `#A2A6AD` |
| Bordas | `rgba(23,24,28,.08–.14)` |
| Accent primário (padrão) | `#2E56E6` (cobalto) |
| Accents alternativos (tweakável) | `#6B4EE6` · `#0E8F6E` · `#E0603C` |

Cores das colunas (ponto/indicador): Backlog `#8A8E95`, A Fazer `#2E56E6`, Em Progresso `#E8930C`, Revisão `#6B4EE6`, Concluído `#2F9E68`.

Cores de prioridade (dot / fundo do pill / texto):
- **Alta:** dot `#E5484D` · bg `#FCE9EA` · fg `#B4242A`
- **Média:** dot `#E8930C` · bg `#FDF0DA` · fg `#95590A`
- **Baixa:** dot `#2F9E68` · bg `#E4F5EC` · fg `#1C7A48`

Cores de prazo (chip): atrasada `#B4242A`/`#FCE9EA`, amanhã (warn) `#95590A`/`#FDF0DA`, ok `#6B7076`/`#F2F0EA`, concluído `#1C7A48`/`#E4F5EC`.

### Tipografia
- **Display / títulos:** `Bricolage Grotesque`, pesos 600–700, `letter-spacing: -.01em a -.02em`.
- **Corpo / UI:** `IBM Plex Sans`, pesos 400–700.
- **Mono (tags RF, e-mails, timestamps, contadores, labels de campo):** `IBM Plex Mono`, 400–600.
- Escala usada: H1 dashboard 32px/700; H1 board 26px/700; título de tarefa (modal) 22px/700; título de card 14px (clean) / 13px (dense) / 16.5px (editorial); labels de campo 11.5px mono uppercase `letter-spacing:.06em`; corpo de card/comentário 13–14px, line-height ~1.45–1.5.

### Espaçamento, raios, sombras
- Raios: cards 9–16px (varia por estilo de board), inputs/selects 9–10px, pills 20px, avatares 50%, modal 16px, chips de prazo 6px.
- Sombras: card clean `0 1px 2px rgba(23,24,28,.05)`; card editorial `0 4px 16px rgba(23,24,28,.07)`; modal `0 24px 70px rgba(0,0,0,.28)`; toast `0 12px 34px rgba(0,0,0,.32)`.
- Topbar: altura 60px, `border-bottom: 1px solid rgba(23,24,28,.09)`, sticky.
- Padding de conteúdo: dashboard/membros `34px 40px` (max-width 1180/900px, centralizado); colunas do board `20px 32px 28px`.

## Screens / Views

### 1. Autenticação (Login / Cadastro)
- **Propósito:** entrar (RF-002) ou criar conta (RF-001). No protótipo aceita qualquer credencial.
- **Layout:** split de tela cheia. Painel esquerdo (`flex:1.05`) com fundo = accent, texto branco: logo "TaskFlow", kicker mono, headline (Bricolage 46px) e 3 bullets de features; rodapé com versão. Painel direito (`flex:1`) com toggle de idioma PT/EN no topo-direito e o formulário centralizado (max-width 376px).
- **Componentes:** abas Login/Cadastro (tab com `border-bottom 2px` no accent quando ativa, Bricolage 15px/700). Campos: Nome (só no cadastro), E-mail, Senha. Inputs full-width, padding `11px 13px`, borda `rgba(23,24,28,.14)`, raio 10px. Botão primário full-width (fundo accent, 12px padding). Hint mono abaixo.
- **Interação:** clicar no botão → `view='app'`, `appView='dashboard'`.

### 2. Dashboard (lista de quadros)
- **Propósito:** ver quadros da organização e criar novos (RF-006).
- **Layout:** título H1 + botão "Novo quadro" à direita; subtítulo; linha de 4 stat cards (Quadros, Tarefas, Membros, Atrasadas); grid de board cards `repeat(auto-fill, minmax(300px,1fr))`, gap 16px, incluindo um card tracejado "Novo quadro".
- **Board card:** superfície branca, borda leve, raio 14px, padding 20px. Barra de accent (52×6px, raio 6px) no topo; nome (Bricolage 19px/600); descrição (13px, muted, min-height 38px); rodapé mono com contagem de colunas e tarefas. Hover: elevar (transform/shadow).
- **Interação:** clicar no card → abre o board. "Novo quadro" cria board com 3 colunas padrão (A Fazer / Em Progresso / Concluído) e navega para ele, com toast.

### 3. Quadro Kanban
- **Propósito:** o coração do sistema — visualizar e mover tarefas (RF-007 a RF-011, RF-015).
- **Layout:** cabeçalho branco fixo com breadcrumb "← Quadros", nome do board (Bricolage 26px), descrição, pilha de avatares dos membros (sobrepostos -8px, borda branca 2px) e botão "Gerenciar membros". Abaixo, barra de filtros. Área de colunas em `display:flex; overflow-x:auto`.
- **Barra de filtros:** campo de busca com ícone de lupa (SVG), select de Responsável, select de Prioridade, e botão "✕ Limpar" (aparece só quando há filtro ativo). Filtragem é **em tempo real, client-side** no protótipo; na API usar query params `assigneeId`, `status`, `dueBefore` + busca por título (RF-015).
- **Coluna:** header com ponto colorido (quadrado 8px raio 2px), nome e contador mono à direita. Corpo é a drop-zone (drag-over: outline tracejado no accent + fundo `accent+0d`).
- **Card de tarefa (`draggable`):** topo com pill de prioridade (dot + label) à esquerda e tag `RF-xxx` mono à direita (ocultável). Título. Rodapé: avatar do responsável (24px; se sem responsável, círculo tracejado com "?"), chip de prazo, e contador de comentários com ícone SVG de balão. `cursor:grab`; ao arrastar, opacity 0.4.
- **Composer inline:** botão "+ Adicionar tarefa" no fim da coluna → textarea + botões Adicionar/Cancelar. Cria tarefa na coluna (prioridade média por padrão) com toast.
- **Três variações de estilo (tweakável — `boardStyle`):**
  - `clean` (padrão): coluna 290px, gap 16, card branco borda leve, título IBM Plex 14px, sem fundo de header.
  - `dense`: coluna 250px, gap 12, cards compactos (padding 9, raio 9), **borda esquerda 3px na cor da prioridade**, header com fundo tintado na cor da coluna, nome uppercase.
  - `editorial`: coluna 326px, gap 24, cards arejados (padding 17, raio 16, sombra maior), título Bricolage 16.5px, nome da coluna em Bricolage 700.

### 4. Detalhe da tarefa (modal)
- **Propósito:** editar tarefa (RF-010), comentar (RF-013), ver histórico (RF-014), excluir (RF-012).
- **Layout:** overlay `rgba(23,24,28,.42)`, card central max-width 820px, raio 16px, animação `popin`. Header: tag RF + pill de prioridade + botão fechar "✕". Corpo em duas colunas: **principal** (título editável inline em Bricolage 22px; textarea de descrição; abas Comentários/Histórico) e **sidebar** (262px, fundo `#FAF9F6`) com selects de Responsável, Coluna, Prioridade, campo de data de Prazo, botão "Salvar alterações" (accent) e "Excluir tarefa" (contorno vermelho).
- **Comentários:** campo de novo comentário (avatar do usuário + textarea + botão "Comentar") e lista (avatar, autor, tempo relativo mono, texto). Estado vazio: "Nenhum comentário ainda."
- **Histórico:** timeline reversa (mais recente primeiro): avatar do ator + "<ator> <ação> · <tempo relativo>". Ações: criou / moveu de X para Y / atribuiu a N / definiu prioridade P / editou os detalhes / comentou.
- **Salvar:** aplica mudanças à tarefa e registra eventos de atividade (RF-014); mudar coluna aqui = mover (RN-003); toast "Tarefa atualizada".

### 5. Confirmação de exclusão
- Diálogo pequeno (max-width 380px) sobre overlay: título, corpo "Esta ação não pode ser desfeita.", botões Cancelar (ghost) e Excluir (vermelho `#C0343A`). Exigência de confirmação prévia no frontend (RF-012).

### 6. Membros
- **Propósito:** listar membros da organização e convidar (RF-005).
- **Layout:** breadcrumb + H1; lista em card (avatar, nome, e-mail mono, badge de role — ADMIN destacado no accent, MEMBER em cinza). Bloco "Convidar membro" (input de e-mail + select de role + botão), **visível apenas para ADMIN** (RN-002); não-admin vê nota "Apenas administradores podem convidar membros." Convite dispara toast; role padrão MEMBER.

## Interactions & Behavior
- **Navegação:** SPA por estado — `view` (auth|app) e `appView` (dashboard|board|members). Topbar com nav Quadros/Membros; clicar no logo/breadcrumb volta ao dashboard.
- **Drag & drop:** HTML5 nativo. `onDragStart` marca `draggedTaskId`; coluna faz `onDragOver` (preventDefault + highlight), `onDrop` move a tarefa e registra atividade "moveu"; `onDragEnd` limpa. Restrição RN-003/RF-011: só entre colunas do mesmo quadro.
- **Filtros:** combinam responsável + prioridade + busca por título, aplicados client-side em tempo real.
- **Idioma:** toggle PT/EN global (segmented control) recompõe todos os textos; dados bilíngues guardam `{pt, en}`.
- **Animações:** overlay `ovin` (fade .14–.16s), modais `popin` (.18–.2s, translateY+scale), toast `toastin` (.22s) auto-dismiss em ~2.2s.
- **Estados de hover:** cards e botões elevam/escurecem levemente; recriar conforme o codebase.
- **Responsivo:** RNF-007 exige funcionar a partir de 360px. No protótipo a área de colunas rola horizontalmente; auth e modal empilham via flex-wrap. Ajustar breakpoints ao implementar.

## State Management
Variáveis de estado do protótipo (referência de comportamento):
- `view`, `appView`, `authTab`, `lang` — navegação e idioma.
- `currentUserId`, `orgName`, `selectedBoardId` — contexto.
- `selectedTaskId`, `edit` (rascunho do modal), `modalTab` — detalhe de tarefa.
- `composerColumnId`, `composerText`, `commentText` — criação inline / comentário.
- `filters {assignee, priority, search}` — filtros do board.
- `draggedTaskId`, `dragOverColumnId` — drag & drop.
- `confirmDeleteId`, `inviteEmail`, `inviteRole`, `toast` — ações auxiliares.
- Coleções: `users`, `memberships`, `boards`, `columns`, `tasks`, `comments`, `activity`.

**Data fetching real (substituir o estado in-memory):** ver `api_endpoints` em `requirements.json` — auth (`/auth/register|login|refresh` com JWT + refresh token, RNF-002), organizações, boards (`?organizationId`), colunas (`POST /boards/:id/columns`, `PATCH /columns/:id/reorder`), tarefas (`POST /columns/:id/tasks`, `PATCH /tasks/:id`, `PATCH /tasks/:id/move`, `DELETE /tasks/:id`), comentários, atividade e busca (`GET /tasks?assigneeId&status&dueBefore`).

## Regras de negócio a respeitar (do requirements.json)
- RN-001: usuário só acessa quadros de organizações das quais é membro.
- RN-002: só ADMIN convida/remove membros.
- RN-003: tarefa pertence a exatamente uma coluna e um quadro.
- RN-004: ao excluir coluna, mover tarefas para a primeira coluna ou bloquear a exclusão.
- RN-005: responsável deve ser membro da organização do quadro.
- RN-006: comentário não pode ser editado após 15 min; só exclusão.
- Senhas com hash (RNF-001); rotas autenticadas via JWT exceto login/cadastro (RNF-002).

## Design Tokens
Todos os valores estão consolidados na seção "Sistema visual (tokens)" acima (cores, tipografia, espaçamento, raios, sombras).

## Assets
- **Fontes:** Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono — via Google Fonts.
- **Ícones:** inline SVG desenhados no protótipo (lupa de busca, balão de comentário, seta de breadcrumb, "✕" de fechar). Substituir pela biblioteca de ícones do codebase (ex.: Lucide/Heroicons).
- **Logo:** marca "T" em quadrado — placeholder; trocar pela marca real quando houver.
- Nenhuma imagem raster ou asset de marca externo é usado.

## Files
- `TaskFlow.dc.html` — protótipo interativo completo (template + lógica). Referência principal de UI e comportamento.
- `requirements.json` — análise de requisitos (RF/RNF/RN, user stories, modelo de dados, endpoints, glossário). Fonte de verdade para regras e API.
