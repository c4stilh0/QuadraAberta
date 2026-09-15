-- ====================================================================
-- Migration V5: Sistema de Reputação e Habilidade Técnica Comunitária
-- ====================================================================

-- 1. Novos campos em tb_usuario para Reputação e Habilidade
ALTER TABLE tb_usuario
    ADD COLUMN IF NOT EXISTS reputacao NUMERIC(3,2) DEFAULT 5.00 NOT NULL,
    ADD COLUMN IF NOT EXISTS total_avaliacoes_reputacao INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS habilidade_declarada VARCHAR(30) DEFAULT 'JOGADOR_CASUAL' NOT NULL,
    ADD COLUMN IF NOT EXISTS habilidade_validada NUMERIC(3,2),
    ADD COLUMN IF NOT EXISTS total_avaliacoes_habilidade INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS streak_positiva INT DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS streak_negativa INT DEFAULT 0 NOT NULL;

-- 2. Tabela de Avaliações Anônimas entre Jogadores
CREATE TABLE IF NOT EXISTS tb_avaliacao_usuario (
    id BIGSERIAL PRIMARY KEY,
    avaliador_id BIGINT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    avaliado_id BIGINT NOT NULL REFERENCES tb_usuario(id) ON DELETE CASCADE,
    partida_id BIGINT NOT NULL REFERENCES tb_partida_match(id) ON DELETE CASCADE,
    nota_reputacao INT NOT NULL CHECK (nota_reputacao BETWEEN 1 AND 5),
    nivel_habilidade VARCHAR(30),
    comentario VARCHAR(255),
    criado_em TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uk_avaliacao_partida_par UNIQUE (partida_id, avaliador_id, avaliado_id),
    CONSTRAINT chk_avaliacao_nao_autoavaliar CHECK (avaliador_id <> avaliado_id)
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_avaliado ON tb_avaliacao_usuario(avaliado_id);
CREATE INDEX IF NOT EXISTS idx_avaliacao_partida ON tb_avaliacao_usuario(partida_id);
