# MELHORIAS — Marcacao_Horario

> **Gerado por análise de código em 2026-10-05** · Stack: Node/Express 4 + Mongoose 7
> Branch `master` (local e `origin/HEAD`) · 4 arquivos em `src/` · 58 LOC · **0 testes**
> (`npm test` = `echo "sem testes automatizados"` → **exit 0**) · sem CI
>
> **Este arquivo é um plano de execução.** Cada item tem ID, `arquivo:linha`, mudança exata,
> critério de aceite e comando de verificação.
>
> **Nota (gêmeos):** `Marcacao_Horario_Back-End` é **quase idêntico** — `diff -r` dos dois `src/`
> mostra `models/User.js` e `database/index.js` **idênticos**; `authController.js` difere **só** pela
> rota `GET /post` (existe aqui, não existe lá); `start.js` difere (aqui: typo `Listeing`, sem
> `EADDRINUSE`; lá: `Listening` correto + handler de porta + `indexController`). Cada gêmeo já tem
> metade das correções do outro — decidir o canônico na §9 **antes** de corrigir.

---

## 0. Como usar este documento

1. Execute na ordem **P0 → P1 → P2**, respeitando as ondas da §8.
2. Ao terminar um item: marque `- [x]`, rode o **Verificação**, comite `fix(<ID>): descrição`.
3. **Decida o repositório canônico do par ANTES do primeiro fix** (§9): `src/models/User.js` e
   `src/database/index.js` são cópias **idênticas** nos dois repos — consertar só um recria a
   divergência no próximo commit do outro lado.
4. Itens citam `arquivo:linha` lidos na data do header; se o arquivo mudou, recalcule a linha.
5. **Idioma:** português.

---

## 1. Diagnóstico executivo

Camada de entrada do sistema de marcação de horário: Express 4 monta o router em `/auth`
(`src/controller/authController.js:15`) com `POST /auth/register` e `GET /auth/post`; grava usuários
no MongoDB via Mongoose 7. **Não existe login nem autenticação** — o registro é o único endpoint com
efeito de escrita. O `Readme.md` descreve o par de repositórios (`Marcacao_Horario` +
`Marcacao_Horario_Back-End`).

**O que está bem (não reaja):**

| Item | Evidência |
|---|---|
| `password` com **`select: false`** | `src/models/User.js:17` — não vaza em `find()` |
| E-mail **`unique` + `lowercase`** | `src/models/User.js:10-12` |
| URI do Mongo via **`MONGO_URI`** com fallback local | `src/database/index.js:3` |
| **Listener de erro** da conexão com mensagem acionável | `src/database/index.js:7-9` (`defina MONGO_URI...`) |
| `register` com `try/catch` que **não vaza stack** | `src/controller/authController.js:8-13` (400 genérico) |
| `body-parser` resolve sem estar declarado | `package-lock.json:52,193` — `express@4.18.2` depende de `body-parser@1.20.1` |
| Readme documenta o par e as rotas | `Readme.md:15-22` |

**O que está quebrado:**

1. **Senha gravada em claro** — `User.create(req.body)` sem hash (`SEC-01`).
2. **Validação do schema desligada** — `require: true` (typo) em 3 campos (`BUG-01`).
3. `GET /auth/post` devolve **200 + `"Registration failed"`** (`BUG-03`).
4. `npm test` **sai com 0 sem testar nada** (`TEST-01`).
5. `repository.url` aponta para **`Marcacao_Consultas`**, não para este repo (`DOC-01`).

## 2. Tabela de prioridades

