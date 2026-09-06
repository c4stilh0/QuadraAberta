-- Habilita extensão para constraint de exclusão temporal no PostgreSQL
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabela de Usuários
CREATE TABLE tb_usuario (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(120) NOT NULL,
    email VARCHAR(120) NOT NULL,
    telefone VARCHAR(20),
    cpf VARCHAR(14) NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_usuario_email UNIQUE (email),
    CONSTRAINT uk_usuario_cpf UNIQUE (cpf)
);

-- Tabela de Quadras Poliesportivas
CREATE TABLE tb_quadra (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    bairro VARCHAR(80) NOT NULL,
    logradouro VARCHAR(150) NOT NULL,
    cep VARCHAR(10),
    tipo_piso VARCHAR(50) NOT NULL,
    possui_iluminacao BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(30) NOT NULL
);

-- Tabela de Turmas Sociais (Aulas contínuas de projetos sociais e voluntários)
CREATE TABLE tb_turma_social (
    id BIGSERIAL PRIMARY KEY,
    quadra_id BIGINT NOT NULL,
    instrutor_id BIGINT NOT NULL,
    modalidade VARCHAR(60) NOT NULL,
    dia_semana VARCHAR(20) NOT NULL,
    horario_inicio TIME NOT NULL,
    horario_fim TIME NOT NULL,
    capacidade_alunos INTEGER NOT NULL,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_turma_quadra FOREIGN KEY (quadra_id) REFERENCES tb_quadra(id) ON DELETE CASCADE,
    CONSTRAINT fk_turma_instrutor FOREIGN KEY (instrutor_id) REFERENCES tb_usuario(id)
);

-- Tabela de Reservas (Partidas Avulsas e Aulas Sociais)
CREATE TABLE tb_reserva (
    id BIGSERIAL PRIMARY KEY,
    quadra_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    data_inicio TIMESTAMP NOT NULL,
    data_fim TIMESTAMP NOT NULL,
    tipo_reserva VARCHAR(30) NOT NULL,
    status VARCHAR(30) NOT NULL,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_reserva_quadra FOREIGN KEY (quadra_id) REFERENCES tb_quadra(id) ON DELETE CASCADE,
    CONSTRAINT fk_reserva_usuario FOREIGN KEY (usuario_id) REFERENCES tb_usuario(id),
    CONSTRAINT chk_reserva_datas CHECK (data_fim > data_inicio)
);

-- Constraint de Exclusão para Prevenção Absoluta de Double Booking no PostgreSQL
-- Garante que nenhuma quadra possua duas reservas confirmadas sobrepostas no tempo
ALTER TABLE tb_reserva
ADD CONSTRAINT uk_reserva_sem_sobreposicao
EXCLUDE USING gist (
    quadra_id WITH =,
    tsrange(data_inicio, data_fim) WITH &&
) WHERE (status = 'CONFIRMADA');

-- Tabela de Chamados de Zeladoria Participativa
CREATE TABLE tb_chamado_zeladoria (
    id BIGSERIAL PRIMARY KEY,
    quadra_id BIGINT NOT NULL,
    autor_id BIGINT NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descricao TEXT NOT NULL,
    foto_url VARCHAR(500),
    status VARCHAR(30) NOT NULL,
    data_abertura TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    data_resolucao TIMESTAMP,
    CONSTRAINT fk_chamado_quadra FOREIGN KEY (quadra_id) REFERENCES tb_quadra(id) ON DELETE CASCADE,
    CONSTRAINT fk_chamado_autor FOREIGN KEY (autor_id) REFERENCES tb_usuario(id)
);

-- Índices para otimização de consultas críticas
CREATE INDEX idx_reserva_quadra_datas ON tb_reserva(quadra_id, data_inicio, data_fim);
CREATE INDEX idx_reserva_usuario_status ON tb_reserva(usuario_id, status);
CREATE INDEX idx_turma_quadra_dia ON tb_turma_social(quadra_id, dia_semana);
CREATE INDEX idx_chamado_quadra_status ON tb_chamado_zeladoria(quadra_id, status);