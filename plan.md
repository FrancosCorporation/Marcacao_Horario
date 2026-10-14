# Plan — Marcacao_Horario

## 1. Visão geral

- **Nome:** Marcacao_Horario (API de entrada de marcação de horários)
- **Descrição:** API REST mínima em Node/Express 4 + Mongoose 7 para cadastro de usuários (bcrypt, validação, rate limit), servindo como ponto de entrada do sistema de marcação de horário.
- **Problema que resolve:** fornecer um backend didático, porém endurecido, de autenticação/cadastro persistido em MongoDB.
- **Público-alvo:** portfólio/avaliação técnica; base de estudo do par gêmeo `Marcacao_Horario_Back-End`.
- **Estado atual:** 4 arquivos em `src/` (58 LOC), todos os itens P0–P3 do `MELHORIAS.md` concluídos em 2026-10-11. Sem testes automatizados (`npm test` ecoa e sai 0).

## 2. Arquitetura e tecnologias

- Node ≥ 22, Express 4, Mongoose 7, bcryptjs 3, express-rate-limit 8.
- Bootstrap em `src/start.js` (com tratamento de porta em uso); conexão Mongo carregada no boot (`src/database/index.js`); modelo `User` com validações e hash.
- Sem frontend, sem Docker, sem CI (até esta sessão). MongoDB externo via string de conexão configurável.
- **Limitação conhecida:** rate limit em memória por processo; sem suíte de testes real.

## 3. Funcionalidades existentes

- [x] Cadastro de usuário com validação e normalização de campos — validado estaticamente.
- [x] Hash bcrypt e rate limiting — implementado.
- [x] Payload limitado e erros em JSON — implementado.
- [x] Bootstrap conecta o MongoDB (BUG-04 em 2026-10-11) — implementado.
- [ ] Suíte de testes comportamentais — não implementada (decisão: fora do ciclo; ver riscos).
- [ ] CI — **implementada nesta sessão** (estática).

## 4. Objetivos futuros

- **OBJ-01 (P2, concluído nesta sessão):** DEVOPS-01 — CI estática Node 22/24.
- **OBJ-02 (P3, recomendação):** suíte de testes reais (substituir o `npm test` placeholder) com mongodb-memory-server, quando testes forem liberados.
- **OBJ-03 (P3, recomendação):** convergir com o gêmeo canônico `Marcacao_Horario_Back-End` (§9 do MELHORIAS): remover a rota `GET /post` desta cópia ou documentar o papel de cada repositório no README, evitando manutenção dupla.
- **OBJ-04 (P3, recomendação):** Dockerfile/Compose com Mongo para reprodução local sem instalação.

## 5. Melhorias técnicas

- **Infraestrutura:** ✅ workflow estático adicionado (sintaxe, `npm ci`, `audit --audit-level=high`, diff-check) em Node 22/24.
- **Qualidade:** criar testes de integração da rota de cadastro (OBJ-02) antes de evoluir funcionalidades.
- **Documentação:** manter README e `MELHORIAS.md` como referência; `plan.md` (este) passa a ser o índice vivo de objetivos.

## 6. Roadmap

- **Fase 1 — Correções críticas:** concluída em 2026-10-11 (SEC-01/02, BUG-01..04).
- **Fase 2 — Estabilização:** ✅ CI estática (esta sessão); ☐ TEST-01 suíte real (OBJ-02).
- **Fase 3 — Melhorias funcionais:** convergência com o gêmeo (OBJ-03).
- **Fase 4 — Novas funcionalidades:** nenhuma aprovada.
- **Fase 5 — Longo prazo:** observabilidade (logs estruturados/healthcheck) se virar serviço.

## 7. Backlog priorizado

1. OBJ-02 — suíte de testes real (P3, média).
2. OBJ-03 — convergência/desambiguação dos gêmeos (P3, baixa, decisão de produto).
3. OBJ-04 — container de desenvolvimento (P3, baixa).

## 8. Riscos e pendências

- `npm test` é placeholder (`echo`): CI não deve rodar "testes" achando que cobre algo — registrado explicitamente.
- Manutenção dupla com `Marcacao_Horario_Back-End` (par gêmeo, §9 do MELHORIAS).
- Nenhum `.env`/segredo versionado; conexão Mongo em runtime via configuração.

## 9. Ideias adicionais

- Expor `GET /health` padronizado para facilitar smoke checks futuros.

---
*(Gerado em 2026-10-14 pelo agente orquestrador)*
