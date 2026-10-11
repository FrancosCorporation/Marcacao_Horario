# Marcação de Horário — Entrada

![Node.js](https://img.shields.io/badge/Node.js-22%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?logo=mongodb&logoColor=white)
![Licença](https://img.shields.io/badge/licen%C3%A7a-MIT-blue)
![Status](https://img.shields.io/badge/status-prot%C3%B3tipo-orange)

API de entrada e cadastro de usuários para o sistema de marcação de horário. Trabalha em conjunto com [Marcacao_Horario_Back-End](https://github.com/FrancosCorporation/Marcacao_Horario_Back-End).

## Organização

- **Marcacao_Horario** (este repositório) recebe pedidos de cadastro.
- **Marcacao_Horario_Back-End** mantém a cópia canônica do modelo de usuário e da conexão com MongoDB, além do endpoint de verificação /teste.
- Este projeto mantém src/models/User.js e src/database/index.js espelhados a partir do repositório canônico.

O serviço oferece cadastro, mas ainda não tem login nem autenticação de usuários.

## API

### POST /auth/register

Recebe JSON com name, email e password. Campos adicionais são ignorados. O nome e o e-mail são normalizados; o e-mail deve ter formato válido e a senha precisa ter ao menos 8 caracteres. Senhas que excedem 72 bytes em UTF-8 são rejeitadas para evitar truncamento pelo bcrypt.

~~~json
{
  "name": "Ana Silva",
  "email": "ana@example.com",
  "password": "uma-senha-com-8-ou-mais"
}
~~~

- 201: usuário cadastrado.
- 400: dados inválidos ou cadastro não concluído.
- 429: mais de 5 tentativas do mesmo IP em 15 minutos.
- 503: serviço de cadastro indisponível.

A senha é armazenada com bcrypt e nunca é enviada na resposta. O corpo das requisições JSON e URL-encoded tem limite de 10 KB.

## Configuração e execução

Requer Node.js 22 ou superior e um MongoDB acessível. O serviço usa MONGO_URI; sem essa variável, tenta mongodb://localhost:27017/marcacao. A porta padrão é 3000.

~~~bash
npm ci

export MONGO_URI='mongodb://localhost:27017/marcacao'
export PORT=3000

# Produção
npm start

# Desenvolvimento com watch nativo do Node.js
npm run dev
~~~

Em hospedagens atrás de proxy, a aplicação precisa receber o IP real do cliente para aplicar corretamente o limite por IP. Configure trust proxy somente de acordo com a topologia e os proxies confiáveis do ambiente.

Ainda não há suíte de testes automatizados.

## Estrutura

~~~
src/
├── start.js
├── database/index.js
├── models/User.js
└── controller/authController.js
~~~

## Licença

Distribuído sob a licença MIT. Consulte o arquivo [LICENSE](./LICENSE).
