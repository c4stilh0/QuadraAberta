# Guia de Deploy Seguro no Home Server — QuadraAberta

Este guia descreve como hospedar o **QuadraAberta** no seu próprio servidor doméstico usando Docker + Nginx + **Cloudflare Tunnel** (sem abrir portas no roteador e com HTTPS automático para o GPS funcionar).

---

## Arquitetura Isolada

```text
  [ Internet (HTTPS) ]
           │
           ▼
  [ Cloudflare Tunnel (cloudflared) ]  ← Sem Port Forwarding no roteador
           │
           ▼
  [ Nginx / Frontend (127.0.0.1:8088) ]
     ├── /          → Build estático React (SPA)
     ├── /api/      → Proxy para backend:8080
     └── /uploads/  → Proxy para backend:8080
           │ (rede Docker interna `quadra_internal`)
           ▼
  [ Backend Spring Boot :8080 ] ──▶ [ PostgreSQL 16 ] (porta 5432 NÃO exposta)
```

---

## Passo a Passo

### 1. Criar o `.env` com segredos reais
Na raiz do projeto:
```bash
cp .env.homeserver.example .env
```
Edite o `.env` e **obrigatoriamente** defina:
- `POSTGRES_PASSWORD`: senha forte do banco.
- `JWT_SECRET`: chave aleatória forte (ex.: `openssl rand -hex 32`).
- `CORS_ALLOWED_ORIGINS`: o domínio HTTPS que você vai usar (ex.: `https://quadra.seudominio.com`).

> Os botões de login rápido com 1 clique (`VITE_ENABLE_DEMO_LOGIN=false`) ficam desativados por padrão no build de produção para não expor acesso de Gestor publicamente.

### 2. Subir a stack (Nginx + Backend + PostgreSQL)

**Opção A — Você já tem `cloudflared` ou Caddy/Nginx rodando no host:**
```bash
docker compose -f docker-compose.homeserver.yml up -d --build
```
Aponte o seu túnel ou proxy reverso para `http://127.0.0.1:8088`.

**Opção B — Subir o Cloudflare Tunnel junto no Docker:**
1. No painel *Zero Trust > Networks > Tunnels* da Cloudflare, crie um túnel apontando o *Public Hostname* para `http://frontend:80`.
2. Cole o token em `CLOUDFLARE_TUNNEL_TOKEN` no `.env`.
3. Suba com o profile `tunnel`:
```bash
docker compose -f docker-compose.homeserver.yml --profile tunnel up -d --build
```

**Opção C — Teste rápido sem domínio próprio (Quick Tunnel temporário):**
Suba com a Opção A e rode no servidor:
```bash
cloudflared tunnel --url http://127.0.0.1:8088
```
*(Se usar Quick Tunnel, lembre de incluir a URL `https://*.trycloudflare.com` gerada em `CORS_ALLOWED_ORIGINS` ou deixe o acesso todo pela mesma URL do Nginx — como o frontend chama `/api` na mesma origem, as requisições `GET/POST` passam pelo próprio Nginx).*

---

## Checklist Pós-Apresentação
1. Se habilitou `VITE_ENABLE_DEMO_LOGIN=true` ou `SWAGGER_ENABLED=true` apenas para a banca, desative ou derrube o túnel após a avaliação.
2. Caso tenha feito login como o usuário gestor padrão de demonstração, altere a senha dele antes de manter o serviço no ar continuamente.