| ID | Título | Sev | Arquivo | Depende de |
|---|---|---|---|---|
| SEC-01 | Senha em claro: register grava sem hash | **P0** | `src/controller/authController.js:9` | — |
| BUG-01 | Typo `require` vs `required` — validação desligada | **P0** | `src/models/User.js:6,11,16` | — |
| BUG-02 | `User.create(req.body)` — mass assignment | **P1** | `src/controller/authController.js:9` | BUG-01 |
| BUG-03 | `GET /auth/post` → 200 + `"Registration failed"` | **P1** | `src/controller/authController.js:4-6` | — |
| TEST-01 | Teste fake `echo` (exit 0) | **P1** | `package.json:9` | BUG-01 |
| BUG-04 | Typo "Listeing" + `body-parser` deprecated + sem handler de porta | **P2** | `src/start.js:2,6-7,11` | — |
| SEC-02 | Sem rate limit no register | **P2** | `src/controller/authController.js:7` | — |
| DOC-01 | `repository.url` → `Marcacao_Consultas` ≠ repo atual | **P2** | `package.json:13,19,21` | — |
| DEVOPS-01 | Sem CI (sem `.github/`) | **P2** | *(ausente)* | TEST-01 |
| IMP-01 | Gêmeo quase-idêntico a `Marcacao_Horario_Back-End` | **P2** | `src/` (par) | — |

**Placar: 2 P0 · 3 P1 · 5 P2 = 10 itens.**

---

## 3. Segurança

### SEC-01 · Senha em claro: register grava a senha sem hash · [P0]

- **Arquivo:** `src/controller/authController.js:9`
- **Evidência:**
  ```javascript
  const user = await User.create(req.body)   // linha 9 — a senha vai sem hash
  ```
  `grep -rn 'bcrypt\|hash' src/ package.json` → **nada**; `bcrypt` não está em `dependencies`
  (`package.json:22-25` declara só `express@^4.18.2` e `mongoose@^7.0.5`). A senha vai ao Mongo
  **exatamente** como veio do body.
- **Impacto:** qualquer leitura do banco (dump, backup, `mongosh`, injetão futura, insider) entrega
  credenciais **reutilizáveis** — as pessoas reutilizam senhas, então um vazamento do banco expõe
  também outras contas da vítima. E sem hash não há como implementar login com segurança depois.
- **Mudança:** (1) `npm i bcrypt` (ou `bcryptjs`); (2) hashear antes do `create` e **já** usar
  allowlist (ver `BUG-02`):
  ```javascript
  const bcrypt = require('bcrypt')
  const { name, email, password } = req.body
  const hash = await bcrypt.hash(password, 10)
  const user = await User.create({ name, email, password: hash })
  ```
  (3) nunca logar `req.body`/`user.password`.
- **Aceite:** o documento no Mongo tem `password` começando com `$2a$`/`$2b$`; a senha crua não
  existe em nenhuma coleção.
- **Verificação:**
  ```bash
  curl -s -X POST http://localhost:3000/auth/register -H 'Content-Type: application/json' \
    -d '{"name":"A","email":"a@x.com","password":"MinhaSenha123"}'
  mongosh --quiet marcacao --eval 'db.users.find({email:"a@x.com"},{password:1,_id:0}).toArray()'
  # esperado: password "$2b$..." — e NUNCA "MinhaSenha123" (hoje: a senha crua aparece)
  ```

### SEC-02 · Register sem rate limit (enumeração/spam de criação) · [P2]

- **Arquivo:** `src/controller/authController.js:7-14` (aplicação em `src/start.js`)
- **Evidência:** `grep -rn 'rate\|limiter\|helmet' src/` → **nada**; `package.json` não tem
  `express-rate-limit`. A rota aceita POST ilimitado do mesmo IP.
- **Impacto:** (a) **spam de criação** — qualquer um enche a coleção `users` (disco/write do Atlas);
  (b) **enumeração de e-mails** — o `unique` do e-mail vira oráculo: `200` = não existia,
  `400 "Registration failed"` = já existe (`authController.js:12-13`), permitindo testar se um
  e-mail está cadastrado; (c) nenhuma defesa contra abuso futuro.
- **Mudança:** `express-rate-limit` global ou só no `POST /auth/register` (ex.: 5 req/15 min/IP,
  `standardHeaders: true`), + documentar `app.set('trust proxy', 1)` se houver proxy.
