-- Migration V4: Sistema de Matchmaking Esportivo Inteligente
-- Criação de partidas colaborativas e confirmação de presença georreferenciada

CREATE TABLE tb_partida_match (
    id BIGSERIAL PRIMARY KEY,
    criador_id BIGINT NOT NULL,
    esporte VARCHAR(50) NOT NULL,
    data_hora TIMESTAMP NOT NULL,
    duracao_minutos INTEGER NOT NULL DEFAULT 60,
    min_jogadores INTEGER NOT NULL DEFAULT 10,
    max_jogadores INTEGER NOT NULL DEFAULT 14,
    descricao TEXT,
    bairro_criador VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'BUSCANDO_JOGADORES',
    quadra_escolhida_id BIGINT,
    centroide_lat DOUBLE PRECISION,
    centroide_lng DOUBLE PRECISION,
    criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_partida_criador FOREIGN KEY (criador_id) REFERENCES tb_usuario(id) ON DELETE CASCADE,
    CONSTRAINT fk_partida_quadra_escolhida FOREIGN KEY (quadra_escolhida_id) REFERENCES tb_quadra(id) ON DELETE SET NULL
);

CREATE TABLE tb_partida_participante (
    id BIGSERIAL PRIMARY KEY,
    partida_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    bairro VARCHAR(100) NOT NULL,
    confirmado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_participante_partida FOREIGN KEY (partida_id) REFERENCES tb_partida_match(id) ON DELETE CASCADE,
    CONSTRAINT fk_participante_usuario FOREIGN KEY (usuario_id) REFERENCES tb_usuario(id) ON DELETE CASCADE,
    CONSTRAINT uk_partida_participante UNIQUE (partida_id, usuario_id)
);

-- Índices para consultas de matchmaking e filtros rápidos
CREATE INDEX idx_partida_esporte_status ON tb_partida_match(esporte, status);
CREATE INDEX idx_partida_data_hora ON tb_partida_match(data_hora);
CREATE INDEX idx_partida_criador ON tb_partida_match(criador_id);
CREATE INDEX idx_participante_usuario ON tb_partida_participante(usuario_id);
