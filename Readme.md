# Marcação de Horário — Front

![Node.js](https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Status](https://img.shields.io/badge/status-prot%C3%B3tipo-orange)

Repositório front do sistema de marcação de horário: serviço Node/Express que recebe o cadastro de usuários e conversa com o repositório irmão [Marcacao_Horario_Back-End](https://github.com/FrancosCorporation/Marcacao_Horario_Back-End).

## Sobre

O projeto **Marcação de Horário** nasceu para registrar usuários de um sistema de agendamento. Ele está dividido em dois repositórios que formam um par:

- **Marcacao_Horario** (este): camada de entrada, com as rotas de cadastro e uma rota de teste, conectando-se ao MongoDB.
- **[Marcacao_Horario_Back-End](https://github.com/FrancosCorporation/Marcacao_Horario_Back-End)**: camada de back-end, com as rotas de cadastro e um endpoint de verificação (`/teste`).

Os dois compartilham o mesmo modelo de usuário (`src/models/User.js`) e a mesma configuração de banco (`src/database/index.js`), então devem ser usados juntos.

## Funcionalidades

- `GET /auth/post`: rota de teste que responde `{"Ok": "Registration failed"}`.
- `POST /auth/register`: cria um usuário a partir do corpo da requisição (`name`, `email`, `password`) usando Mongoose, respondendo `{"user": "Usuario Registrado"}` em caso de sucesso e `400` em caso de falha.
- Modelo de usuário com `name`, `email` (único, minúsculo), `password` (`select: false`) e `createdAt`.
- Parsing de JSON e `urlencoded` via `body-parser`.

## Stack

- **Node.js 18** (CommonJS)
- **Express 4**
- **Mongoose 7** (MongoDB)

## Como rodar

Requer configuração de ambiente: o `package.json` não define script de `start` e a conexão com o MongoDB está fixada no código em `src/database/index.js`.

```bash
# 1. Instalar dependências
npm install

# 2. Ajustar a string de conexão do MongoDB em src/database/index.js

# 3. Subir o serviço (a entrada é src/start.js, que escuta na porta 3000)
node src/start.js
```

Scripts disponíveis no `package.json`: apenas `test` (sem testes implementados).

Observação: a conexão usa a opção `useMongoClient`, removida nas versões recentes do Mongoose — com a versão declarada (`^7.0.5`) a chamada de conexão precisa ser revista antes de subir o serviço.

## Estrutura do projeto

```
Marcacao_Horario/
├── src/
│   ├── start.js                  # bootstrap do Express (porta 3000)
│   ├── database/index.js         # conexão Mongoose
│   ├── models/User.js            # schema de usuário
│   └── controller/authController.js
└── package.json
```

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