- **Aceite:** 6ª requisição de registro do mesmo IP em 15 min → **429**.
- **Verificação:**
  ```bash
  for i in $(seq 1 6); do
    curl -s -o /dev/null -w "req $i -> %{http_code}\n" -X POST http://localhost:3000/auth/register \
      -H 'Content-Type: application/json' \
      -d "{\"name\":\"n$i\",\"email\":\"n$i@x.com\",\"password\":\"SenhaForte1!\"}"
  done
  # esperado: 200/400 nas 5 primeiras, 429 na 6ª
  ```

---

## 4. Bugs e defeitos funcionais

### BUG-01 · Typo `require` vs `required` — validação do schema silenciosamente desligada · [P0]

- **Arquivo:** `src/models/User.js:6,11,16`
- **Evidência:**
  ```javascript
  name:     { type: String, require: true },                  // linha 6
  email:    { type: String, unique: true, require: true, ... },// linha 11
  password: { type: String, require: true, select: false },   // linha 16
  ```
  A opção do Mongoose é **`required`**. `grep -n 'required' src/models/User.js` → **sem
  ocorrências**; as 3 ocorrências são `require:`. O Mongoose 7 **ignora** a chave desconhecida sem
  avisar — a obrigatoriedade nunca é registrada.
- **Impacto:** `POST /auth/register` com body `{}` **cria documento sem `name`/`email`/`password`**
  (o `catch` não dispara). O `unique` do e-mail não protege campos ausentes. Qualquer front/teste
  que espere `400` p/ dado incompleto quebra em produção **sem nenhum log** — falha silenciosa,
  exatamente o tipo que só aparece quando os dados já estão sujos.
- **Mudança:** trocar as 3 ocorrências por `required: true` (não deixe a chave morta):
  ```javascript
  email: { type: String, unique: true, required: true, lowercase: true },
  ```
- **Aceite:** `User.create({})` → `ValidationError`; body `{}` no endpoint → **400**;
  `grep -n 'require:' src/models/User.js` → vazio.
- **Verificação:**
  ```bash
  grep -n 'require:' src/models/User.js        # esperado: NENHUMA saída
  curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3000/auth/register \
    -H 'Content-Type: application/json' -d '{}'
  # esperado: 400 (hoje: 200 e documento vazio no Mongo)
  ```

### BUG-02 · `User.create(req.body)` — mass assignment · [P1]

- **Arquivo:** `src/controller/authController.js:9`
- **Evidência:** o body vai **integro** ao `create`:
  ```javascript
  const user = await User.create(req.body)
  ```
  O schema expõe os caminhos `name`, `email`, `password`, `createdAt` (`src/models/User.js:4-22`).
  `createdAt` tem `default: Date.now`, mas **default só age quando o campo não vem** — vindo do body,
  é aceito. *(Campos fora do schema são descartados pelo strict mode do Mongoose; o risco é sobre os
  campos **do** schema e sobre `"_id"` opcional.)*
- **Impacto:** cliente malicioso/bug de front envia `createdAt` fabricado (auditoria/ordenação falsa),
  `_id` escolhido, ou qualquer campo futuro do schema — sem allowlist, **toda** mudança de schema
  vira superfície de ataque sem tocar no controller. Combina com `BUG-01`: sem `required`, um
  "create" aceita corpo mínimos.
- **Mudança:** desestruturar allowlist no controller (junto do `SEC-01`):
  ```javascript
  const { name, email, password } = req.body   // allowlist explícita
  const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) })
  ```
- **Aceite:** `POST` com `{"createdAt":"1999-01-01T00:00:00Z", ...}` grava `createdAt` = **agora**
  (default do schema); campos fora da allowlist são ignorados.
