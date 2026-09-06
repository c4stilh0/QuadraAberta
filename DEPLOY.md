# Guia de Deploy e Migração para a Nuvem (100% Free Tier) — QuadraAberta API

Este documento detalha o processo completo de transição da API do ambiente local para produção na nuvem, utilizando serviços 100% gratuitos (Free Tier), sem custos de infraestrutura ou licenciamento.

---

## Sumário
1. [Arquitetura de Nuvem Gratuita](#1-arquitetura-de-nuvem-gratuita)
2. [Passo 1: Banco de Dados Serverless (Neon ou Supabase)](#2-passo-1-banco-de-dados-serverless-neon-ou-supabase)
3. [Passo 2: Armazenamento de Fotos (Cloudinary)](#3-passo-2-armazenamento-de-fotos-cloudinary)
4. [Passo 3: Deploy do Backend (Render ou Koyeb)](#4-passo-3-deploy-do-backend-render-ou-koyeb)
5. [Passo 4: Integração de Frontend e CORS (Vercel / Cloudflare Pages)](#5-passo-4-integração-de-frontend-e-cors-vercel--cloudflare-pages)
6. [Matriz Comparativa de Variáveis de Ambiente](#6-matriz-comparativa-de-variáveis-de-ambiente)
7. [Verificação Pós-Deploy e Documentação OpenAPI](#7-verificação-pós-deploy-e-documentação-openapi)

---

## 1. Arquitetura de Nuvem Gratuita

```
  [ Frontend Web ] (Vercel / Cloudflare Pages)
         │
         │ HTTPS / JSON / JWT
         ▼
  [ Backend Spring Boot ] (Render ou Koyeb - Container Docker)
     - Java 17 (Temurin JRE Alpine)
     - JVM restrita: -Xmx384m -Xms128m
         │
         ├───────────────────────────────┐
         ▼                               ▼
  [ PostgreSQL 16 ]            [ Cloudinary Free Tier ]
(Neon / Supabase com SSL)       (Fotos da Zeladoria)
```

---

## 2. Passo 1: Banco de Dados Serverless (Neon ou Supabase)

### Opção A: Neon Serverless PostgreSQL (Recomendado)
1. Acesse [neon.tech](https://neon.tech) e crie uma conta gratuita com GitHub/Google.
2. Clique em **Create Project**, defina o nome (ex: `quadra-aberta-db`) e selecione a região mais próxima (ex: `AWS us-east-2`).
3. No Dashboard do Neon, localize a seção **Connection Details**.
4. Selecione a opção **Pooled Connection** (recomendado para conexões em nuvem) e copie a URL JDBC.
5. **Atenção:** A URL do Neon **obrigatoriamente** requer o parâmetro `?sslmode=require`. Exemplo:
   ```
   jdbc:postgresql://ep-example-12345.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Opção B: Supabase PostgreSQL
1. Acesse [supabase.com](https://supabase.com) e crie um novo projeto.
2. Acesse **Project Settings > Database > Connection string > URI**.
3. Altere o protocolo de `postgresql://` para `jdbc:postgresql://` e assegure o sufixo `?sslmode=require`.

### Execução Automática das Migrations (Flyway)
- A aplicação possui o **Flyway** ativado por padrão (`spring.flyway.enabled=true`).
- No **primeiro boot** da aplicação conectada ao banco na nuvem, o Flyway:
  1. Habilitará a extensão `btree_gist` automaticamente.
  2. Criará as tabelas `tb_usuario`, `tb_quadra`, `tb_turma_social`, `tb_reserva` e `tb_chamado_zeladoria`.
  3. Criará a constraint de exclusão `uk_reserva_sem_sobreposicao` e todos os índices de performance.
  4. Criará a tabela de controle `flyway_schema_history`.
- **Nenhum comando SQL manual precisa ser executado no console do banco.**

---

## 3. Passo 2: Armazenamento de Fotos (Cloudinary)

1. Crie uma conta gratuita no [Cloudinary](https://cloudinary.com/).
2. No Dashboard do Cloudinary, copie:
   - **Cloud Name** (ex: `dxyz123abc`)
   - **API Key** (ex: `123456789012345`)
   - **API Secret** (ex: `aBcDeF-GhIjKlMnOpQrStUvWxYz`)
3. Essas 3 chaves serão inseridas como variáveis de ambiente no serviço de deploy do backend.

---

## 4. Passo 3: Deploy do Backend (Render ou Koyeb)

### Deploy no Render (Free Web Service)
1. Acesse [dashboard.render.com](https://dashboard.render.com/) e clique em **New + > Web Service**.
2. Conecte o repositório GitHub do projeto (`QuadraAberta`).
3. Configure as opções básicas:
   - **Name:** `quadra-aberta-api`
   - **Region:** `Ohio (US East)` (mesma região do Neon para menor latência)
   - **Branch:** `main`
   - **Language / Runtime:** Selecione **Docker**.
   - **Dockerfile Path:** `./Dockerfile`
   - **Instance Type:** **Free** (512 MB RAM, 0.1 CPU).
4. Na seção **Environment Variables**, cadastre as variáveis listadas na [Matriz de Variáveis](#6-matriz-comparativa-de-variáveis-de-ambiente).
5. Clique em **Deploy Web Service**.

> **Nota sobre Limites de Memória e Sleep:**
> O `Dockerfile` do projeto foi construído com as flags `-Xmx384m -Xms128m -XX:+UseG1GC` para garantir que o consumo da JVM permaneça seguro abaixo do teto de 512 MB do Render, prevenindo encerramentos abruptos por Out of Memory (OOM Killer).
> Na camada gratuita do Render, a aplicação entra em suspensão após 15 minutos sem requisições; a primeira requisição posterior levará cerca de 40 segundos para acordar o container.

---

## 5. Passo 4: Integração de Frontend e CORS (Vercel / Cloudflare Pages)

Quando o frontend for hospedado (por exemplo, na Vercel em `https://quadra-aberta.vercel.app`):
1. No painel do Render, edite a variável de ambiente `CORS_ALLOWED_ORIGINS`.
2. Adicione a URL pública do frontend:
   ```
   CORS_ALLOWED_ORIGINS=https://quadra-aberta.vercel.app,http://localhost:3000
   ```
3. Salve as alterações. O Spring Security aplicará as permissões para chamadas `fetch` e `axios` do frontend com credenciais.

---

## 6. Matriz Comparativa de Variáveis de Ambiente

| Variável | Ambiente Local (`localhost`) | Ambiente de Produção (Render / Koyeb) | Descrição |
| :--- | :--- | :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/quadra_aberta_db` | `jdbc:postgresql://ep-...tech/neondb?sslmode=require` | URL JDBC com SSL obrigatório na nuvem |
| `SPRING_DATASOURCE_USERNAME` | `postgres` | `usuario_gerado_neon` | Usuário do banco de dados |
| `SPRING_DATASOURCE_PASSWORD` | `postgressecret` | `senha_gerada_neon` | Senha segura do banco de dados |
| `JWT_SECRET` | `9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e...` | `string_secreta_aleatoria_64_chars` | Chave HMAC-SHA256 de pelo menos 256 bits |
| `JWT_EXPIRATION_HOURS` | `24` | `24` | Tempo de validade dos tokens emitidos |
| `CLOUDINARY_CLOUD_NAME` | `demo-quadraaberta` | `seu_cloud_name_real` | Nome da nuvem de mídia Cloudinary |
| `CLOUDINARY_API_KEY` | `demo-key` | `sua_api_key_real` | Chave de API do Cloudinary |
| `CLOUDINARY_API_SECRET` | `demo-secret` | `seu_api_secret_real` | Segredo de API do Cloudinary |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000,http://localhost:5173` | `https://quadra-aberta.vercel.app` | Lista separada por vírgula de origens web permitidas |
| `PORT` | `8080` | `8080` (gerenciado pela plataforma) | Porta HTTP do container |

---

## 7. Verificação Pós-Deploy e Documentação OpenAPI

Após o deploy concluído:
1. Acesse o endpoint de documentação interativa Swagger UI:
   `https://sua-api.onrender.com/swagger-ui.html`
2. Teste o fluxo de ponta a ponta:
   - Registre o primeiro usuário gestor via `POST /api/auth/cadastrar`.
   - Obtenha o token via `POST /api/auth/login`.
   - Clique em **Authorize** no Swagger e insira `Bearer <seu_token>`.
   - Cadastre uma quadra via `POST /api/quadras`.
   - Faça uma reserva via `POST /api/reservas`.
