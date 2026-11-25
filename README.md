# QuadraAberta

Plataforma comunitária para democratização do acesso, agendamento sem conflitos, matchmaking esportivo georreferenciado, divulgação de turmas sociais gratuitas e zeladoria participativa de quadras públicas em **Sete Lagoas – MG** e região.

Projeto desenvolvido para a **Atividade A3** do Centro Universitário UNA nas Unidades Curriculares:
- **Usabilidade, Desenvolvimento Web, Mobile e Jogos**
- **Sistemas Distribuídos e Mobile**

---

## Impacto Social e ODS Relacionadas

O **QuadraAberta** atende diretamente a três Objetivos de Desenvolvimento Sustentável (ODS) da ONU:
- **ODS 3 – Saúde e Bem-Estar:** incentivar a prática regular de atividades físicas e esportivas na comunidade.
- **ODS 10 – Redução das Desigualdades:** ampliar o acesso gratuito ao esporte e ao lazer em bairros periféricos, conectando moradores e projetos sociais voluntários.
- **ODS 11 – Cidades e Comunidades Sustentáveis:** estimular a ocupação, a conservação e a manutenção colaborativa de espaços públicos esportivos.

---

## Entregáveis e Links Rápidos

| Artefato | Localização / Acesso |
|---|---|
| **Documentação do Projeto (ABNT)** | [docs/Documentacao_Projeto_QuadraAberta.docx](docs/Documentacao_Projeto_QuadraAberta.docx) |
| **Protótipo Interativo (Figma)** | [Abrir protótipo no Figma](https://www.figma.com/design/bcKV1pdAfx9vE6cjfu8Fr7/Agendamento-de-quadra--Community-?node-id=2-2&p=f) |
| **Banco de Dados em Arquivo (SQLite)** | [database/quadra_aberta.sqlite](database/quadra_aberta.sqlite) |
| **Dump Completo PostgreSQL (.sql)** | [database/quadra_aberta_dump.sql](database/quadra_aberta_dump.sql) |
| **Migrations Versionadas (Flyway)** | [src/main/resources/db/migration](src/main/resources/db/migration) (`V1` a `V7`) |
| **Documentação Ativa da API (Swagger)** | `http://localhost:8080/swagger-ui.html` (`/v3/api-docs`) |
| **Guias de Deploy** | [DEPLOY.md](DEPLOY.md) · [HOMESERVER_DEPLOY.md](HOMESERVER_DEPLOY.md) |

---

## Funcionalidades Implementadas

- **Mapa Interativo e Catálogo de Quadras:** visualização via **Leaflet** com sincronização de espaços esportivos de Sete Lagoas (OpenStreetMap/Overpass + catálogo integrado).
- **Matchmaking Esportivo Inteligente:** criação de partidas abertas com quórum por modalidade, confirmação de presença (*"Tô Dentro"*), cálculo em tempo real do **centróide geográfico** dos participantes (protegendo endereços individuais) e sugestão das **3 melhores quadras públicas** pela **Fórmula de Haversine**.
- **Agendamento com Prevenção de Conflitos:** reservas com proteção contra sobreposição de horários garantida no PostgreSQL pela constraint `EXCLUDE USING gist` (`uk_reserva_sem_sobreposicao`).
- **Turmas Sociais e Voluntariado:** cadastro e consulta de aulas e projetos esportivos gratuitos vinculados às quadras.
- **Zeladoria Participativa:** abertura de chamados de manutenção com upload de fotos (armazenamento local ou Cloudinary) e acompanhamento de status por gestores.
- **Bate-papo da Partida, Perfil e Reputação:** chat interno na sala da partida, edição de perfil com foto e avaliação pós-jogo entre participantes.

---

## Arquitetura Distribuída e Tecnologias

O sistema segue arquitetura distribuída **cliente-servidor desacoplada** com API RESTful stateless autenticada via **JWT**:

```text
[ Cliente Web SPA (React + Vite + Leaflet) ]
                    │
         HTTP / JSON + Bearer JWT
                    ▼
[ API RESTful (Spring Boot 4.1.1 / Java 17) ]
   ├── Controller  (exposição de endpoints REST)
   ├── Service     (regras de negócio e cálculos geoespaciais)
   ├── Repository  (persistência Spring Data JPA)
   ├── Entity/DTO  (modelo relacional + Jakarta Validation)
   └── Exception   (@RestControllerAdvice -> RFC ProblemDetail)
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
[ PostgreSQL 16 + Flyway ]  [ Cloudinary / /uploads ]
```

### Stack Técnica
- **Back-end:** Java 17, Spring Boot 4.1.1, Spring WebMVC, Spring Security + JWT (`jjwt`), Spring Data JPA, Hibernate, Jakarta Validation, `@RestControllerAdvice` (`ProblemDetail`), Flyway (`V1`–`V7`), Springdoc OpenAPI / Swagger UI.
- **Front-end:** React 19, Vite 8, Tailwind CSS 3, Leaflet, Lucide Icons, cliente HTTP assíncrono em [frontend/src/api/client.js](frontend/src/api/client.js) com estados de carregamento e exibição estruturada de erros de validação.
- **Banco de Dados:** PostgreSQL 16 (extensão `btree_gist`) em execução; H2 em memória para suíte automatizada de testes; exportação estática em SQLite e SQL dump em `database/`.
- **Infraestrutura / Deploy:** Docker, Docker Compose, Nginx e guia de exposição segura com Cloudflare Tunnel ([HOMESERVER_DEPLOY.md](HOMESERVER_DEPLOY.md)).

### Principais Grupos de Endpoints (`/api`)
- `POST /api/auth/cadastrar`, `/login`, `/redefinir-senha`
- `GET/PUT/POST /api/usuarios/perfil`, `/perfil/foto`
- `GET/POST/PUT/DELETE /api/quadras` e `POST /api/quadras/sincronizar-osm`
- `GET/POST/DELETE /api/partidas`, `/{id}/confirmar`, `/{id}/sair`, `/{id}/escolher-quadra`, `/{id}/finalizar`
- `GET/POST /api/partidas/{partidaId}/mensagens`
- `GET/POST/DELETE /api/reservas`
- `GET/POST /api/turmas`
- `GET/POST/PATCH /api/chamados`
- `GET/POST /api/avaliacoes`

---

## Como Executar Localmente

### 1. Subir o banco de dados PostgreSQL
```bash
docker compose up -d
```

### 2. Executar o Back-end (Spring Boot)
```bash
.\mvnw.cmd spring-boot:run
```
A API ficará disponível em `http://localhost:8080` e o Swagger UI em `http://localhost:8080/swagger-ui.html`.

### 3. Executar o Front-end (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
A aplicação Web abrirá em `http://localhost:5173`.

### 4. Executar Testes e Validações
```bash
# Testes automatizados do Back-end (perfil test com H2)
.\mvnw.cmd test

# Lint e build de produção do Front-end
cd frontend
npm run lint
npm run build
```

*(Para subir a stack completa em container com Nginx + PostgreSQL + Cloudflare Tunnel, consulte [HOMESERVER_DEPLOY.md](HOMESERVER_DEPLOY.md).)*

---

## Equipe

| Integrante | RA |
|---|---|
| Alvaro Araújo Pereira Silva | `92311446` |
| Anna Beatriz Macedo da Costa | `92311072` |
| Bruno Canabrava Lima | `92311031` |
| Pedro Henrique Santos Lima | `92520438` |
| Vinícius Castilho de Souza e Silva | `92310728` |
| Wdson Gonçalves de Sousa | `92311017` |