- **Verificação:**
  ```bash
  curl -s -X POST http://localhost:3000/auth/register -H 'Content-Type: application/json' \
    -d '{"name":"A","email":"c@x.com","password":"SenhaForte1!","createdAt":"1999-01-01T00:00:00Z"}' >/dev/null
  mongosh --quiet marcacao --eval 'db.users.find({email:"c@x.com"},{createdAt:1,_id:0}).toArray()'
  # esperado: createdAt ~ HOJE (hoje: 1999-01-01 persistido)
  ```

### BUG-03 · `GET /auth/post` responde 200 com `"Registration failed"` · [P1]

- **Arquivo:** `src/controller/authController.js:4-6`
- **Evidência:**
  ```javascript
  router.get('/post', async (req, res) => {
      return res.status(200).send({"Ok": "Registration failed"})
  })
  ```
  Montada em `/auth` (linha 15) → **`GET /auth/post`** retorna HTTP **200** com corpo de
  **fracasso**. O `Readme.md:22` **documenta** o comportamento ("rota de teste que responde
  `{"Ok": "Registration failed"}`"). O gêmeo `Marcacao_Horario_Back-End` **não** tem esta rota
  (diff verificado: ela existe só aqui).
- **Impacto:** semântica quebrada: health checks/monitoramento tratam `200` como sucesso e leem
  `"failed"` como erro — alerta falso ou conclusão errada (pior: cliente que só olha o status
  registra sucesso de um "fracasso"). Nome `/post` num **GET** agrava a confusão. E é o tipo de
  resposta que se copia para o gêmeo.
- **Mudança:** (1) **remover a rota** (recomendado — não cumpre função) **ou** torná-la honesta:
  ```javascript
  router.get('/post', (req, res) => res.status(405).send({ error: 'Método não suportado' }))
  ```
  (2) se precisar de healthcheck, criar `GET /health` → `{"status":"ok"}`; (3) atualizar
  `Readme.md:22`.
- **Aceite:** `GET /auth/post` não devolve mais `200 {"Ok":"Registration failed"}` (404 após
  remoção, ou corpo coerente com o status).
- **Verificação:**
  ```bash
  curl -s -w '\n%{http_code}\n' http://localhost:3000/auth/post
  # esperado após fix: 404 (rota removida) — hoje: 200 + {"Ok":"Registration failed"}
  ```

### BUG-04 · `start.js`: typo "Listeing", `body-parser` deprecated e sem handler de porta · [P2]

- **Arquivo:** `src/start.js:2,6-7,10-12`
- **Evidência:**
  ```javascript
  const bodyParser = require('body-parser')           // linha 2
  app.use(bodyParser.json())                           // linha 6
  app.use(bodyParser.urlencoded({ extended: false }))  // linha 7
  const server = app.listen(port, () => {
    console.log("Listeing in http://localhost:"+port)  // linha 11 — typo
  })                                                   // arquivo termina aqui (linha 12)
  ```
  O Express **4.18.2** (`package.json:23`) traz `express.json()`/`express.urlencoded()` nativos desde
  o 4.16 — `body-parser` é redundante. Não há `server.on('error')`; o gêmeo
  `Marcacao_Horario_Back-End` **tem** handler de `EADDRINUSE` (`start.js:14-20`).
- **Impacto:** (a) log **"Listeing"** engana grep/verificação de startup e quem lê acha que o serviço
  não subiu; (b) `body-parser` **não é dependência direta** (só `express` e `mongoose` em
  `package.json:22-25`) — funciona hoje só porque o express o declara (`package-lock.json:52,193`);
  se o express deixar de empacotá-lo, `require('body-parser')` quebra **sem sinal no install**;
  (c) porta ocupada → stack crua de exceção não tratada em vez de mensagem acionável (`const server`
  nem é usado).
- **Mudança:** (1) `"Listening on http://localhost:" + port`; (2) `app.use(express.json())` +
  `app.use(express.urlencoded({ extended: false }))` e remover o `require` da linha 2; (3) copiar o
  handler do gêmeo:
  ```javascript
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`Porta ${port} ja esta em uso. Defina PORT=<outra porta> e tente novamente.`)
      process.exit(1)
    }
    throw err
  })
  ```
- **Aceite:** log sem typo; `grep -rn 'body-parser' src/` vazio; subir com a porta ocupada → mensagem
  amigável e `exit 1`.
- **Verificação:**
  ```bash
  node src/start.js >/dev/null 2>&1 & sleep 1
  node src/start.js; echo "exit=$?"
  # esperado: "Porta 3000 ja esta em uso..." e exit=1 (hoje: stack EADDRINUSE, exit!=0 com pânico)
  grep -n 'Listeing\|body-parser' src/start.js    # esperado: sem saída
  ```

### IMP-01 · Par de gêmeos quase-idêntico — divergência já comprovada · [P2]

- **Arquivo:** `src/` (inteiros) do par `Marcacao_Horario` × `Marcacao_Horario_Back-End`
- **Evidência:** `diff -r` dos dois `src/` executado na data desta análise:
  `models/User.js` e `database/index.js` **idênticos**; `authController.js` difere **só** pela rota
  `GET /post` (3 linhas); `start.js` difere (aqui: typo `Listeing` e sem `EADDRINUSE`; lá:
  `Listening` correto, handler de porta e `indexController`); lá existem ainda
  `src/controller/indexController.js` e `src/verify/Verify.js`. Divergências já **presentes no
  metadata**: `test` = `echo` fake (aqui) × script ausente (lá); `license` MIT × ISC; `author`
  preenchido × vazio; `description` "front-end/API" × dedicada ao back-end.
- **Impacto:** os dois repos **já corrigiram sozinhos metade dos defeitos um do outro** (lá tem o
  `EADDRINUSE` que falta aqui; aqui o `Verify.js` quebrado não foi copiado) e **já divergiram em
  metadata** — a cada fix manual em um só lado o par regride (`SEC-01`/`BUG-01` corrigidos aqui e
  esquecidos lá = senha em claro e `require:` morto vivendo em produção pela metade). É a causa-raiz
  dos defects de sincronismo: manter duas cópias sem processo é dívida permanente.
- **Mudança:** **antes de qualquer fix** executar a decisão da §9 — (A) definir o repo canônico e
  espelhar o outro com script de sync (idealmente um passo de `diff -r` no CI, ver `DEVOPS-01`), ou
  (B) manter os dois papéis com `models/`+`database/` em pacote compartilhado e aplicar **todos** os
  fixes do par **no mesmo PR**. Registrar a escolha no `Readme.md` dos dois repos.
- **Aceite:** decisão (A) ou (B) documentada; `diff -r` dos dois `src/` mostra **só** as diferenças
  intencionais da tabela de papéis; nenhum item P0/P1 deste plano existe em um repo sem existir no
  outro.
- **Verificação:**
  ```bash
  diff -r ../Marcacao_Horario/src src | head -20
  # esperado após a decisão: apenas start.js/authController.js/indexController/verify
  # (models/User.js e database/index.js NUNCA devem aparecer no diff)
  grep -n 'require:' src/models/User.js ../Marcacao_Horario/src/models/User.js   # ambos vazios
  ```

---

## 5. Qualidade: testes

### TEST-01 · `npm test` é fake: `echo` com exit 0 · [P1]

- **Arquivo:** `package.json:9`
- **Evidência:**
  ```json
  "test": "echo \"sem testes automatizados\""
  ```
  Executado **ao vivo**: `npm test` → imprime a frase e **`exit=0`**. O próprio `Readme.md:47`
  admite: "Scripts disponíveis no `package.json`: apenas `test` (sem testes implementados)".
  (O gêmeo `Marcacao_Horario_Back-End` nem tem script — ver o `TEST-01` dele.)
- **Impacto:** **verde falso**: qualquer CI (ver `DEVOPS-01`) passa sem testar nada; regressões
  como o typo do `BUG-01` passam infinitamente; o time acredita que existe cobertura. É pior que
  não ter script: **mascara** a ausência com exit 0.
- **Mudança:** runner nativo **`node:test`** (zero dependências novas) com testes que **não precisam
  de Mongo** — validação de schema via `validateSync()` e controller com `User.create` mockado:
  ```json
  "test": "node --test test/"
  ```
  ```javascript
  // test/user.schema.test.js
  const { test } = require('node:test'); const assert = require('node:assert')
  const User = require('../src/models/User')
  test('email/password são obrigatórios', () => {
    assert.ok(new User({}).validateSync().errors.email)
  })
  ```
  Mínimo: **3 casos** (schema vazio → erro; e-mail inválido → erro; `require` morto não volta).
- **Aceite:** `npm test` roda ≥ 3 casos reais e sai com exit 0; **sabotar** o `required` deixa a
  suíte vermelha (exit ≠ 0).
- **Verificação:**
  ```bash
  npm test; echo "exit=$?"                                  # casos reais, exit=0
  sed -i 's/required: true/require: true/' src/models/User.js
  npm test; echo "sabotage exit=$?"                         # esperado: !=0
  git checkout src/models/User.js                           # restaurar
  ```

---

## 6. DevOps / Infra

### DEVOPS-01 · Sem CI (nem `.github/`) · [P2]

- **Arquivo:** *(ausente)* — `ls -la .github` → **não existe**; a árvore completa do repo é
  `.gitignore`, `LICENSE`, `package.json`, `package-lock.json`, `Readme.md` e `src/**` — nenhum
  workflow, `.gitlab-ci.yml` ou Dockerfile.
- **Evidência:** nenhum arquivo de automação versionado; commits vão direto para a `master`.
- **Impacto:** (a) nada executa o `TEST-01` — mesmo depois de existirem testes, PRs quebrados
  passam; (b) nenhuma trava contra reintroduzir `require:` (typo) ou texto puro de senha; (c) o
  fix do `IMP-01` (gêmeos) é manual nos dois repos — é aqui que um CI com passo de diff contra o
  gêmeo canônico pagaria o investimento.
- **Mudança:** `.github/workflows/ci.yml` em `push`/`pull_request`: `npm ci` → `npm test` →
  (opcional) `npm audit --omit=dev`; depois, se adotar a sincronização da §9, um passo
  `diff -r` contra o repo canônico.
- **Aceite:** workflow verde no próximo push; um PR que sabote o teste fica vermelho.
- **Verificação:**
  ```bash
  ls .github/workflows/ci.yml && gh run list --limit 3
  # esperado: workflow listado e último run "success" (hoje: "No such file or directory")
  ```

---

## 7. Documentação

### DOC-01 · `repository.url` aponta para `Marcacao_Consultas` ≠ repositório real · [P2]

- **Arquivo:** `package.json:13` (`repository.url`), também `:19` (`bugs.url`) e `:21` (`homepage`)
- **Evidência:**
  ```json
  "url": "git+https://github.com/FrancosCorporation/Marcacao_Consultas.git"
  ```
  mas o remote real é **`origin → https://github.com/FrancosCorporation/Marcacao_Horario.git`**
  (`git remote -v`). O `Readme.md:15` descreve o repo como `Marcacao_Horario` e o `package.json:5`
  diz "front-end/API" — **package, README e remote discordam entre si**. O gêmeo repete o mesmo
  `Marcacao_Consultas` (os dois apontam para o terceiro repo).
- **Impacto:** `npm publish`/`npm repo`/SBOM e ferramentas de metadados apontam para o
  **repositório errado**; issues/homepage caem em projeto divergente; quem instala não encontra a
  fonte verdadeira; a `description` ambígua ("front-end/API" num repo que só tem API) reforça a
  confusão de papéis do par.
- **Mudança:** atualizar os 3 campos e a descrição:
  ```json
  "description": "Camada de entrada do sistema de marcacao de horario: API Express com cadastro de usuarios (par de Marcacao_Horario_Back-End).",
  "repository": { "type": "git", "url": "git+https://github.com/FrancosCorporation/Marcacao_Horario.git" },
  "bugs": { "url": "https://github.com/FrancosCorporation/Marcacao_Horario/issues" },
  "homepage": "https://github.com/FrancosCorporation/Marcacao_Horario#readme"
  ```
- **Aceite:** `npm pkg get repository.url` bate com `git remote get-url origin`; nenhuma menção a
  `Marcacao_Consultas` no `package.json`.
- **Verificação:**
  ```bash
  npm pkg get repository.url | grep -F 'Marcacao_Horario.git'   # deve existir
  grep -i 'Marcacao_Consultas' package.json || echo 'OK: sem divergencia'
  npm pkg get repository.url | grep -F "$(git remote get-url origin | sed 's/.*github.com\///;s/\.git$//').git"
  ```

---

## 8. Ordem de execução (waves)

### Wave 1 — P0 (segurança/integridade)
1. **`SEC-01`** — hash da senha (bcrypt + allowlist mínima no mesmo trecho).
2. **`BUG-01`** — `require` → `required` (reativa as validações do schema).

### Wave 2 — P1 (correção funcional + rede de segurança)
3. **`BUG-02`** — allowlist no `create` (mesmo trecho do `SEC-01`; depende de `BUG-01` para o
   `required` valer).
4. **`BUG-03`** — remover/corrigir `GET /auth/post` + atualizar `Readme.md:22`.
5. **`TEST-01`** — suíte `node:test` que **trava** as Waves 1-2 (senha hasheada, `required` ativo,
   allowlist, rota honesta).

### Wave 3 — P2 (robustez e higiene)
6. **`BUG-04`** — typo + `express.json()` + `EADDRINUSE` (copiar do gêmeo, que já tem o handler).
7. **`SEC-02`** — rate limit no register.
8. **`DOC-01`** — URLs e `description` do `package.json`.
9. **`DEVOPS-01`** — CI (passa a rodar o `TEST-01`).
10. **`IMP-01`** — sincronizar com o gêmeo **após** a decisão da §9.

**Dependências que não podem ser invertidas:**
`BUG-01` antes de `BUG-02`/`TEST-01` (sem `required`, o teste de obrigatório não faz sentido) ·
`SEC-01`+`BUG-02` juntos (tocam o mesmo trecho do controller) · `TEST-01` antes de `DEVOPS-01`
(CI sem teste só reproduziria o `echo`) · **`IMP-01` por último** — sincronizar antes de decidir o
canônico propaga o lado errado para o par.

---

## 9. Fora de escopo / riscos

| Item | Decisão | Motivo |
|---|---|---|
| **Qual repo do par vira canônico** | **DECIDIR ANTES DO 1º FIX** | Ver abaixo — é a decisão nº 1 deste plano. |
| Adicionar login/JWT | **Não (ainda)** | Não existe rota de login; escopo de feature. |
| Upgrade Express 4 / Mongoose 7 | **Não** | Versões atuais para o uso; sem necessidade. |
| Renomear branch `master` → `main` | **Opcional** | Branch real (local e `origin/HEAD`) é `master` — decisão de time. |
| Reescrever em TypeScript | **Não** | 58 LOC; dívida pequena demais para justificar. |

**A decisão que vem antes de tudo — destino do par:**

O `diff -r` dos dois `src/` foi executado: `models/User.js` e `database/index.js` são
**idênticos**; `authController.js` difere **só** pela rota `GET /post` (existe aqui, não lá);
`start.js` difere (aqui: typo `Listeing` e sem `EADDRINUSE`; lá: `Listening` correto, handler de
`EADDRINUSE` e `indexController`; lá existe ainda `src/verify/Verify.js`). Ou seja, **cada gêmeo já
tem metade das correções do outro**. Se `SEC-01`/`BUG-01` forem corrigidos só aqui, o
`Marcacao_Horario_Back-End` **regride** com senha em claro e `require:` morto — e vice-versa. A
própria divergência de licenças (`MIT` × `ISC`) e de `test` (`echo` × ausente) já é a prova do
custo da falta de sincronismo.

**Decisão necessária (escolher UM antes de executar a Wave 1):**
- **(A) Um canônico + espelho:** escolher o repo canônico (candidato natural:
  `Marcacao_Horario_Back-End`, que já tem `EADDRINUSE`, log correto, `description` dedicada e rota
  de teste honesta) e espelhar o outro a partir dele (script de sync no CI); **ou**
- **(B) Dois papéis, um contrato:** manter os dois repositórios com papéis distintos (entrada ×
  back-end), mas extrair `models/` + `database/` para pacote compartilhado e aplicar **todos** os
  fixes do par **no mesmo PR** (checklist do §10 duplicado, um por repo).

**Riscos desta execução:**

- **`BUG-01` corrigido muda comportamento:** body vazio passa a dar **400** — coleções de
  insomnia/front que enviavam `{}` vão quebrar (é o efeito desejado, mas avise quem testa).
- **`SEC-01` exige migração de dados legados:** não existem senhas hashadas hoje; se houver
  coleção `users` em produção com senha crua, o registro novo hasheia mas as antigas continuam
  cruas — como **não há login**, a saída é **reset/limpeza das senhas antigas**, não re-hash cego.
- **`BUG-04` (porta ocupada → `exit 1`)** muda operação: orquestrador que tolerava o crash crudo
  agora vê exit code — ajuste o healthcheck/restart policy.
- **`TEST-01` sabotagem:** o `sed` de verificação modifica `src/models/User.js` — rode em working
  tree limpo e restaure com `git checkout`.
- **`IMP-01` adiado demais:** cada fix novo sem sincronizar aumenta o custo do diff do par; se a
  decisão (A)/(B) demorar, **congele** mudanças nos dois lados até decidir.

---

## 10. Definição de pronto (DoD)

**Segurança**
- [ ] `SEC-01` — senha no Mongo começa com `$2b$`/`$2a$`; senha crua inexistente
- [ ] `SEC-02` — 6º `POST /auth/register` do mesmo IP em 15 min → `429`

**Funcional**
- [ ] `BUG-01` — `grep -n 'require:' src/models/User.js` sem saída; body `{}` → `400`
- [ ] `BUG-02` — `createdAt` fabricado **não** persiste (default do schema); campos fora da allowlist ignorados
- [ ] `BUG-03` — `GET /auth/post` não devolve mais `200 {"Ok":"Registration failed"}` (+ `Readme.md:22` atualizado)
- [ ] `BUG-04` — log `"Listening"` correto; `grep -rn 'body-parser' src/` vazio; porta ocupada → mensagem amigável + `exit 1`

**Testes, docs e infra**
- [ ] `TEST-01` — `npm test` roda ≥ 3 casos reais; sabotar o `required` deixa a suíte vermelha
- [ ] `DEVOPS-01` — workflow de CI verde em push/PR
- [ ] `DOC-01` — `repository.url` = `Marcacao_Horario.git` (bate com `git remote get-url origin`); nenhuma menção a `Marcacao_Consultas`
- [ ] `IMP-01` — decisão (A)/(B) da §9 registrada; `diff -r` contra o gêmeo mostra **só** as diferenças intencionais

**Validação final:**
```bash
grep -rn 'require:' src/models/User.js          # esperado: vazio
grep -rn 'bcrypt' package.json                  # esperado: presente
grep -n 'Listeing\|body-parser' src/start.js    # esperado: vazio
grep -i 'Marcacao_Consultas' package.json || echo 'OK: URLs corrigidas'
npm test; echo "exit=$?"                        # casos reais, exit=0
python3 /tmp/validate.py Marcacao_Horario       # esperado: OK
```

---

*Fim do plano. Gerado por leitura direta do código em 2026-10-05. Todos os `grep`, `diff`, `git remote` e `npm test` citados foram executados na data da análise; nenhum item já estava corrigido.*
