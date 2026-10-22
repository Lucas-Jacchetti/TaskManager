# Task Manager

Aplicação web para gerenciar tarefas organizadas por semana, com cadastro e login de usuários. O backend é uma API em NestJS com PostgreSQL e o frontend é uma SPA em React.

## Como rodar localmente

1. Clone o repositório e entre na pasta:

```bash
git clone https://github.com/Lucas-Jacchetti/TaskManager.git
cd TaskManager
```

2. Crie um arquivo `.env` na raiz do projeto com o segredo usado para assinar os tokens JWT (qualquer texto com no mínimo 32 caracteres):

```
JWT_SECRET=troque-por-uma-string-aleatoria-com-no-minimo-32-caracteres
```


3. Suba a aplicação:

```bash
docker compose up -d --build
```

Esse comando sobe o banco, o backend, o frontend e sonarqube. As migrations do banco rodam automaticamente quando o backend inicia.

4. Acesse:

| Serviço  | URL                   |
| -------- | --------------------- |
| Frontend | http://localhost:5173 |
| API      | http://localhost:3000 |


### Parar a aplicação

```bash
docker compose down
```

## Variáveis de ambiente

Definidas no arquivo `.env` da raiz:

| Variável          | Obrigatória | Padrão        | Descrição                                      |
| ----------------- | ----------- | ------------- | ---------------------------------------------- |
| JWT_SECRET        | Sim         | -             | Segredo dos tokens JWT, mínimo de 32 caracteres |
| POSTGRES_USER     | Não         | `taskmanager` | Usuário do banco da aplicação                  |
| POSTGRES_PASSWORD | Não         | `taskmanager` | Senha do banco da aplicação                    |
| POSTGRES_DB       | Não         | `taskmanager` | Nome do banco da aplicação                     |

As demais variáveis (`DATABASE_URL`, `FRONTEND_URL` e `VITE_API_URL`) já estão configuradas no `docker-compose.yml` para o ambiente local.

## Tecnologias

- Backend: NestJS (TypeScript), PostgreSQL 16, autenticação com JWT, testes com Jest
- Frontend: React, Vite, TypeScript, testes com Vitest, servido por nginx na imagem Docker
- Infraestrutura: Docker, Docker Compose
- Qualidade e segurança: SonarQube, npm audit, Gitleaks, Trivy
- CI/CD: GitHub Actions
- Hospedagem: Render (backend) e Vercel (frontend)


## Qualidade de código com SonarQube

O SonarQube roda apenas localmente, junto com o restante dos serviços do `docker-compose.yml`. Ao executar `docker compose up -d`, o Compose:

1. Sobe o SonarQube e o banco dele.
2. Gera um token de acesso automaticamente (serviço `sonar-init`).
3. Roda os testes com cobertura do backend e do frontend (serviço `sonar-coverage`).
4. Executa a análise (serviço `sonar-scanner`).

Quando o scanner termina, o projeto aparece no dashboard em http://localhost:9000, sem necessidade de login.

Observações:

- Não troque a senha do usuário `admin` do SonarQube. O `sonar-init` usa a senha padrão para gerar o token.
- A pasta `.scannerwork/` é gerada pelo scanner e está no `.gitignore`.
- Se um teste falhar, o scanner não é executado. O erro aparece no log do `sonar-coverage`.

## CI/CD

A pipeline (GitHub Actions) roda em todo push e pull request e tem os seguintes jobs:

- Backend: instala dependências, faz o build e roda os testes com cobertura mínima
- Frontend: instala dependências, faz o build (checagem de tipos) e roda os testes com cobertura mínima
- Segurança: auditoria de dependências com `npm audit`, varredura de segredos com Gitleaks e análise de configuração e imagens Docker com Trivy
- Deploy: executado apenas em push na branch `main`, depois que os jobs de teste e segurança passam

O arquivo `.trivyignore` lista CVEs aceitas conscientemente: são pacotes internos do npm que vem embutido na imagem `node` e que a aplicação não usa em runtime.

## Deploy

O deploy do backend (Render) e do frontend (Vercel) é disparado pela pipeline por meio de deploy hooks.

Secrets necessários no repositório do GitHub:

| Secret                   | Uso                          |
| ------------------------ | ---------------------------- |
| RENDER_DEPLOY_HOOK_URL   | Deploy do backend na Render  |
| VERCEL_DEPLOY_HOOK_URL   | Deploy do frontend na Vercel |

Variáveis de ambiente nos serviços de hospedagem:

- Render (backend): `DATABASE_URL`, `JWT_SECRET` e `FRONTEND_URL`
- Vercel (frontend): `VITE_API_URL`, com a URL pública da API. O Vite embute esse valor no build.
